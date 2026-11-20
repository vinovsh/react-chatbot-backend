import { Request, Response } from 'express';
import Joi from 'joi';
import { Types } from 'mongoose';
import { User } from '../../models/user.model';
import { Workspace } from '../../models/workspace.model';
import { getWorkspaceForUser } from './workspace.service';

export async function getWorkspaceSettings(req: Request, res: Response) {
  const workspace = await getWorkspaceForUser(req.params.workspaceId, req.user!.id);
  if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });

  const users = await User.find({ _id: { $in: [workspace.owner, ...workspace.members] } })
    .select('name email').sort({ name: 1 }).lean();
  return res.json({
    success: true,
    data: {
      name: workspace.name,
      canManage: workspace.owner.equals(req.user!.id),
      members: users.map(({ _id, name, email }) => ({
        _id, name, email, role: workspace.owner.equals(_id) ? 'Owner' : 'Member'
      }))
    }
  });
}

const renameSchema = Joi.object({ name: Joi.string().trim().min(3).max(100).required() }).required();

export async function renameWorkspace(req: Request, res: Response) {
  if (!Types.ObjectId.isValid(req.params.workspaceId)) {
    return res.status(404).json({ success: false, message: 'Workspace not found' });
  }
  const { error, value } = renameSchema.validate(req.body);
  if (error) return res.status(422).json({ success: false, message: error.message });

  const result = await Workspace.updateOne(
    { _id: req.params.workspaceId, owner: req.user!.id },
    { $set: { name: value.name } }
  );
  if (!result.matchedCount) return res.status(404).json({ success: false, message: 'Workspace not found or you are not its owner' });
  return res.json({ success: true, data: { name: value.name } });
}
