import request from 'supertest';
import { createApp } from '../src/app';
import { UserModel } from '../src/models/User';
import { bearer, criarUsuario, SENHA_PADRAO } from './helpers/auth';

const app = createApp();

describe('Autenticação (/auth)', () => {
  describe('POST /auth/register', () => {
    it('cadastra um aluno com sucesso e nunca retorna passwordHash', async () => {
      const resposta = await request(app).post('/auth/register').send({
        nome: 'Maria Aluna',
        email: 'maria@escola.com',
        senha: SENHA_PADRAO,
      });

      expect(resposta.status).toBe(201);
      expect(resposta.body.usuario).toMatchObject({
        nome: 'Maria Aluna',
        email: 'maria@escola.com',
        role: 'aluno',
        ativo: true,
      });
      expect(resposta.body.usuario.passwordHash).toBeUndefined();
      expect(resposta.body.usuario.senha).toBeUndefined();
    });

    it('ignora tentativa de cadastro como professor (mass assignment de papel)', async () => {
      const resposta = await request(app).post('/auth/register').send({
        nome: 'Aluno Esperto',
        email: 'esperto@escola.com',
        senha: SENHA_PADRAO,
        role: 'professor',
      });

      expect(resposta.status).toBe(201);
      expect(resposta.body.usuario.role).toBe('aluno');

      const noBanco = await UserModel.findOne({ email: 'esperto@escola.com' });
      expect(noBanco?.role).toBe('aluno');
    });

    it('rejeita e-mail duplicado com 409', async () => {
      await request(app)
        .post('/auth/register')
        .send({ nome: 'Aluno Um', email: 'duplicado@escola.com', senha: SENHA_PADRAO });

      const resposta = await request(app)
        .post('/auth/register')
        .send({ nome: 'Aluno Dois', email: 'duplicado@escola.com', senha: SENHA_PADRAO });

      expect(resposta.status).toBe(409);
      expect(resposta.body.error).toMatch(/já existe/i);
    });

    it('rejeita dados inválidos com 422 e detalhes por campo', async () => {
      const resposta = await request(app)
        .post('/auth/register')
        .send({ nome: 'A', email: 'nao-e-email', senha: '123' });

      expect(resposta.status).toBe(422);
      expect(resposta.body.error).toBe('Dados inválidos na requisição.');
      expect(Array.isArray(resposta.body.detalhes)).toBe(true);
      expect(resposta.body.detalhes.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('POST /auth/login', () => {
    it('autentica com credenciais válidas e devolve token JWT', async () => {
      const aluno = await criarUsuario('aluno', { email: 'login@escola.com' });

      const resposta = await request(app)
        .post('/auth/login')
        .send({ email: aluno.email, senha: aluno.senha });

      expect(resposta.status).toBe(200);
      expect(typeof resposta.body.token).toBe('string');
      expect(resposta.body.token.split('.')).toHaveLength(3);
      expect(resposta.body.usuario.email).toBe(aluno.email);
      expect(resposta.body.usuario.passwordHash).toBeUndefined();
    });

    it('rejeita senha inválida com 401 e mensagem genérica', async () => {
      const aluno = await criarUsuario('aluno', { email: 'senhaerrada@escola.com' });

      const resposta = await request(app)
        .post('/auth/login')
        .send({ email: aluno.email, senha: 'senhaErrada999' });

      expect(resposta.status).toBe(401);
      expect(resposta.body.error).toBe('E-mail ou senha inválidos.');
    });

    it('rejeita usuário inexistente com a mesma mensagem genérica', async () => {
      const resposta = await request(app)
        .post('/auth/login')
        .send({ email: 'ninguem@escola.com', senha: SENHA_PADRAO });

      expect(resposta.status).toBe(401);
      expect(resposta.body.error).toBe('E-mail ou senha inválidos.');
    });

    it('rejeita usuário desativado com 403', async () => {
      const aluno = await criarUsuario('aluno', {
        email: 'inativo@escola.com',
        ativo: false,
      });

      const resposta = await request(app)
        .post('/auth/login')
        .send({ email: aluno.email, senha: aluno.senha });

      expect(resposta.status).toBe(403);
      expect(resposta.body.error).toMatch(/desativado/i);
    });
  });

  describe('GET /auth/me', () => {
    it('retorna os dados do usuário autenticado', async () => {
      const professor = await criarUsuario('professor', { email: 'me@escola.com' });

      const resposta = await request(app)
        .get('/auth/me')
        .set('Authorization', bearer(professor.token));

      expect(resposta.status).toBe(200);
      expect(resposta.body.usuario).toMatchObject({
        email: professor.email,
        role: 'professor',
      });
      expect(resposta.body.usuario.passwordHash).toBeUndefined();
    });

    it('retorna 401 sem token', async () => {
      const resposta = await request(app).get('/auth/me');

      expect(resposta.status).toBe(401);
      expect(resposta.body.error).toMatch(/não fornecido/i);
    });

    it('retorna 401 com token inválido', async () => {
      const resposta = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer token.completamente.invalido');

      expect(resposta.status).toBe(401);
      expect(resposta.body.error).toMatch(/inválido/i);
    });

    it('retorna 401 quando o esquema não é Bearer', async () => {
      const professor = await criarUsuario('professor');

      const resposta = await request(app)
        .get('/auth/me')
        .set('Authorization', professor.token);

      expect(resposta.status).toBe(401);
    });

    it('retorna 401 quando o usuário do token foi removido', async () => {
      const aluno = await criarUsuario('aluno');
      await UserModel.findByIdAndDelete(aluno.id);

      const resposta = await request(app)
        .get('/auth/me')
        .set('Authorization', bearer(aluno.token));

      expect(resposta.status).toBe(401);
      expect(resposta.body.error).toMatch(/não existe/i);
    });

    it('retorna 403 quando o usuário do token foi desativado', async () => {
      const aluno = await criarUsuario('aluno');
      await UserModel.findByIdAndUpdate(aluno.id, { ativo: false });

      const resposta = await request(app)
        .get('/auth/me')
        .set('Authorization', bearer(aluno.token));

      expect(resposta.status).toBe(403);
      expect(resposta.body.error).toMatch(/desativado/i);
    });
  });
});
