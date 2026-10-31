import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { autenticar } from '../middlewares/authMiddleware';
import { limitarLogin } from '../middlewares/rateLimitMiddleware';

const router = Router();
const authController = new AuthController();

router.post('/auth/register', authController.registrar);
router.post('/auth/login', limitarLogin, authController.login);
router.get('/auth/me', autenticar, authController.me);

export default router;
