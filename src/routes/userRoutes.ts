import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { apenasProfessor } from '../middlewares/authMiddleware';

const router = Router();
const userController = new UserController();

// Administração de professores e alunos: exclusiva de professores autenticados
router.get('/users', ...apenasProfessor, userController.listar);
router.get('/users/:id', ...apenasProfessor, userController.obterPorId);
router.post('/users', ...apenasProfessor, userController.criar);
router.put('/users/:id', ...apenasProfessor, userController.atualizar);
router.delete('/users/:id', ...apenasProfessor, userController.remover);

export default router;
