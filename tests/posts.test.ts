import request from 'supertest';
import { createApp } from '../src/app';
import { PostModel } from '../src/models/Post';
import { bearer, criarUsuario } from './helpers/auth';

const app = createApp();

const criarPostNoBanco = async (dados: Partial<{ titulo: string; conteudo: string; autor: string }> = {}) => {
  return PostModel.create({
    titulo: dados.titulo ?? 'Post de teste',
    conteudo: dados.conteudo ?? 'Conteúdo de teste',
    autor: dados.autor ?? 'Professor Teste',
  });
};

describe('Posts (/posts)', () => {
  describe('Leitura pública', () => {
    it('GET /posts lista posts sem autenticação', async () => {
      await criarPostNoBanco({ titulo: 'Primeiro' });
      await criarPostNoBanco({ titulo: 'Segundo' });

      const resposta = await request(app).get('/posts');

      expect(resposta.status).toBe(200);
      expect(resposta.body).toHaveLength(2);
      expect(resposta.body[0]).toHaveProperty('titulo');
      expect(resposta.body[0]).toHaveProperty('autor');
      expect(resposta.body[0]).toHaveProperty('criadoEm');
    });

    it('GET /posts/:id retorna um post existente', async () => {
      const post = await criarPostNoBanco({ titulo: 'Individual' });

      const resposta = await request(app).get(`/posts/${post._id}`);

      expect(resposta.status).toBe(200);
      expect(resposta.body.titulo).toBe('Individual');
    });

    it('GET /posts/:id retorna 404 para post inexistente', async () => {
      const resposta = await request(app).get('/posts/64b7f9f9f9f9f9f9f9f9f9f9');

      expect(resposta.status).toBe(404);
      expect(resposta.body.error).toBe('Postagem não encontrada.');
    });

    it('GET /posts/:id retorna 400 para ID malformado', async () => {
      const resposta = await request(app).get('/posts/id-invalido');

      expect(resposta.status).toBe(400);
      expect(resposta.body.error).toMatch(/inválido/i);
    });

    it('GET /posts/search encontra por título e conteúdo (case-insensitive)', async () => {
      await criarPostNoBanco({ titulo: 'Introdução ao Node.js', conteudo: 'Backend' });
      await criarPostNoBanco({ titulo: 'Outro assunto', conteudo: 'Falamos de node aqui' });
      await criarPostNoBanco({ titulo: 'React Native', conteudo: 'Mobile' });

      const resposta = await request(app).get('/posts/search?termo=NODE');

      expect(resposta.status).toBe(200);
      expect(resposta.body).toHaveLength(2);
    });

    it('GET /posts/search trata caracteres de regex como texto literal', async () => {
      await criarPostNoBanco({ titulo: 'Aula de C++', conteudo: 'Ponteiros' });
      await criarPostNoBanco({ titulo: 'Aula de Java', conteudo: 'Classes' });

      // ".*" sem escape retornaria tudo; escapado, não deve casar com nada.
      const resposta = await request(app).get('/posts/search?termo=.*');

      expect(resposta.status).toBe(200);
      expect(resposta.body).toHaveLength(0);
    });

    it('GET /posts/search retorna 400 sem o parâmetro termo', async () => {
      const resposta = await request(app).get('/posts/search');

      expect(resposta.status).toBe(400);
      expect(resposta.body.error).toMatch(/termo/i);
    });

    it('GET /posts/search retorna 400 com termo vazio', async () => {
      const resposta = await request(app).get('/posts/search?termo=%20%20');

      expect(resposta.status).toBe(400);
    });
  });

  describe('Escrita restrita a professores', () => {
    it('POST /posts cria post como professor usando o nome do token como autor', async () => {
      const professor = await criarUsuario('professor', { nome: 'Prof. Ana' });

      const resposta = await request(app)
        .post('/posts')
        .set('Authorization', bearer(professor.token))
        .send({ titulo: 'Nova aula', conteudo: 'Conteúdo da aula' });

      expect(resposta.status).toBe(201);
      expect(resposta.body.titulo).toBe('Nova aula');
      expect(resposta.body.autor).toBe('Prof. Ana');
      expect(resposta.body.autorId).toBe(professor.id);
    });

    it('POST /posts ignora autor enviado pelo cliente (autoria não falsificável)', async () => {
      const professor = await criarUsuario('professor', { nome: 'Prof. Real' });

      const resposta = await request(app)
        .post('/posts')
        .set('Authorization', bearer(professor.token))
        .send({ titulo: 'Título', conteudo: 'Conteúdo', autor: 'Diretor Falso' });

      expect(resposta.status).toBe(201);
      expect(resposta.body.autor).toBe('Prof. Real');
    });

    it('POST /posts retorna 401 sem token', async () => {
      const resposta = await request(app)
        .post('/posts')
        .send({ titulo: 'Sem token', conteudo: 'Conteúdo' });

      expect(resposta.status).toBe(401);
    });

    it('POST /posts retorna 403 quando o usuário é aluno', async () => {
      const aluno = await criarUsuario('aluno');

      const resposta = await request(app)
        .post('/posts')
        .set('Authorization', bearer(aluno.token))
        .send({ titulo: 'Aluno tentando', conteudo: 'Conteúdo' });

      expect(resposta.status).toBe(403);
      expect(resposta.body.error).toMatch(/permissão/i);
    });

    it('POST /posts retorna 422 com dados inválidos', async () => {
      const professor = await criarUsuario('professor');

      const resposta = await request(app)
        .post('/posts')
        .set('Authorization', bearer(professor.token))
        .send({ titulo: '', conteudo: '' });

      expect(resposta.status).toBe(422);
      expect(resposta.body.detalhes).toBeDefined();
    });

    it('PUT /posts/:id atualiza título e conteúdo como professor', async () => {
      const professor = await criarUsuario('professor');
      const post = await criarPostNoBanco({ titulo: 'Antigo' });

      const resposta = await request(app)
        .put(`/posts/${post._id}`)
        .set('Authorization', bearer(professor.token))
        .send({ titulo: 'Atualizado', conteudo: 'Novo conteúdo' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.titulo).toBe('Atualizado');
      expect(resposta.body.conteudo).toBe('Novo conteúdo');
    });

    it('PUT /posts/:id não permite alterar o autor (campo protegido)', async () => {
      const professor = await criarUsuario('professor');
      const post = await criarPostNoBanco({ autor: 'Autor Original' });

      const resposta = await request(app)
        .put(`/posts/${post._id}`)
        .set('Authorization', bearer(professor.token))
        .send({ titulo: 'Editado', autor: 'Invasor' });

      expect(resposta.status).toBe(200);
      expect(resposta.body.autor).toBe('Autor Original');
    });

    it('PUT /posts/:id retorna 400 sem campos válidos', async () => {
      const professor = await criarUsuario('professor');
      const post = await criarPostNoBanco();

      const resposta = await request(app)
        .put(`/posts/${post._id}`)
        .set('Authorization', bearer(professor.token))
        .send({});

      expect(resposta.status).toBe(400);
    });

    it('PUT /posts/:id retorna 404 para post inexistente', async () => {
      const professor = await criarUsuario('professor');

      const resposta = await request(app)
        .put('/posts/64b7f9f9f9f9f9f9f9f9f9f9')
        .set('Authorization', bearer(professor.token))
        .send({ titulo: 'X' });

      expect(resposta.status).toBe(404);
    });

    it('PUT /posts/:id retorna 403 para aluno', async () => {
      const aluno = await criarUsuario('aluno');
      const post = await criarPostNoBanco();

      const resposta = await request(app)
        .put(`/posts/${post._id}`)
        .set('Authorization', bearer(aluno.token))
        .send({ titulo: 'Aluno editando' });

      expect(resposta.status).toBe(403);
    });

    it('DELETE /posts/:id remove o post como professor', async () => {
      const professor = await criarUsuario('professor');
      const post = await criarPostNoBanco();

      const resposta = await request(app)
        .delete(`/posts/${post._id}`)
        .set('Authorization', bearer(professor.token));

      expect(resposta.status).toBe(200);
      expect(resposta.body.message).toBe('Postagem excluída com sucesso!');
      expect(await PostModel.findById(post._id)).toBeNull();
    });

    it('DELETE /posts/:id retorna 404 para post inexistente', async () => {
      const professor = await criarUsuario('professor');

      const resposta = await request(app)
        .delete('/posts/64b7f9f9f9f9f9f9f9f9f9f9')
        .set('Authorization', bearer(professor.token));

      expect(resposta.status).toBe(404);
    });

    it('DELETE /posts/:id retorna 403 para aluno', async () => {
      const aluno = await criarUsuario('aluno');
      const post = await criarPostNoBanco();

      const resposta = await request(app)
        .delete(`/posts/${post._id}`)
        .set('Authorization', bearer(aluno.token));

      expect(resposta.status).toBe(403);
      expect(await PostModel.findById(post._id)).not.toBeNull();
    });
  });
});
