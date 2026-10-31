import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app';
import { PostModel } from '../src/models/Post';
import { UserModel } from '../src/models/User';
import { PostService } from '../src/services/PostService';
import { bearer, criarUsuario } from './helpers/auth';

const app = createApp();

describe('Tratamento de erros e rotas básicas', () => {
  it('GET / responde com a mensagem de status da API', async () => {
    const resposta = await request(app).get('/');

    expect(resposta.status).toBe(200);
    expect(resposta.body.message).toMatch(/rodando/i);
  });

  it('GET /health responde ok', async () => {
    const resposta = await request(app).get('/health');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ status: 'ok' });
  });

  it('retorna 404 com mensagem para rota inexistente', async () => {
    const resposta = await request(app).get('/rota/que/nao/existe');

    expect(resposta.status).toBe(404);
    expect(resposta.body.error).toMatch(/Rota não encontrada/);
  });

  it('retorna 400 para JSON malformado no corpo', async () => {
    const resposta = await request(app)
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": "incompleto"');

    expect(resposta.status).toBe(400);
    expect(resposta.body.error).toMatch(/JSON inválido/i);
  });

  it('não expõe stack trace nem detalhes internos em erro 500', async () => {
    const professor = await criarUsuario('professor');

    // Força um erro inesperado (não-AppError) dentro do service.
    const spy = jest
      .spyOn(PostService.prototype, 'listarTodos')
      .mockRejectedValueOnce(new Error('detalhe interno do banco: senha=123'));

    const resposta = await request(app).get('/posts');

    expect(resposta.status).toBe(500);
    expect(resposta.body.error).toBe('Erro interno do servidor.');
    expect(JSON.stringify(resposta.body)).not.toContain('senha=123');

    spy.mockRestore();
    expect(professor.token).toBeDefined();
  });

  it('retorna 422 quando o Mongoose rejeita a validação do schema', async () => {
    const professor = await criarUsuario('professor');

    // Erro real de validação do Mongoose (instância de ValidationError).
    const erroValidacao = new mongoose.Error.ValidationError();
    erroValidacao.addError(
      'titulo',
      new mongoose.Error.ValidatorError({ path: 'titulo', message: 'Título é obrigatório.' })
    );

    // O controller usa `new PostModel(...).save()`; o mock precisa atingir o save.
    const spy = jest
      .spyOn(PostModel.prototype, 'save')
      .mockRejectedValueOnce(erroValidacao);

    const resposta = await request(app)
      .post('/posts')
      .set('Authorization', bearer(professor.token))
      .send({ titulo: 'X', conteudo: 'Y' });

    expect(resposta.status).toBe(422);
    expect(resposta.body.error).toBe('Dados inválidos na requisição.');
    expect(resposta.body.detalhes[0].campo).toBe('titulo');

    spy.mockRestore();
  });

  it('retorna 409 quando o MongoDB acusa chave duplicada', async () => {
    const professor = await criarUsuario('professor');

    const spy = jest.spyOn(UserModel, 'exists').mockResolvedValueOnce(null);
    const createSpy = jest
      .spyOn(UserModel, 'create')
      .mockRejectedValueOnce(Object.assign(new Error('duplicado'), { code: 11000 }));

    const resposta = await request(app)
      .post('/users')
      .set('Authorization', bearer(professor.token))
      .send({
        nome: 'Duplicado',
        email: 'duplicado@escola.com',
        senha: 'senhaSegura123',
        role: 'aluno',
      });

    expect(resposta.status).toBe(409);
    expect(resposta.body.error).toBe('Registro já cadastrado.');

    spy.mockRestore();
    createSpy.mockRestore();
  });

  it('retorna 400 para ObjectId inválido em rotas de usuário', async () => {
    const professor = await criarUsuario('professor');

    const resposta = await request(app)
      .get('/users/nao-e-um-object-id')
      .set('Authorization', bearer(professor.token));

    expect(resposta.status).toBe(400);
    expect(resposta.body.error).toMatch(/inválido/i);
  });

  it('retorna 400 para ObjectId inválido em PUT e DELETE de posts', async () => {
    const professor = await criarUsuario('professor');

    const put = await request(app)
      .put('/posts/abc')
      .set('Authorization', bearer(professor.token))
      .send({ titulo: 'X' });

    const del = await request(app)
      .delete('/posts/abc')
      .set('Authorization', bearer(professor.token));

    expect(put.status).toBe(400);
    expect(del.status).toBe(400);
  });

  it('retorna 401 quando o cabeçalho Authorization está vazio', async () => {
    const resposta = await request(app).get('/auth/me').set('Authorization', '');

    expect(resposta.status).toBe(401);
  });

  it('retorna 401 quando o token Bearer está vazio', async () => {
    const resposta = await request(app).get('/auth/me').set('Authorization', 'Bearer ');

    expect(resposta.status).toBe(401);
  });
});
