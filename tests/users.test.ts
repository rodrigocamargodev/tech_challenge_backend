import request from 'supertest';
import { createApp } from '../src/app';
import { UserModel } from '../src/models/User';
import { bearer, criarUsuario, SENHA_PADRAO } from './helpers/auth';

const app = createApp();

describe('Usuários (/users)', () => {
  describe('Listagem', () => {
    it('GET /users lista todos os usuários para professor', async () => {
      const professor = await criarUsuario('professor');
      await criarUsuario('aluno');

      const resposta = await request(app)
        .get('/users')
        .set('Authorization', bearer(professor.token));

      expect(resposta.status).toBe(200);
      expect(resposta.body).toHaveLength(2);
      expect(resposta.body[0].passwordHash).toBeUndefined();
    });

    it('GET /users?role=professor filtra por papel', async () => {
      const professor = await criarUsuario('professor');
      await criarUsuario('aluno');

      const resposta = await request(app)
        .get('/users?role=professor')
        .set('Authorization', bearer(professor.token));

      expect(resposta.status).toBe(200);
      expect(resposta.body).toHaveLength(1);
      expect(resposta.body[0].role).toBe('professor');
    });

    it('GET /users?role=aluno filtra por papel', async () => {
      const professor = await criarUsuario('professor');
      await criarUsuario('aluno');

      const resposta = await request(app)
        .get('/users?role=aluno')
        .set('Authorization', bearer(professor.token));

      expect(resposta.status).toBe(200);
      expect(resposta.body).toHaveLength(1);
      expect(resposta.body[0].role).toBe('aluno');
    });

    it('GET /users?role=invalido retorna 422', async () => {
      const professor = await criarUsuario('professor');

      const resposta = await request(app)
        .get('/users?role=diretor')
        .set('Authorization', bearer(professor.token));

      expect(resposta.status).toBe(422);
    });

    it('GET /users retorna 403 para aluno', async () => {
      const aluno = await criarUsuario('aluno');

      const resposta = await request(app)
        .get('/users')
        .set('Authorization', bearer(aluno.token));

      expect(resposta.status).toBe(403);
    });

    it('GET /users retorna 401 sem token', async () => {
      const resposta = await request(app).get('/users');
      expect(resposta.status).toBe(401);
    });

    it('GET /users/:id retorna o usuário e 404 quando não existe', async () => {
      const professor = await criarUsuario('professor');
      const aluno = await criarUsuario('aluno');

      const encontrado = await request(app)
        .get(`/users/${aluno.id}`)
        .set('Authorization', bearer(professor.token));

      expect(encontrado.status).toBe(200);
      expect(encontrado.body.email).toBe(aluno.email);

      const inexistente = await request(app)
        .get('/users/64b7f9f9f9f9f9f9f9f9f9f9')
        .set('Authorization', bearer(professor.token));

      expect(inexistente.status).toBe(404);
    });
  });

  describe('Criação por professor', () => {
    it('POST /users cria um professor', async () => {
      const professor = await criarUsuario('professor');

      const resposta = await request(app)
        .post('/users')
        .set('Authorization', bearer(professor.token))
        .send({
          nome: 'Novo Professor',
          email: 'novo.professor@escola.com',
          senha: SENHA_PADRAO,
          role: 'professor',
        });

      expect(resposta.status).toBe(201);
      expect(resposta.body.role).toBe('professor');
      expect(resposta.body.passwordHash).toBeUndefined();
    });

    it('POST /users cria um aluno', async () => {
      const professor = await criarUsuario('professor');

      const resposta = await request(app)
        .post('/users')
        .set('Authorization', bearer(professor.token))
        .send({
          nome: 'Novo Aluno',
          email: 'novo.aluno@escola.com',
          senha: SENHA_PADRAO,
          role: 'aluno',
        });

      expect(resposta.status).toBe(201);
      expect(resposta.body.role).toBe('aluno');
    });

    it('POST /users retorna 403 para aluno', async () => {
      const aluno = await criarUsuario('aluno');

      const resposta = await request(app)
        .post('/users')
        .set('Authorization', bearer(aluno.token))
        .send({
          nome: 'Tentativa',
          email: 'tentativa@escola.com',
          senha: SENHA_PADRAO,
          role: 'professor',
        });

      expect(resposta.status).toBe(403);
    });

    it('POST /users retorna 422 com papel inválido', async () => {
      const professor = await criarUsuario('professor');

      const resposta = await request(app)
        .post('/users')
        .set('Authorization', bearer(professor.token))
        .send({
          nome: 'Diretor',
          email: 'diretor@escola.com',
          senha: SENHA_PADRAO,
          role: 'diretor',
        });

      expect(resposta.status).toBe(422);
    });

    it('POST /users retorna 409 para e-mail duplicado', async () => {
      const professor = await criarUsuario('professor');
      const aluno = await criarUsuario('aluno');

      const resposta = await request(app)
        .post('/users')
        .set('Authorization', bearer(professor.token))
        .send({
          nome: 'Duplicado',
          email: aluno.email,
          senha: SENHA_PADRAO,
          role: 'aluno',
        });

      expect(resposta.status).toBe(409);
    });
  });

  describe('Atualização', () => {
    it('PUT /users/:id atualiza nome e papel de outro usuário', async () => {
      const professor = await criarUsuario('professor');
      const aluno = await criarUsuario('aluno');

      const resposta = await request(app)
        .put(`/users/${aluno.id}`)
        .set('Authorization', bearer(professor.token))
        .send({ nome: 'Aluno Promovido', role: 'professor' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.nome).toBe('Aluno Promovido');
      expect(resposta.body.role).toBe('professor');
    });

    it('PUT /users/:id impede o professor de alterar o próprio papel', async () => {
      const professor = await criarUsuario('professor');

      const resposta = await request(app)
        .put(`/users/${professor.id}`)
        .set('Authorization', bearer(professor.token))
        .send({ role: 'aluno' });

      expect(resposta.status).toBe(403);
      expect(resposta.body.error).toMatch(/próprio papel/i);

      const noBanco = await UserModel.findById(professor.id);
      expect(noBanco?.role).toBe('professor');
    });

    it('PUT /users/:id permite atualizar o próprio nome', async () => {
      const professor = await criarUsuario('professor');

      const resposta = await request(app)
        .put(`/users/${professor.id}`)
        .set('Authorization', bearer(professor.token))
        .send({ nome: 'Nome Atualizado' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.nome).toBe('Nome Atualizado');
    });

    it('PUT /users/:id atualiza a senha e permite novo login', async () => {
      const professor = await criarUsuario('professor');
      const aluno = await criarUsuario('aluno');

      const resposta = await request(app)
        .put(`/users/${aluno.id}`)
        .set('Authorization', bearer(professor.token))
        .send({ senha: 'novaSenha123' });

      expect(resposta.status).toBe(200);

      const login = await request(app)
        .post('/auth/login')
        .send({ email: aluno.email, senha: 'novaSenha123' });

      expect(login.status).toBe(200);
    });

    it('PUT /users/:id retorna 409 ao usar e-mail de outro usuário', async () => {
      const professor = await criarUsuario('professor');
      const aluno = await criarUsuario('aluno');

      const resposta = await request(app)
        .put(`/users/${aluno.id}`)
        .set('Authorization', bearer(professor.token))
        .send({ email: professor.email });

      expect(resposta.status).toBe(409);
    });

    it('PUT /users/:id retorna 404 para usuário inexistente', async () => {
      const professor = await criarUsuario('professor');

      const resposta = await request(app)
        .put('/users/64b7f9f9f9f9f9f9f9f9f9f9')
        .set('Authorization', bearer(professor.token))
        .send({ nome: 'Fantasma' });

      expect(resposta.status).toBe(404);
    });

    it('PUT /users/:id retorna 403 para aluno', async () => {
      const aluno = await criarUsuario('aluno');
      const outro = await criarUsuario('aluno');

      const resposta = await request(app)
        .put(`/users/${outro.id}`)
        .set('Authorization', bearer(aluno.token))
        .send({ nome: 'Hackeado' });

      expect(resposta.status).toBe(403);
    });
  });

  describe('Desativação (DELETE lógico)', () => {
    it('DELETE /users/:id desativa o usuário sem removê-lo do banco', async () => {
      const professor = await criarUsuario('professor');
      const aluno = await criarUsuario('aluno');

      const resposta = await request(app)
        .delete(`/users/${aluno.id}`)
        .set('Authorization', bearer(professor.token));

      expect(resposta.status).toBe(200);
      expect(resposta.body.usuario.ativo).toBe(false);

      const noBanco = await UserModel.findById(aluno.id);
      expect(noBanco).not.toBeNull();
      expect(noBanco?.ativo).toBe(false);
    });

    it('DELETE /users/:id impede desativar o próprio usuário', async () => {
      const professor = await criarUsuario('professor');

      const resposta = await request(app)
        .delete(`/users/${professor.id}`)
        .set('Authorization', bearer(professor.token));

      expect(resposta.status).toBe(403);
    });

    it('DELETE /users/:id retorna 404 para usuário inexistente', async () => {
      const professor = await criarUsuario('professor');

      const resposta = await request(app)
        .delete('/users/64b7f9f9f9f9f9f9f9f9f9f9')
        .set('Authorization', bearer(professor.token));

      expect(resposta.status).toBe(404);
    });

    it('DELETE /users/:id retorna 403 para aluno', async () => {
      const aluno = await criarUsuario('aluno');
      const outro = await criarUsuario('aluno');

      const resposta = await request(app)
        .delete(`/users/${outro.id}`)
        .set('Authorization', bearer(aluno.token));

      expect(resposta.status).toBe(403);
    });
  });
});
