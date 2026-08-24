import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth';
import {
  customerRegisterSchema,
  vendorRegisterSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../schemas/auth.schema';

const router = Router();

router.post('/register/customer', validateRequest(customerRegisterSchema), authController.registerCustomer);
router.post('/register/vendor', validateRequest(vendorRegisterSchema), authController.registerVendor);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/refresh', validateRequest(refreshTokenSchema), authController.refresh);
router.post('/logout', authenticate as any, authController.logout as any);
router.get('/me', authenticate as any, authController.getMe as any);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), authController.resetPassword);

export const authRoutes = router;
