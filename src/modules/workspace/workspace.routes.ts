import { Router } from 'express';
import { authGuard } from '../auth/auth.middleware';
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
  validateAppearanceUpdate,
  validateAppearancePreview
} from './workspace.validation';

const router = Router();

// Workspace APIs
router.post('/workspaces', authGuard, validateCreateWorkspace, controller.postWorkspace);
router.get('/workspaces', authGuard, controller.getWorkspaces);
router.get('/workspaces/:workspaceId', authGuard, controller.getWorkspace);

// Bot APIs
router.post('/workspaces/:workspaceId/bots', authGuard, validateCreateBot, controller.postBot);
router.get('/workspaces/:workspaceId/bots', authGuard, validateListBots, controller.getBots);
router.patch('/bots/:botId', authGuard, validateUpdateBot, controller.patchBot);

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
router.get('/public/bots/:botId/appearance', controller.getPublicAppearance);

export default router;

