import { Router } from 'express';
import { authGuard } from '../../modules/auth/auth.middleware';
import * as controller from './user.controller';

const router = Router();

router.get('/me', authGuard, controller.getMe);
router.put('/me', authGuard, controller.updateMe);

export default router;

