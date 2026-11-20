import { Types } from 'mongoose';
import { Workspace } from '../../models/workspace.model';
import { Bot } from '../../models/bot.model';
import { BotFlow } from '../../models/bot-flow.model';
import { Conversation } from '../../models/conversation.model';
import { Message } from '../../models/message.model';
import { Lead } from '../../models/lead.model';
import { BotAppearance } from '../../models/bot-appearence.model';

export async function createWorkspace(params: {
  name: string;
  ownerId: string;
}) {
  const ownerObjectId = new Types.ObjectId(params.ownerId);
  const workspace = await Workspace.create({
    name: params.name,
    owner: ownerObjectId,
    members: [ownerObjectId]
  });
  return workspace;
}

export async function listWorkspacesForUser(userId: string) {
  const userObjectId = new Types.ObjectId(userId);
  return Workspace.find({
    $or: [{ owner: userObjectId }, { members: userObjectId }]
  })
    .sort({ createdAt: -1 })
    .lean();
}

export async function getWorkspaceForUser(workspaceId: string, userId: string) {
  if (!Types.ObjectId.isValid(workspaceId)) return null;
  const workspaceObjectId = new Types.ObjectId(workspaceId);
  const userObjectId = new Types.ObjectId(userId);
  return Workspace.findOne({
    _id: workspaceObjectId,
    $or: [{ owner: userObjectId }, { members: userObjectId }]
  })
    .lean()
    .exec();
}

export async function assertWorkspaceAccess(workspaceId: string, userId: string) {
  return getWorkspaceForUser(workspaceId, userId);
}

export async function createBot(params: {
  workspaceId: string;
  name: string;
  theme?: object;
}) {
  const workspaceObjectId = new Types.ObjectId(params.workspaceId);
  const bot = await Bot.create({
    workspaceId: workspaceObjectId,
    name: params.name,
    status: 'draft',
    theme: params.theme || {}
  });

  await BotFlow.create({
    botId: bot._id,
    nodes: [],
    edges: [],
    version: 1
  });

  return bot;
}

export async function listBotsForWorkspace(workspaceId: string, query: { search?: string }) {
  const workspaceObjectId = new Types.ObjectId(workspaceId);
  const filter: any = { workspaceId: workspaceObjectId };
  if (query.search) {
    filter.name = { $regex: query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  }
  const bots = await Bot.find(filter).sort({ createdAt: -1 }).lean();
  if (bots.length === 0) return bots;
  const match = { botId: { $in: bots.map((bot) => bot._id) } };
  const countByBot = [{ $match: match }, { $group: { _id: '$botId', total: { $sum: 1 } } }];
  const [conversations, leads] = await Promise.all([
    Conversation.aggregate<{ _id: Types.ObjectId; total: number }>(countByBot),
    Lead.aggregate<{ _id: Types.ObjectId; total: number }>(countByBot)
  ]);
  const conversationCounts = new Map(conversations.map(({ _id, total }) => [_id.toString(), total]));
  const leadCounts = new Map(leads.map(({ _id, total }) => [_id.toString(), total]));
  return bots.map((bot) => ({
    ...bot,
    stats: {
      totalConversations: conversationCounts.get(bot._id.toString()) ?? 0,
      totalLeads: leadCounts.get(bot._id.toString()) ?? 0
    }
  }));
}

export async function getBotWithWorkspaceCheck(botId: string, userId: string, workspaceId?: string) {
  if (!Types.ObjectId.isValid(botId)) return null;
  const bot = await Bot.findById(botId).lean();
  if (!bot?.workspaceId || (workspaceId && !bot.workspaceId.equals(workspaceId))) return null;
  const workspace = await getWorkspaceForUser(bot.workspaceId.toString(), userId);
  if (!workspace) return null;
  return bot;
}

export async function updateBot(
  botId: string,
  data: Partial<{ name: string; status: 'draft' | 'published'; theme?: object }>
) {
  return Bot.findByIdAndUpdate(botId, data, { new: true }).lean();
}

export async function getBotFlow(botId: string) {
  return BotFlow.findOne({ botId }).sort({ version: -1 }).lean();
}

export async function saveBotFlow(params: {
  botId: string;
  nodes: any[];
  edges: any[];
}) {
  const latest = await BotFlow.findOne({ botId: params.botId }).sort({ version: -1 }).lean();
  const nextVersion = (latest?.version || 0) + 1;
  const flow = await BotFlow.create({
    botId: params.botId,
    nodes: params.nodes,
    edges: params.edges,
    version: nextVersion
  });
  return flow;
}

export async function startConversation(params: {
  botId: string;
  sessionId: string;
  visitor: { ip?: string; userAgent?: string };
}) {
  const conversation = await Conversation.create({
    botId: params.botId,
    sessionId: params.sessionId,
    visitor: params.visitor
  });
  return conversation;
}

export async function getConversation(conversationId: string) {
  if (!Types.ObjectId.isValid(conversationId)) return null;
  return Conversation.findById(conversationId).lean();
}

export async function addMessage(params: {
  conversationId: string;
  sender: 'bot' | 'user';
  content: string;
  nodeId?: string;
}) {
  const message = await Message.create({
    conversationId: params.conversationId,
    sender: params.sender,
    content: params.content,
    nodeId: params.nodeId
  });
  return message;
}

export async function listMessages(conversationId: string) {
  return Message.find({ conversationId })
    .sort({ createdAt: 1 })
    .lean();
}

export async function upsertLead(params: {
  botId: string;
  conversationId: string;
  data: Record<string, any>;
}) {
  const existing = await Lead.findOne({
    botId: params.botId,
    conversationId: params.conversationId
  });

  if (existing) {
    existing.data = { ...existing.data, ...params.data };
    await existing.save();
    return existing;
  }

  const lead = await Lead.create({
    botId: params.botId,
    conversationId: params.conversationId,
    data: params.data
  });

  return lead;
}

export async function listLeadsForBot(botId: string, query: { from?: Date; to?: Date }) {
  const filter: any = { botId };
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = query.from;
    if (query.to) filter.createdAt.$lte = query.to;
  }
  return Lead.find(filter).sort({ createdAt: -1 }).lean();
}

const DEFAULT_APPEARANCE = {
  avatar: {
    type: 'default' as const,
    url: undefined as string | undefined
  },
  theme: {
    type: 'solid' as const,
    solid: { color: '#16A34A' },
    gradient: { angle: 135, colors: [] as string[] }
  },
  position: 'bottom-right' as const,
  branding: {
    showBranding: true,
    brandLogoUrl: undefined as string | undefined
  },
  isDraft: true
};

export async function getAppearanceForBot(botId: string, { publishedOnly = false } = {}) {
  const query: any = { botId };
  if (publishedOnly) {
    query.isDraft = false;
  }
  const doc = await BotAppearance.findOne(query).lean();
  if (!doc) {
    return { ...DEFAULT_APPEARANCE, botId };
  }
  return doc;
}

export async function upsertAppearanceForBot(botId: string, payload: any) {
  const existing = await BotAppearance.findOne({ botId });
  if (!existing) {
    const created = await BotAppearance.create({
      botId,
      ...buildAppearancePreview(DEFAULT_APPEARANCE, payload)
    });
    return created.toObject();
  }

  existing.set(buildAppearancePreview(existing.toObject(), payload));
  await existing.save();
  return existing.toObject();
}

export function buildAppearancePreview(saved: any, overrides: any) {
  const base = saved || DEFAULT_APPEARANCE;
  const payload = overrides || {};
  return {
    ...base,
    ...payload,
    avatar: { ...(base as any).avatar, ...(payload.avatar || {}) },
    theme: {
      ...(base as any).theme,
      ...(payload.theme || {}),
      solid: {
        ...(base as any).theme?.solid,
        ...(payload.theme?.solid || {})
      },
      gradient: {
        ...(base as any).theme?.gradient,
        ...(payload.theme?.gradient || {})
      }
    },
    branding: { ...(base as any).branding, ...(payload.branding || {}) }
  };
}


export async function publishBot(botId: string) {
  const [flow, appearance] = await Promise.all([getBotFlow(botId), getAppearanceForBot(botId)]);
  const start = flow?.nodes.find((node) => node?.type === 'webNodeStart');
  if (!flow || !start) return null;
  const validNodes = flow.nodes.every((node) => typeof node?.id === 'string' &&
    ['webNodeStart', 'MessageNode', 'QuestionNode', 'MultiChoiceNode'].includes(node.type));
  const nodeIds = new Set(flow.nodes.map((node) => node?.id));
  if (!validNodes || nodeIds.size !== flow.nodes.length) return null;
  if (!flow.edges.every((edge) => nodeIds.has(edge?.source) && nodeIds.has(edge?.target) &&
    edge.source !== edge.target && edge.target !== start.id)) return null;
  if (!flow.edges.some((edge) => edge.source === start.id)) return null;

  return Bot.findByIdAndUpdate(
    botId,
    {
      status: 'published',
      publishedFlowId: flow._id,
      publishedAppearance: { ...appearance, isDraft: false },
      publishedAt: new Date()
    },
    { new: true }
  ).lean();
}

export async function getPublishedBotAppearance(botId: string) {
  if (!Types.ObjectId.isValid(botId)) return null;
  const bot = await Bot.findOne({ _id: botId, status: 'published' }).select('+publishedAppearance').lean();
  if (!bot) return null;
  if (bot.publishedAppearance) return bot.publishedAppearance;
  const legacyAppearance = await getAppearanceForBot(botId, { publishedOnly: true });
  return legacyAppearance.isDraft ? null : legacyAppearance;
}

export async function getPublishedWidget(botId: string) {
  if (!Types.ObjectId.isValid(botId)) return null;
  const bot = await Bot.findOne({ _id: botId, status: 'published' }).select('+publishedAppearance').lean();
  if (!bot?.publishedFlowId) return null;
  const flow = await BotFlow.findOne({ _id: bot.publishedFlowId, botId }).lean();
  if (!flow) return null;

  const nodes = flow.nodes.map((node) => ({
    id: node.id,
    type: node.type,
    message: typeof node.data?.message === 'string' ? node.data.message : '',
    choices: node.type === 'MultiChoiceNode' && Array.isArray(node.data?.handle?.outputs)
      ? node.data.handle.outputs
          .filter((choice: any) => typeof choice?.title === 'string' && typeof choice?.uid === 'string')
          .map((choice: any) => ({ title: choice.title, id: choice.uid }))
      : []
  }));
  const edges = flow.edges.map(({ source, target, sourceHandle }) => ({ source, target, sourceHandle }));
  return { name: bot.name, nodes, edges, appearance: bot.publishedAppearance };
}
