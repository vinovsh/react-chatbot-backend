import { Router } from 'express';
import { authGuard } from '../auth/auth.middleware';
import { getWebhook, putWebhook, deleteWebhook } from '../webhooks/webhooks';
import { recordWidgetActivity, getWidgetResponses } from './widget-activity.controller';
import { getWorkspaceSettings, renameWorkspace } from './workspace-settings.controller';
import * as controller from './workspace.controller';
import {
  validateCreateWorkspace,
  validateCreateBot,
  validateListBots,
  validateUpdateBot,
  validateSaveFlow,
  validateStartConversation,
  validatePostMessage,
  validatePostLead,
  validateListLeads,
  validateUpdateLead,
  validateAppearanceUpdate,
  validateAppearancePreview
} from './workspace.validation';

const router = Router();

// Workspace APIs
router.post('/workspaces', authGuard, validateCreateWorkspace, controller.postWorkspace);
router.get('/workspaces', authGuard, controller.getWorkspaces);
router.get('/workspaces/:workspaceId', authGuard, controller.getWorkspace);
router.get('/workspaces/:workspaceId/settings', authGuard, getWorkspaceSettings);
router.patch('/workspaces/:workspaceId/settings', authGuard, renameWorkspace);

// Bot APIs
router.post('/workspaces/:workspaceId/bots', authGuard, validateCreateBot, controller.postBot);
router.get('/workspaces/:workspaceId/bots', authGuard, validateListBots, controller.getBots);
router.patch('/bots/:botId', authGuard, validateUpdateBot, controller.patchBot);

// Workspace-scoped routes used by the builder. Existing bot routes also remain available.
const botPath = '/workspaces/:workspaceId/bots/:botId';
router.get(botPath, authGuard, controller.getBot);
router.patch(botPath, authGuard, validateUpdateBot, controller.patchBot);
router.post(botPath + '/publish', authGuard, controller.postPublishBot);
router.get(botPath + '/flow', authGuard, controller.getBotFlowController);
router.put(botPath + '/flow', authGuard, validateSaveFlow, controller.putBotFlow);
router.get(botPath + '/appearance', authGuard, controller.getAppearance);
router.put(botPath + '/appearance', authGuard, validateAppearanceUpdate, controller.putAppearance);
router.get(botPath + '/webhook', authGuard, getWebhook);
router.put(botPath + '/webhook', authGuard, putWebhook);
router.delete(botPath + '/webhook', authGuard, deleteWebhook);
router.get(botPath + '/responses', authGuard, getWidgetResponses);
router.get(botPath + '/leads', authGuard, validateListLeads, controller.getLeads);
router.get(botPath + '/leads/:leadId', authGuard, controller.getLead);
router.patch(botPath + '/leads/:leadId', authGuard, validateUpdateLead, controller.patchLead);
router.delete(botPath + '/leads/:leadId', authGuard, controller.deleteLead);

// Bot Flow APIs
router.get('/bots/:botId/flow', authGuard, controller.getBotFlowController);
router.put('/bots/:botId/flow', authGuard, validateSaveFlow, controller.putBotFlow);

// Conversation APIs (public start, internal fetch)
router.post('/bots/:botId/conversations', validateStartConversation, controller.postConversation);
router.get('/conversations/:conversationId', controller.getConversationController);

// Message APIs
router.post('/conversations/:conversationId/messages', validatePostMessage, controller.postMessage);
router.get('/conversations/:conversationId/messages', authGuard, controller.getMessages);

// Lead APIs
router.post('/conversations/:conversationId/leads', validatePostLead, controller.postLead);
router.get('/bots/:botId/leads', authGuard, validateListLeads, controller.getLeads);

// Bot Appearance APIs
router.get('/bots/:botId/appearance', authGuard, controller.getAppearance);
router.put('/bots/:botId/appearance', authGuard, validateAppearanceUpdate, controller.putAppearance);
router.post(
  '/bots/:botId/appearance/preview',
  authGuard,
  validateAppearancePreview,
  controller.postAppearancePreview
);
router.get('/public/bots/:botId/widget', controller.getPublicWidget);
router.post('/public/bots/:botId/widget/activity', recordWidgetActivity);
router.get('/public/bots/:botId/appearance', controller.getPublicAppearance);

export default router;

