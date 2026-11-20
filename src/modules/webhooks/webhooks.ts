import { Request, Response } from 'express';
import { Schema, model, Types } from 'mongoose';
import { getBotWithWorkspaceCheck, getWorkspaceForUser } from '../workspace/workspace.service';
import { Conversation } from '../../models/conversation.model';

const endpointSchema = new Schema({
  botId: { type: Schema.Types.ObjectId, required: true, unique: true },
  url: { type: String, required: true, select: false },
  provider: { type: String, required: true },
  revision: { type: Schema.Types.ObjectId, required: true },
}, { timestamps: true });

const deliverySchema = new Schema({
  botId: { type: Schema.Types.ObjectId, required: true },
  conversationId: { type: Schema.Types.ObjectId, required: true },
  destinationId: { type: Schema.Types.ObjectId, required: true },
  answers: [{ _id: false, nodeId: String, value: String }],
  status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
  attempts: { type: Number, default: 0 },
  nextAttemptAt: { type: Date, default: Date.now },
}, { timestamps: true });
deliverySchema.index({ botId: 1, conversationId: 1 }, { unique: true });
deliverySchema.index({ status: 1, nextAttemptAt: 1 });

const Endpoint = model('BotWebhookEndpoint', endpointSchema);
const Delivery = model('BotWebhookDelivery', deliverySchema);

function parseDestination(value: unknown) {
  if (typeof value !== 'string' || value.length > 512) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.search || url.hash) return null;
    if (url.hostname === 'hooks.zapier.com' && /^\/hooks\/catch\/\d+\/[a-z0-9_-]+\/?$/i.test(url.pathname)) {
      return { url: url.href, provider: 'Zapier' };
    }
    if (['hook.us1.make.com', 'hook.us2.make.com', 'hook.eu1.make.com', 'hook.eu2.make.com'].includes(url.hostname) &&
        /^\/[a-z0-9]+\/?$/i.test(url.pathname)) {
      return { url: url.href, provider: 'Make' };
    }
  } catch {
    return null;
  }
  return null;
}

async function access(req: Request) {
  const userId = req.user!.id;
  const bot = await getBotWithWorkspaceCheck(req.params.botId, userId, req.params.workspaceId);
  if (!bot) return null;
  const workspace = await getWorkspaceForUser(req.params.workspaceId, userId);
  return workspace && { bot, canManage: workspace.owner.equals(userId) };
}

export async function getWebhook(req: Request, res: Response) {
  const scoped = await access(req);
  if (!scoped) return res.status(404).json({ success: false, message: 'Bot not found' });
  const endpoint = await Endpoint.findOne({ botId: scoped.bot._id }).select('provider revision').lean();
  const latest = endpoint && await Delivery.findOne({ botId: scoped.bot._id, destinationId: endpoint.revision })
    .select('status attempts updatedAt').sort({ createdAt: -1 }).lean();
  return res.json({ success: true, data: { provider: endpoint?.provider, canManage: scoped.canManage, latest } });
}

export async function putWebhook(req: Request, res: Response) {
  const scoped = await access(req);
  if (!scoped?.canManage) return res.status(403).json({ success: false, message: 'Only the workspace owner can manage webhooks' });
  const destination = parseDestination(req.body?.url);
  if (!destination) return res.status(422).json({ success: false, message: 'Use a Zapier Catch Hook or Make custom webhook URL' });
  // A replaced destination gets a new identity so pending payloads aren't sent to a new account.
  await Endpoint.updateOne({ botId: scoped.bot._id }, {
    $set: { ...destination, revision: new Types.ObjectId() },
  }, { upsert: true });
  return res.json({ success: true });
}

export async function deleteWebhook(req: Request, res: Response) {
  const scoped = await access(req);
  if (!scoped?.canManage) return res.status(403).json({ success: false, message: 'Only the workspace owner can manage webhooks' });
  await Endpoint.deleteOne({ botId: scoped.bot._id });
  return res.json({ success: true });
}

export async function queueWebhook(botId: string, conversationId: Types.ObjectId) {
  const destination = await Endpoint.findOne({ botId }).select('revision').lean();
  if (!destination) return;
  const record = await Conversation.findOne({ _id: conversationId, botId }).select('widgetAnswers').lean();
  if (!record) return;
  const answers = record.widgetAnswers?.map(({ nodeId, value }) => ({ nodeId, value })) ?? [];
  await Delivery.updateOne({ botId, conversationId }, {
    $setOnInsert: { destinationId: destination.revision, answers },
  }, { upsert: true });
}

async function sendNextWebhook() {
  const job = await Delivery.findOneAndUpdate({
    status: 'pending', nextAttemptAt: { $lte: new Date() }, attempts: { $lt: 4 },
  }, {
    $inc: { attempts: 1 }, $set: { nextAttemptAt: new Date(Date.now() + 60_000) },
  }, { new: true, sort: { nextAttemptAt: 1 } }).lean();
  if (!job) return;

  const endpoint = await Endpoint.findOne({ botId: job.botId, revision: job.destinationId }).select('+url').lean();
  const destination = parseDestination(endpoint?.url);
  let delivered = false;
  if (destination) {
    try {
      const response = await fetch(destination.url, {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(5000),
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': job._id.toString() },
        body: JSON.stringify({
          event: 'chatbot.response',
          botId: job.botId,
          responseId: job.conversationId,
          answers: job.answers,
        }),
      });
      delivered = response.ok;
      await response.body?.cancel();
    } catch {
      // The persisted retry time is used on the next attempt.
    }
  }
  if (delivered || !destination || job.attempts >= 4) {
    await Delivery.updateOne({ _id: job._id }, { $set: { status: delivered ? 'sent' : 'failed' } });
  }
}

export function startWebhookDelivery() {
  let running = false;
  const timer = setInterval(() => {
    if (running) return;
    running = true;
    void sendNextWebhook().catch(() => {
      // A transient database failure is retried on the next timer tick.
    }).finally(() => { running = false; });
  }, 5000);
  timer.unref();
}
