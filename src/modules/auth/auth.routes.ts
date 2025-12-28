import { Router } from 'express';
import * as controller from './auth.controller';
import { validateForgotPassword, validateLogin, validateRefresh, validateResetPassword, validateSignup } from './auth.validation';

const router = Router();

router.post('/signup', validateSignup, controller.signup);
router.post('/login', validateLogin, controller.login);
router.post('/refresh', validateRefresh, controller.refresh);
router.post('/forgot-password', validateForgotPassword, controller.forgotPassword);
router.post('/reset-password', validateResetPassword, controller.resetPassword);

export default router;

