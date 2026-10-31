import { Router } from 'express';
import { PostController } from '../controllers/PostController';
import { apenasProfessor } from '../middlewares/authMiddleware';

const router = Router();
const postController = new PostController();

// Escrita: exclusiva de professores autenticados
router.post('/posts', ...apenasProfessor, postController.criar);
router.put('/posts/:id', ...apenasProfessor, postController.atualizar);
router.delete('/posts/:id', ...apenasProfessor, postController.remover);

// Leitura: pública (app mobile consulta sem login)
router.get('/posts', postController.listar);
router.get('/posts/search', postController.buscar);
router.get('/posts/:id', postController.obterPorId);

export default router;