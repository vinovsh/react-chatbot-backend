import { Request, Response } from 'express';
import { createHash } from 'node:crypto';
import Joi from 'joi';
import { Types } from 'mongoose';
import { Bot } from '../../models/bot.model';
import { Conversation } from '../../models/conversation.model';
import { Lead } from '../../models/lead.model';

const activity = Joi.object({
  session: Joi.string().guid({ version: 'uuidv4' }).required(),
  contact: Joi.object({
    name: Joi.string().trim().max(100).required(),
    email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).max(254).required(),
    consent: Joi.boolean().valid(true).required(),
  }),
}).required();

export async function recordWidgetActivity(req: Request, res: Response) {
  const { botId } = req.params;
  if (!Types.ObjectId.isValid(botId) || !await Bot.exists({ _id: botId, status: 'published', publishedFlowId: { $ne: null } })) {
    return res.status(404).json({ success: false, message: 'Published chatbot not found' });
  }

  const { error, value } = activity.validate(req.body);
  if (error) return res.status(422).json({ success: false, message: error.message });

  // Keep the visitor's key out of stored records and make repeated calls idempotent.
  const digest = createHash('sha256').update(botId.toLowerCase() + ':' + value.session.toLowerCase()).digest('hex');
  const id = new Types.ObjectId(digest.slice(0, 24));
  await Conversation.updateOne(
    { _id: id, botId },
    { $setOnInsert: { botId, sessionId: digest } },
    { upsert: true }
  );

  if (value.contact) {
    const { name, email } = value.contact;
    await Lead.updateOne(
      { _id: id, botId, conversationId: id },
      { $setOnInsert: { botId, conversationId: id, data: { name, email, source: 'Website chatbot', status: 'new' } } },
      { upsert: true }
    );
  }
  return res.json({ success: true });
}
