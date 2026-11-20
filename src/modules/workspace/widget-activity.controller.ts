import { Request, Response } from 'express';
import { createHash } from 'node:crypto';
import Joi from 'joi';
import { Types } from 'mongoose';
import { Bot } from '../../models/bot.model';
import { Conversation } from '../../models/conversation.model';
import { BotFlow } from '../../models/bot-flow.model';
import { getBotWithWorkspaceCheck } from './workspace.service';
import { queueWebhook } from '../webhooks/webhooks';
import { Lead } from '../../models/lead.model';

const activity = Joi.object({
  session: Joi.string().guid({ version: 'uuidv4' }).required(),
  answer: Joi.object({
    key: Joi.string().guid({ version: 'uuidv4' }).required(),
    nodeId: Joi.string().max(200).required(),
    value: Joi.string().trim().max(2000).required(),
  }),
  completed: Joi.boolean(),
  webhookNodeId: Joi.string().max(200),
  contact: Joi.object({
    name: Joi.string().trim().max(100).required(),
    email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).max(254).required(),
    consent: Joi.boolean().valid(true).required(),
  }),
}).required();

export async function recordWidgetActivity(req: Request, res: Response) {
  const { botId } = req.params;
  const bot = Types.ObjectId.isValid(botId)
    ? await Bot.findOne({ _id: botId, status: 'published' }).select('publishedFlowId').lean() : null;
  if (!bot?.publishedFlowId) return res.status(404).json({ success: false, message: 'Published chatbot not found' });

  const { error, value } = activity.validate(req.body);
  if (error) return res.status(422).json({ success: false, message: error.message });

  if (value.answer) {
    const flow = await BotFlow.findOne({ _id: bot.publishedFlowId, botId }).select('nodes').lean();
    const node = flow?.nodes.find((candidate) => candidate.id === value.answer.nodeId);
    if (!node || !['QuestionNode', 'MultiChoiceNode'].includes(node.type) ||
        ['link', 'thanks', 'whatsapp', 'webhook'].includes(node.data?.kind)) {
      return res.status(422).json({ success: false, message: 'Question no longer available' });
    }
    const answer = value.answer.value;
    const kind = node.data?.kind;
    const numeric = Number(answer);
    const invalid =
      kind === 'email' && Boolean(Joi.string().email({ tlds: { allow: false } }).validate(answer).error) ||
      kind === 'phone' && !/^[+0-9 ()-]{7,25}$/.test(answer) ||
      kind === 'number' && !Number.isFinite(numeric) ||
      kind === 'range' && (!Number.isFinite(numeric) ||
        numeric < Math.min(node.data.min ?? 0, node.data.max ?? 100) ||
        numeric > Math.max(node.data.min ?? 0, node.data.max ?? 100)) ||
      kind === 'rating' && (!Number.isInteger(numeric) || numeric < 1 || numeric > 5) ||
      kind === 'scale' && (!Number.isInteger(numeric) || numeric < 0 || numeric > 10) ||
      kind === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(answer) || Boolean(Joi.string().isoDate().validate(answer).error)) ||
      kind === 'list' && !node.data.options?.includes(answer);
    if (invalid) return res.status(422).json({ success: false, message: 'Invalid answer for this question' });

    if (value.webhookNodeId && !flow?.nodes.some((candidate) =>
      candidate.id === value.webhookNodeId && candidate.data?.kind === 'webhook')) {
      return res.status(422).json({ success: false, message: 'Webhook node no longer available' });
    }
  }

  // Keep the visitor's key out of stored records and make repeated calls idempotent.
  const digest = createHash('sha256').update(botId.toLowerCase() + ':' + value.session.toLowerCase()).digest('hex');
  const id = new Types.ObjectId(digest.slice(0, 24));
  await Conversation.updateOne(
    { _id: id, botId },
    { $setOnInsert: { botId, sessionId: digest } },
    { upsert: true }
  );

  if (value.answer) {
    const result = await Conversation.updateOne(
      { _id: id, botId, 'widgetAnswers.key': { $ne: value.answer.key }, 'widgetAnswers.99': { $exists: false } },
      { $push: { widgetAnswers: { ...value.answer } }, ...(value.completed ? { $set: { isCompleted: true } } : {}) }
    );
    if (!result.matchedCount && !await Conversation.exists({ _id: id, botId, 'widgetAnswers.key': value.answer.key })) {
      return res.status(409).json({ success: false, message: 'This conversation has reached its answer limit' });
    }
  }

  if (value.answer && (value.completed || value.webhookNodeId)) await queueWebhook(botId, id);

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

export async function getWidgetResponses(req: Request, res: Response) {
  const { botId, workspaceId } = req.params;
  const bot = await getBotWithWorkspaceCheck(botId, req.user!.id, workspaceId);
  if (!bot) return res.status(404).json({ success: false, message: 'Bot not found' });
  const data = await Conversation.find({ botId, 'widgetAnswers.0': { $exists: true } })
    .select('widgetAnswers isCompleted createdAt').sort({ createdAt: -1 }).limit(50).lean();
  return res.json({ success: true, data });
}
