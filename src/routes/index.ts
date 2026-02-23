import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/user/user.routes';
import workspaceRoutes from '../modules/workspace/workspace.routes';
import uploadsRoutes from '../modules/uploads/uploads.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/', workspaceRoutes);
router.use('/', uploadsRoutes);

export default router;

