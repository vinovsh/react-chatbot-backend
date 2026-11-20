import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Lead } from '../../models/lead.model';
import {
  createWorkspace,
  listWorkspacesForUser,
  getWorkspaceForUser,
  assertWorkspaceAccess,
  createBot,
  listBotsForWorkspace,
  getBotWithWorkspaceCheck,
  updateBot,
  getBotFlow,
  saveBotFlow,
  startConversation,
  getConversation,
  addMessage,
  listMessages,
  upsertLead,
  listLeadsForBot,
  getAppearanceForBot,
  upsertAppearanceForBot,
  publishBot,
  getPublishedBotAppearance,
  getPublishedWidget,
  buildAppearancePreview
} from './workspace.service';

export async function postWorkspace(req: Request, res: Response) {
  const userId = (req as any).user?.id as string;
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'Invalid workspace name' });
  }
  const workspace = await createWorkspace({ name: name.trim(), ownerId: userId });
  return res.status(201).json({ success: true, data: workspace });
}

export async function getWorkspaces(req: Request, res: Response) {
  const userId = (req as any).user?.id as string;
  const workspaces = await listWorkspacesForUser(userId);
  return res.json({ success: true, data: workspaces });
}

export async function getWorkspace(req: Request, res: Response) {
  const userId = (req as any).user?.id as string;
  const { workspaceId } = req.params;
  const workspace = await getWorkspaceForUser(workspaceId, userId);
  if (!workspace) {
    return res.status(404).json({ success: false, message: 'Workspace not found' });
  }
  return res.json({ success: true, data: workspace });
}

export async function postBot(req: Request, res: Response) {
  const userId = (req as any).user?.id as string;
  const { workspaceId } = req.params;
  const { name, theme } = req.body;

  const workspace = await assertWorkspaceAccess(workspaceId, userId);
  if (!workspace) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  if (!name || typeof name !== 'string' || name.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'Invalid bot name' });
  }

  const bot = await createBot({ workspaceId, name: name.trim(), theme: theme || {} });
  return res.status(201).json({ success: true, data: bot });
}

export async function getBots(req: Request, res: Response) {
  const userId = (req as any).user?.id as string;
  const { workspaceId } = req.params;
  const workspace = await assertWorkspaceAccess(workspaceId, userId);
  if (!workspace) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  const bots = await listBotsForWorkspace(workspaceId, { search: res.locals.validatedQuery.search });
  return res.json({ success: true, data: bots });
}

export async function getBot(req: Request, res: Response) {
  const bot = await getBotWithWorkspaceCheck(req.params.botId, req.user!.id, req.params.workspaceId);
  if (!bot) {
    return res.status(404).json({ success: false, message: 'Bot not found' });
  }
  return res.json({ success: true, data: bot });
}

export async function patchBot(req: Request, res: Response) {
  const userId = (req as any).user?.id as string;
  const { botId } = req.params;
  const bot = await getBotWithWorkspaceCheck(botId, userId, req.params.workspaceId);
  if (!bot) {
    return res.status(404).json({ success: false, message: 'Bot not found' });
  }

  const { name, status, theme } = req.body;
  if (status && !['draft', 'published'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const updated = await updateBot(botId, { name, status, theme });
  return res.json({ success: true, data: updated });
}

export async function getBotFlowController(req: Request, res: Response) {
  const userId = (req as any).user?.id as string;
  const { botId } = req.params;
  const bot = await getBotWithWorkspaceCheck(botId, userId, req.params.workspaceId);
  if (!bot) {
    return res.status(404).json({ success: false, message: 'Bot not found' });
  }
  const flow = await getBotFlow(botId);
  return res.json({ success: true, data: flow });
}

export async function putBotFlow(req: Request, res: Response) {
  const userId = (req as any).user?.id as string;
  const { botId } = req.params;
  const bot = await getBotWithWorkspaceCheck(botId, userId, req.params.workspaceId);
  if (!bot) {
    return res.status(404).json({ success: false, message: 'Bot not found' });
  }

  const { nodes, edges } = req.body;
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    return res.status(400).json({ success: false, message: 'Invalid flow structure' });
  }

  const flow = await saveBotFlow({ botId, nodes, edges });
  return res.json({ success: true, data: flow });
}

export async function postConversation(req: Request, res: Response) {
  const { botId } = req.params;
  const sessionId = req.body.sessionId || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const visitor = {
    ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '',
    userAgent: req.headers['user-agent']
  };

  const conversation = await startConversation({ botId, sessionId, visitor });
  return res.status(201).json({ success: true, data: conversation });
}

export async function getConversationController(req: Request, res: Response) {
  const { conversationId } = req.params;
  const conversation = await getConversation(conversationId);
  if (!conversation) {
    return res.status(404).json({ success: false, message: 'Conversation not found' });
  }
  return res.json({ success: true, data: conversation });
}

export async function postMessage(req: Request, res: Response) {
  const { conversationId } = req.params;
  const { sender, content, nodeId } = req.body;
  if (!['bot', 'user'].includes(sender)) {
    return res.status(400).json({ success: false, message: 'Invalid sender' });
  }
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid content' });
  }
  const message = await addMessage({ conversationId, sender, content, nodeId });
  return res.status(201).json({ success: true, data: message });
}

export async function getMessages(req: Request, res: Response) {
  const userId = (req as any).user?.id as string;
  const { conversationId } = req.params;
  const conversation = await getConversation(conversationId);
  if (!conversation) {
    return res.status(404).json({ success: false, message: 'Conversation not found' });
  }

  const bot = await getBotWithWorkspaceCheck((conversation.botId as any).toString(), userId);
  if (!bot) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const messages = await listMessages(conversationId);
  return res.json({ success: true, data: messages });
}

export async function postLead(req: Request, res: Response) {
  const { conversationId } = req.params;
  const { botId, data } = req.body;

  if (!botId || typeof botId !== 'string') {
    return res.status(400).json({ success: false, message: 'botId is required' });
  }

  const lead = await upsertLead({ botId, conversationId, data: data || {} });
  return res.status(201).json({ success: true, data: lead });
}

export async function getLeads(req: Request, res: Response) {
  const userId = (req as any).user?.id as string;
  const { botId } = req.params;

  const bot = await getBotWithWorkspaceCheck(botId, userId, req.params.workspaceId);
  if (!bot) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const query = res.locals.validatedQuery;
  const from = query.from ? new Date(query.from) : undefined;
  const to = query.to ? new Date(query.to) : undefined;

  const leads = await listLeadsForBot(botId, { from, to });
  return res.json({ success: true, data: req.params.workspaceId ? leads.map((lead) => serializeLead(lead, req.params.workspaceId)) : leads });
}


function serializeLead(lead: { data?: Record<string, unknown> }, workspaceId: string) {
  const { name, email, phone, company, source, tags, status, ...customData } = lead.data ?? {};
  return { ...lead, workspaceId, name, email, phone, company, source, tags, status: status ?? 'new', customData };
}

async function findLeadFilter(req: Request) {
  const { botId, leadId, workspaceId } = req.params;
  if (!Types.ObjectId.isValid(leadId)) return null;
  const bot = await getBotWithWorkspaceCheck(botId, req.user!.id, workspaceId);
  return bot ? { _id: leadId, botId } : null;
}

export async function getLead(req: Request, res: Response) {
  const filter = await findLeadFilter(req);
  const lead = filter && await Lead.findOne(filter).lean();
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
  return res.json({ success: true, data: serializeLead(lead, req.params.workspaceId) });
}

export async function patchLead(req: Request, res: Response) {
  const filter = await findLeadFilter(req);
  const changes = Object.fromEntries(Object.entries(req.body).map(([key, value]) => ['data.' + key, value]));
  const lead = filter && await Lead.findOneAndUpdate(filter, { $set: changes }, { new: true }).lean();
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
  return res.json({ success: true, data: serializeLead(lead, req.params.workspaceId) });
}

export async function deleteLead(req: Request, res: Response) {
  const filter = await findLeadFilter(req);
  const lead = filter && await Lead.findOneAndDelete(filter);
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
  return res.json({ success: true });
}

export async function getAppearance(req: Request, res: Response) {
  const userId = (req as any).user?.id as string;
  const { botId } = req.params;

  const bot = await getBotWithWorkspaceCheck(botId, userId, req.params.workspaceId);
  if (!bot) {
    return res.status(404).json({ success: false, message: 'Bot not found' });
  }

  const appearance = await getAppearanceForBot(botId);
  return res.json({ success: true, data: appearance });
}

export async function putAppearance(req: Request, res: Response) {
  const userId = (req as any).user?.id as string;
  const { botId } = req.params;

  const bot = await getBotWithWorkspaceCheck(botId, userId, req.params.workspaceId);
  if (!bot) {
    return res.status(404).json({ success: false, message: 'Bot not found' });
  }

  const updated = await upsertAppearanceForBot(botId, req.body);
  return res.json({ success: true, data: updated });
}

export async function postAppearancePreview(req: Request, res: Response) {
  const userId = (req as any).user?.id as string;
  const { botId } = req.params;

  const bot = await getBotWithWorkspaceCheck(botId, userId, req.params.workspaceId);
  if (!bot) {
    return res.status(404).json({ success: false, message: 'Bot not found' });
  }

  const saved = await getAppearanceForBot(botId);
  const preview = buildAppearancePreview(saved, req.body);
  return res.json({ success: true, data: preview });
}

export async function postPublishBot(req: Request, res: Response) {
  const { botId, workspaceId } = req.params;
  const bot = await getBotWithWorkspaceCheck(botId, req.user!.id, workspaceId);
  if (!bot) return res.status(404).json({ success: false, message: 'Bot not found' });
  const published = await publishBot(botId);
  if (!published) {
    return res.status(409).json({ success: false, message: 'Save a flow with a connected start node before publishing' });
  }
  return res.json({ success: true, data: { bot: published } });
}

export async function getPublicAppearance(req: Request, res: Response) {
  const appearance = await getPublishedBotAppearance(req.params.botId);
  if (!appearance) {
    return res.status(404).json({ success: false, message: 'Appearance not found' });
  }
  return res.json({ success: true, data: appearance });
}

export async function getPublicWidget(req: Request, res: Response) {
  const widget = await getPublishedWidget(req.params.botId);
  if (!widget) return res.status(404).json({ success: false, message: 'Published chatbot not found' });
  return res.json({ success: true, data: widget });
}
