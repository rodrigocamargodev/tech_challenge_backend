# 🚀 Blog de Giz — Backend (API)

### 🎓 FIAP - Full Stack Development
**Pós Tech** | **Turma:** 9FSDT | **Grupo:** 61

API REST em **Node.js + TypeScript + Express + MongoDB** que atende o aplicativo mobile
**Blog de Giz** (React Native). Professores publicam conteúdo; alunos consomem as aulas.

---

## 👥 Integrantes do Grupo 61

*   **Rodrigo Nose de Camargo**
    📧 [rodrigocamargo.dev@gmail.com](mailto:rodrigocamargo.dev@gmail.com)
    🔗 [GitHub Profile](https://github.com/rodrigocamargodev)

*   **Felipe de Oliveira de Souza**
    🔗 [GitHub Profile](https://github.com/felipedos)

---

## 🏗️ Arquitetura

Arquitetura em camadas simples, sem DDD, sem microsserviços e sem repository pattern.

```
src/
├── app.ts                  # createApp(): monta o Express (usado por server e testes)
├── server.ts               # Conecta no MongoDB e só então sobe o HTTP
├── config/
│   ├── env.ts              # Leitura/validação de variáveis de ambiente
│   └── db.ts               # Conexão/desconexão com o MongoDB
├── models/                 # Schemas Mongoose (User, Post)
├── controllers/            # Camada HTTP (validação de entrada + resposta)
├── services/               # Regras de negócio
├── routes/                 # Definição das rotas
├── middlewares/            # Autenticação, autorização, erros, rate limit
├── shared/                 # Erros, utilitários e tipos compartilhados
└── scripts/                # seedDemo.ts (ambiente de demonstração) e seedProfessor.ts
```

**Fluxo de uma requisição:** `rota → middleware (auth/autorização) → controller (validação) → service (regra) → model (MongoDB)`.

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Runtime | Node.js 20+ |
| Linguagem | TypeScript (strict) |
| HTTP | Express 5 |
| Banco | MongoDB + Mongoose |
| Autenticação | JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`, custo 12) |
| Validação | Zod |
| Segurança | Helmet, CORS, express-rate-limit |
| Testes | Jest + Supertest + mongodb-memory-server |
| Infra | Docker / Docker Compose, GitHub Actions |

---

## 🚦 Como executar

### 1. Local (com MongoDB já rodando)

```bash
npm install
cp .env.example .env      # ajuste JWT_SECRET e MONGO_URI
npm run seed:demo         # prepara professor, aluno e postagens de demonstração
npm run dev               # http://localhost:3000
```

> Para a **avaliação acadêmica**, use `npm run seed:demo` (um único comando).
> Veja a seção [Preparando o ambiente de demonstração](#-preparando-o-ambiente-de-demonstração).

### 2. Docker Compose (API + MongoDB)

```bash
# O compose exige JWT_SECRET definido no .env
docker compose up --build
```

### 3. Produção

```bash
npm run build
npm start                 # executa dist/server.js
```

### Scripts disponíveis

| Script | Descrição |
| --- | --- |
| `npm run dev` | Servidor com hot reload (`tsx watch`) |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm start` | Executa o build (`node dist/server.js`) |
| `npm run typecheck` | Checagem de tipos de `src` + `tests` |
| `npm run verify` | Typecheck + build + testes (validação completa) |
| `npm test` | Testes com cobertura |
| `npm run seed:demo` | **Prepara todo o ambiente de demonstração** (professor, aluno e postagens) |
| `npm run seed:professor` | Cria apenas o primeiro professor (ferramenta interna) |

---

## 🎬 Preparando o ambiente de demonstração

Esta seção é o guia para quem vai **avaliar** o projeto. O objetivo é que você
execute **um único comando** e tenha um ambiente pronto com um professor, um
aluno e postagens fictícias já cadastrados.

> ✅ **Resumo para o avaliador:** depois de configurar e iniciar o MongoDB,
> execute apenas:
>
> ```bash
> npm run seed:demo
> ```

### 1. Pré-requisitos

* **Node.js 20+** e **npm**.
* **MongoDB** acessível (local ou via Docker). Não é necessário criar o banco
  manualmente — o seed cria os dados na base configurada em `MONGO_URI`.

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar o arquivo `.env`

```bash
cp .env.example .env
```

Edite o `.env` e, no mínimo, defina um `JWT_SECRET` forte:

```bash
openssl rand -hex 32   # gere um valor e cole em JWT_SECRET
```

As variáveis do seed de demonstração são **opcionais**. Se você não defini-las,
serão usados os valores padrão seguros abaixo (exclusivos para desenvolvimento
e avaliação local):

```env
DEMO_PROFESSOR_EMAIL=professor.demo@blogdegiz.local
DEMO_PROFESSOR_PASSWORD=DemoProfessor123
DEMO_ALUNO_EMAIL=aluno.demo@blogdegiz.local
DEMO_ALUNO_PASSWORD=DemoAluno123
```

> ⚠️ Essas credenciais são **apenas para desenvolvimento e avaliação local**.
> **Nunca** use em produção. O seed é bloqueado automaticamente quando
> `NODE_ENV=production` ou quando a conexão aponta para um host não local.

### 4. Iniciar o MongoDB

Com Docker (recomendado):

```bash
docker run -d --name blog-de-giz-mongodb -p 27017:27017 mongo:7
```

Ou use uma instância local já em execução em `mongodb://localhost:27017`.

### 5. Executar o backend

```bash
npm run dev               # http://localhost:3000
```

### 6. Preparar os dados de demonstração (um único comando)

```bash
npm run seed:demo
```

Saída esperada na primeira execução:

```text
====================================
 BLOG DE GIZ — SEED DE DEMONSTRAÇÃO
====================================

[OK] Conexão com MongoDB estabelecida.
[OK] Professor de demonstração verificado.
[OK] Aluno de demonstração verificado.
[OK] 5 postagens de demonstração verificadas.

Resumo:
- Professores criados: 1
- Alunos criados: 1
- Postagens criadas: 5
- Registros reutilizados: 0

[OK] Ambiente de demonstração preparado.
```

### 7. Usuários disponíveis para teste

| Perfil | E-mail | Senha | Papel |
| --- | --- | --- | --- |
| Professor | `professor.demo@blogdegiz.local` | `DemoProfessor123` | `professor` |
| Aluno | `aluno.demo@blogdegiz.local` | `DemoAluno123` | `aluno` |

> Se você definiu `DEMO_PROFESSOR_EMAIL`/`DEMO_PROFESSOR_PASSWORD` e
> `DEMO_ALUNO_EMAIL`/`DEMO_ALUNO_PASSWORD` no `.env`, use esses valores.

### 8. Postagens fictícias criadas

O seed cria **5 postagens** em português, todas de autoria do professor de
demonstração:

1. A importância da tecnologia na educação
2. Como organizar uma rotina de estudos
3. O papel da leitura no desenvolvimento dos alunos
4. Inteligência artificial como ferramenta de aprendizagem
5. Sustentabilidade no ambiente escolar

Cada postagem tem conteúdo completo (vários parágrafos), suficiente para
demonstrar a tela de detalhes do aplicativo.

### 9. Como testar os fluxos de professor e aluno

Com o backend rodando (`npm run dev`), use os endpoints reais:

```bash
# Login do professor
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"professor.demo@blogdegiz.local","senha":"DemoProfessor123"}'

# Login do aluno
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"aluno.demo@blogdegiz.local","senha":"DemoAluno123"}'

# Listagem pública de postagens (sem login)
curl http://localhost:3000/posts
```

* **Professor:** pode criar, editar e excluir postagens (`POST/PUT/DELETE /posts`)
  e gerenciar usuários (`/users`).
* **Aluno:** pode autenticar, ver o próprio perfil (`GET /auth/me`) e consumir as
  postagens. Tentativas de escrita retornam `403`.

No aplicativo mobile, configure a URL base conforme a seção
[Integração com React Native](#-integração-com-react-native) e faça login com as
credenciais acima.

### 10. Executar novamente sem duplicar dados

O comando é **idempotente**: pode ser executado quantas vezes quiser. Na segunda
execução, nada é criado e os registros existentes são reutilizados:

```text
Resumo:
- Professores criados: 0
- Alunos criados: 0
- Postagens criadas: 0
- Registros reutilizados: 7
```

O seed **nunca** apaga dados, **nunca** sobrescreve senhas e **nunca** altera o
papel de usuários existentes. Se um e-mail de demonstração já existir com dados
incompatíveis (papel diferente ou conta desativada), o comando informa o
problema e **não altera** o registro.

---

## 🔐 Variáveis de ambiente

| Variável | Obrigatória | Padrão | Descrição |
| --- | --- | --- | --- |
| `JWT_SECRET` | ✅ | — | Segredo de assinatura do JWT |
| `MONGO_URI` | ❌ | `mongodb://localhost:27017/tech_challenge_blog` | Conexão MongoDB |
| `PORT` | ❌ | `3000` | Porta HTTP |
| `JWT_EXPIRES_IN` | ❌ | `8h` | Expiração do token |
| `BCRYPT_SALT_ROUNDS` | ❌ | `12` | Custo do bcrypt |
| `CORS_ORIGIN` | ❌ | `*` | Origens permitidas (lista separada por vírgula) |
| `NODE_ENV` | ❌ | `development` | Ambiente |
| `DEMO_PROFESSOR_EMAIL` | ❌ | `professor.demo@blogdegiz.local` | E-mail do professor de demonstração |
| `DEMO_PROFESSOR_PASSWORD` | ❌ | `DemoProfessor123` | Senha do professor de demonstração |
| `DEMO_ALUNO_EMAIL` | ❌ | `aluno.demo@blogdegiz.local` | E-mail do aluno de demonstração |
| `DEMO_ALUNO_PASSWORD` | ❌ | `DemoAluno123` | Senha do aluno de demonstração |
| `SEED_DEMO_PERMITIR_REMOTO` | ❌ | `false` | Permite (conscientemente) rodar o seed contra host não local |

> ⚠️ O arquivo `.env` **não é versionado**. Use `.env.example` como referência.
> Gere um segredo forte com `openssl rand -hex 32`.

---

## 👤 Perfis e permissões

| Ação | Público | Aluno | Professor |
| --- | :---: | :---: | :---: |
| `POST /auth/register` (cria aluno) | ✅ | — | — |
| `POST /auth/login` | ✅ | ✅ | ✅ |
| `GET /auth/me` | ❌ | ✅ | ✅ |
| `GET /posts`, `GET /posts/:id`, `GET /posts/search` | ✅ | ✅ | ✅ |
| `POST/PUT/DELETE /posts` | ❌ | ❌ | ✅ |
| `GET/POST/PUT/DELETE /users` | ❌ | ❌ | ✅ |

**Regras importantes**

* O cadastro público **sempre** cria `aluno`; o campo `role` enviado é ignorado.
* O primeiro professor é criado via seed (`npm run seed:demo` para o ambiente de
  demonstração completo, ou `npm run seed:professor` para apenas o professor).
* A autoria do post vem do usuário autenticado — o campo `autor` do corpo é ignorado.
* `DELETE /users/:id` é **desativação lógica** (`ativo: false`), preservando o histórico.
* Ninguém pode alterar o próprio papel nem desativar o próprio usuário.
* `passwordHash` nunca é retornado em nenhuma resposta.

---

## 🔑 Autenticação

* Padrão do cabeçalho: `Authorization: Bearer <TOKEN>`
* Token JWT com expiração de **8 horas**.
* **Não há refresh token** (fora do escopo acadêmico).
* Sem token / token inválido → `401`. Papel insuficiente → `403`.

---

## 🛣️ Endpoints

**Base URL local:** `http://localhost:3000`

### Autenticação

#### `POST /auth/register` — cadastro público de aluno

```json
{ "nome": "Maria Silva", "email": "maria@escola.com", "senha": "senhaSegura123" }
```

`201 Created`

```json
{
  "usuario": {
    "_id": "6710f2c1a1b2c3d4e5f60718",
    "nome": "Maria Silva",
    "email": "maria@escola.com",
    "role": "aluno",
    "ativo": true,
    "createdAt": "2026-10-30T12:00:00.000Z",
    "updatedAt": "2026-10-30T12:00:00.000Z"
  }
}
```

#### `POST /auth/login`

```json
{ "email": "maria@escola.com", "senha": "senhaSegura123" }
```

`200 OK`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": { "_id": "...", "nome": "Maria Silva", "email": "maria@escola.com", "role": "aluno", "ativo": true }
}
```

Erros: `401` credenciais inválidas · `403` usuário desativado · `429` muitas tentativas.

#### `GET /auth/me` 🔒

`200 OK` → `{ "usuario": { ... } }`

---

### Posts

> Contrato legado preservado: `{ _id, titulo, conteudo, autor, criadoEm }`
> (acrescido de `autorId` e `atualizadoEm`).

| Método | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| `GET` | `/posts` | pública | Lista posts (mais recentes primeiro) |
| `GET` | `/posts/search?termo=` | pública | Busca em título e conteúdo |
| `GET` | `/posts/:id` | pública | Detalhe do post |
| `POST` | `/posts` | professor | Cria post |
| `PUT` | `/posts/:id` | professor | Atualiza `titulo`/`conteudo` |
| `DELETE` | `/posts/:id` | professor | Remove post |

**Criar post** — `POST /posts` 🔒

```json
{ "titulo": "Introdução ao Node.js", "conteudo": "Nesta aula veremos..." }
```

`201 Created`

```json
{
  "_id": "6710f3a2a1b2c3d4e5f60719",
  "titulo": "Introdução ao Node.js",
  "conteudo": "Nesta aula veremos...",
  "autor": "Prof. Rodrigo",
  "autorId": "6710f2c1a1b2c3d4e5f60717",
  "criadoEm": "2026-10-30T12:05:00.000Z",
  "atualizadoEm": "2026-10-30T12:05:00.000Z"
}
```

**Editar post** — `PUT /posts/:id` 🔒 → `200 OK` com o post atualizado.
**Excluir post** — `DELETE /posts/:id` 🔒 → `200 OK` `{ "message": "Postagem excluída com sucesso!" }`

---

### Usuários (professores e alunos) 🔒

Todas as rotas exigem **professor autenticado**.

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/users` | Lista todos |
| `GET` | `/users?role=professor` | Lista professores |
| `GET` | `/users?role=aluno` | Lista alunos |
| `GET` | `/users/:id` | Detalhe |
| `POST` | `/users` | Cria professor ou aluno |
| `PUT` | `/users/:id` | Atualiza dados/papel/senha |
| `DELETE` | `/users/:id` | Desativa (soft delete) |

**Criar usuário** — `POST /users` 🔒

```json
{ "nome": "João Aluno", "email": "joao@escola.com", "senha": "senhaSegura123", "role": "aluno" }
```

`201 Created` → objeto do usuário (sem `passwordHash`).

**Desativar** — `DELETE /users/:id` 🔒

```json
{ "message": "Usuário desativado com sucesso.", "usuario": { "ativo": false, "...": "..." } }
```

---

## 📋 Formato de erros

Todas as falhas seguem o mesmo envelope:

```json
{ "error": "Mensagem legível para o usuário." }
```

Erros de validação incluem detalhes por campo:

```json
{
  "error": "Dados inválidos na requisição.",
  "detalhes": [
    { "campo": "email", "mensagem": "E-mail inválido." },
    { "campo": "senha", "mensagem": "A senha deve ter no mínimo 8 caracteres." }
  ]
}
```

| Status | Quando ocorre |
| --- | --- |
| `400` | ID malformado, JSON inválido, campo obrigatório ausente |
| `401` | Token ausente, inválido ou expirado; credenciais inválidas |
| `403` | Papel sem permissão; usuário desativado; alterar o próprio papel |
| `404` | Recurso ou rota não encontrada |
| `409` | E-mail já cadastrado |
| `422` | Falha de validação de entrada |
| `429` | Muitas tentativas de login |
| `500` | Erro interno (sem detalhes do banco na resposta) |

---

## 📱 Integração com React Native

### 1. Configurar a URL base

O `localhost` do emulador **não** é o da sua máquina. Use:

| Ambiente | URL base |
| --- | --- |
| Emulador Android | `http://10.0.2.2:3000` |
| Simulador iOS | `http://localhost:3000` |
| Dispositivo físico | `http://<IP-da-sua-máquina>:3000` |
| Produção | `https://api.seudominio.com` |

```ts
// src/config/api.ts
import { Platform } from 'react-native';

const HOST = Platform.select({
  android: 'http://10.0.2.2:3000',
  ios: 'http://localhost:3000',
  default: 'http://localhost:3000',
});

export const API_URL = HOST;
```

> Em dispositivo físico, o celular e o computador devem estar na mesma rede.
> Descubra o IP com `hostname -I` (Linux/macOS) ou `ipconfig` (Windows).

### 2. Cliente HTTP simples

```ts
// src/services/api.ts
import { API_URL } from '../config/api';

let token: string | null = null;
export const setToken = (novo: string | null) => { token = novo; };

const request = async (path: string, options: RequestInit = {}) => {
  const resposta = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.error ?? 'Erro inesperado na API.');
  }

  return dados;
};

export const api = {
  login: (email: string, senha: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, senha }) }),

  cadastrar: (nome: string, email: string, senha: string) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ nome, email, senha }) }),

  me: () => request('/auth/me'),

  listarPosts: () => request('/posts'),
  buscarPosts: (termo: string) => request(`/posts/search?termo=${encodeURIComponent(termo)}`),
  obterPost: (id: string) => request(`/posts/${id}`),

  criarPost: (titulo: string, conteudo: string) =>
    request('/posts', { method: 'POST', body: JSON.stringify({ titulo, conteudo }) }),

  editarPost: (id: string, dados: { titulo?: string; conteudo?: string }) =>
    request(`/posts/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),

  excluirPost: (id: string) => request(`/posts/${id}`, { method: 'DELETE' }),
};
```

### 3. Fluxo de autenticação no app

```ts
// Login
const { token, usuario } = await api.login(email, senha);
setToken(token);
// Guarde o token com expo-secure-store / AsyncStorage

// Restaurar sessão ao abrir o app
setToken(await SecureStore.getItemAsync('token'));
const { usuario } = await api.me();   // 401 → limpar token e voltar ao login
```

### 4. Observações para o app

* O token expira em **8h** — trate `401` redirecionando para o login.
* Rotas de leitura de posts funcionam **sem login** (bom para tela inicial pública).
* Esconda botões de criar/editar/excluir quando `usuario.role !== 'professor'`.
* Use `encodeURIComponent` no termo de busca.
* Em desenvolvimento com HTTP, o Android exige `android:usesCleartextTraffic="true"` no `AndroidManifest.xml`.

---

## 🧪 Testes

```bash
npm test              # Jest + Supertest + MongoDB em memória
npm run typecheck     # checagem de tipos
npm run build         # compilação
```

Cobertura atual: **~90%** de statements (meta mínima configurada: 70%).

Cenários cobertos: cadastro, login, senha inválida, token inválido, rotas protegidas,
aluno tentando criar/editar/excluir post, professor criando/editando/excluindo post,
cadastro de usuários por professor, alteração indevida de papel, dados inválidos,
usuário inexistente, ID malformado, regex injection na busca e desativação lógica.

---

## 🔒 Segurança implementada

* Senhas com **bcrypt custo 12**; `passwordHash` nunca sai da API.
* **JWT** de 8h com segredo em `.env` (sem fallback hardcoded).
* Autenticação + autorização por papel em middlewares separados.
* Validação de entrada com **Zod** (whitelist de campos → anti mass assignment).
* Autoria de posts derivada do token, não do corpo da requisição.
* Busca com **regex escapada** (anti regex injection / ReDoS).
* Validação de `ObjectId` antes de consultar o banco.
* **Helmet**, **CORS** configurável e **rate limit** no login.
* Tratamento centralizado de erros sem vazar detalhes internos.
* `.env`, `node_modules` e `coverage` fora do versionamento.

---

## 🤖 CI/CD

`.github/workflows/ci.yml` executa em push/PR para `main`, `master` e `develop`:
`npm ci` → `npm run typecheck` → `npm run build` → `npm test` → upload do relatório de cobertura.

---

## 📌 Pendências conhecidas

* Sem refresh token / rotação de token (fora do escopo).
* Sem paginação em `GET /posts` (mantido o contrato atual, que retorna array puro).
* Sem recuperação de senha por e-mail.
* Sem upload de imagens nos posts.
* Sem testes E2E no app React Native (escopo do frontend).
* Cobertura não é 100% — priorizou-se regras de negócio e segurança.
