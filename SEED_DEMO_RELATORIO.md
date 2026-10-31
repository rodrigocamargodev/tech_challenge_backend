# Relatório — Preparação automática do ambiente de demonstração (Blog de Giz)

> Documento de entrega da tarefa de seed de demonstração. Todos os resultados
> abaixo foram **executados de verdade** neste ambiente e são reproduzíveis.

---

## 1. Diagnóstico inicial

Antes de implementar, o código real foi inspecionado. Fatos relevantes:

- **Stack:** Node.js 20+, TypeScript (strict), Express 5, Mongoose 9, JWT, bcryptjs, Zod.
- **Model `User`** (`src/models/User.ts`): campos `nome`, `email` (único, lowercase),
  `passwordHash` (`select: false`), `role` (`'professor' | 'aluno'`), `ativo`, `timestamps`.
- **Model `Post`** (`src/models/Post.ts`): `titulo` (≤200), `conteudo` (≤20000),
  `autor` (nome exibido), `autorId` (ObjectId → User), `criadoEm`/`atualizadoEm`.
- **Hash de senha:** `AuthService.gerarHashSenha` (bcrypt, custo via `BCRYPT_SALT_ROUNDS`, padrão 12).
- **Cadastro público** (`AuthService.registrarAluno`) **sempre** cria `aluno`.
- **Seed existente** (`src/scripts/seedProfessor.ts`): criava apenas um professor,
  com lógica própria de hash e verificação de e-mail.
- **Conexão** (`src/config/db.ts`): `conectarBanco(uri)` / `desconectarBanco()`.
- **Ambiente** (`src/config/env.ts`): `nodeEnv`, `mongoUri`, `bcryptSaltRounds`, etc.
- **Testes:** Jest + Supertest + `mongodb-memory-server`, com `maxWorkers: 1`
  obrigatório (banco em memória compartilhado).
- **Não existia** script `verify` nem comando unificado de seed.

**Problema:** o avaliador precisava rodar `seed:professor` e ainda não tinha
aluno nem postagens. Não havia proteção contra execução em produção.

---

## 2. Arquivos criados, modificados e removidos

### Criados

| Arquivo | Papel |
| --- | --- |
| `src/scripts/shared/seedUsuario.ts` | Helper idempotente e não destrutivo de criação/reutilização de usuário (reutilizado pelos dois seeds). |
| `src/scripts/seedDemoData.ts` | Conteúdo das 5 postagens fictícias (títulos = identificadores estáveis). |
| `src/scripts/seedDemoCore.ts` | Núcleo do seed: config, proteção de ambiente, execução idempotente, resumo e orquestração do CLI. |
| `src/scripts/seedDemo.ts` | Entrada do CLI (`npm run seed:demo`). |
| `tests/seedDemo.test.ts` | 20 testes cobrindo criação, idempotência, proteção e ciclo de conexão. |
| `SEED_DEMO_RELATORIO.md` | Este relatório. |

### Modificados

| Arquivo | Mudança |
| --- | --- |
| `src/scripts/seedProfessor.ts` | Passou a reutilizar `garantirUsuarioSeed` (fim da lógica duplicada). Comportamento preservado. |
| `package.json` | Adicionados `seed:demo` e `verify`. |
| `.env.example` | Adicionadas variáveis `DEMO_*` e `SEED_DEMO_PERMITIR_REMOTO`. |
| `README.md` | Nova seção **Preparando o ambiente de demonstração** + ajustes de scripts/env. |

### Removidos

Nenhum arquivo foi removido.

---

## 3. Estratégia de criação dos usuários

- Um único helper (`garantirUsuarioSeed`) é usado tanto pelo `seed:demo` quanto
  pelo `seed:professor`, eliminando regras divergentes.
- A senha é sempre hasheada com o **mesmo** `AuthService.gerarHashSenha` (bcrypt).
- O professor é criado **diretamente pelo model** (nunca pelo cadastro público),
  garantindo o papel `professor`.
- Regras de segurança implementadas:
  - Nunca sobrescreve senha, papel, nome ou status de usuário existente.
  - Nunca reativa conta desativada silenciosamente.
  - Se o e-mail existir com dados incompatíveis (papel divergente ou conta
    desativada), o seed **informa e aborta sem alterar** o registro.
- Credenciais configuráveis por `DEMO_PROFESSOR_EMAIL/PASSWORD` e
  `DEMO_ALUNO_EMAIL/PASSWORD`, com padrões seguros apenas para desenvolvimento.

---

## 4. Estratégia de criação das postagens

- 5 postagens em português, com conteúdo de vários parágrafos (suficiente para a
  tela de detalhes), respeitando os limites do schema (`titulo` ≤ 200,
  `conteudo` ≤ 20000).
- Cada postagem é associada ao professor de demonstração via `autorId` (ObjectId)
  e `autor` (nome exibido), exatamente como o `PostController` faz.
- **Identificador estável:** o `titulo` exato é usado para localizar a postagem
  de demonstração. Não foi necessário adicionar campos ao schema nem alterar o
  contrato público da API.
- Nenhum campo adicional foi inventado.

---

## 5. Como a idempotência foi garantida

- **Usuários:** busca por `email` normalizado; se existir e for compatível,
  reutiliza; se não existir, cria.
- **Postagens:** busca por `titulo` exato; se existir, reutiliza; se não, cria.
- Nenhuma operação destrutiva (`deleteMany`, limpeza de coleção, recriação de
  usuários, sobrescrita de senha) é usada.
- O resumo distingue **criados** de **reutilizados** com números reais.

---

## 6. Como a execução em produção é bloqueada

`validarAmbienteDemo(uri)` roda **antes** de qualquer conexão e bloqueia quando:

1. `NODE_ENV === 'production'`; **ou**
2. o host da `MONGO_URI` não é local (`localhost`, `127.0.0.1`, `::1`, `mongodb`).

A verificação de host só pode ser dispensada com opt-in explícito
`SEED_DEMO_PERMITIR_REMOTO=true` (nunca silencioso). Em caso de bloqueio, o
processo sai com código ≠ 0 e mensagem objetiva. Nenhuma senha, hash, token ou
string de conexão é impressa nos logs.

---

## 7. Testes adicionados (`tests/seedDemo.test.ts`)

20 testes cobrindo:

- Criação do professor (papel/ativo) e do aluno.
- Hash de senha (nunca texto puro) e verificação via bcrypt.
- Criação das 5 postagens e respeito aos limites do schema.
- Associação correta de cada postagem ao professor (`autorId` + `autor`).
- Reutilização de usuários e postagens existentes.
- Ausência de duplicação após múltiplas execuções.
- Preservação da senha de usuário preexistente.
- Não alteração de usuário incompatível (papel divergente) e não reativação de
  conta desativada.
- Proteção contra `NODE_ENV=production` e host remoto (com opt-in).
- Rejeição de senha curta.
- Ciclo de vida da conexão: encerra após sucesso, encerra após erro e não
  desconecta quando a conexão falha.
- Login do professor e do aluno criados pelo seed.

---

## 8. Comandos executados e resultados reais

### `npm run verify`

```
> tsc -p tsconfig.test.json      (typecheck OK)
> tsc -p tsconfig.json           (build OK)
> jest
Test Suites: 5 passed, 5 total
Tests:       89 passed, 89 total
```

### `npx jest --coverage`

```
All files | 95.54 % Stmts | 80.41 % Branch | 93.75 % Funcs | 95.52 % Lines
Test Suites: 5 passed, 5 total
Tests:       89 passed, 89 total
```

> **Nota sobre `--maxWorkers=2`:** o projeto usa um único MongoDB em memória
> compartilhado por toda a suíte e exige `maxWorkers: 1` (documentado no
> `jest.config.ts`). Executar com `--maxWorkers=2` faz os arquivos competirem
> pelo mesmo banco e gera falhas espúrias (16 falhas observadas). A execução
> correta e recomendada é a padrão (`npm test` / `npm run verify`), que passa
> 100 %. Isso é uma característica pré-existente da infraestrutura de testes,
> não uma regressão desta tarefa.

---

## 9. Evidências — primeira e segunda execução

Banco de demonstração limpo (`tech_challenge_demo`).

### Primeira execução — `npm run seed:demo`

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

### Segunda execução — `npm run seed:demo` (idempotência)

```text
Resumo:
- Professores criados: 0
- Alunos criados: 0
- Postagens criadas: 0
- Registros reutilizados: 7
```

### Conferência direta no MongoDB

```
users: 2
posts: 5
[
  { email: 'professor.demo@blogdegiz.local', role: 'professor', ativo: true, hashPrefix: '$2b$12$' },
  { email: 'aluno.demo@blogdegiz.local',     role: 'aluno',     ativo: true, hashPrefix: '$2b$12$' }
]
posts por autor: [{"_id":"Professor Demonstração","total":5}]
```

Confirma: 2 usuários, 5 postagens, todas do professor, senhas com hash bcrypt.

---

## 10. Resultado dos testes de login e autorização (API real)

Servidor iniciado contra o banco de demonstração (`PORT=3999`).

| Verificação | Resultado |
| --- | --- |
| `POST /auth/login` (professor) | `200` — token com `role: professor` |
| `POST /auth/login` (aluno) | `200` — token com `role: aluno` |
| `GET /posts` (público) | `200` — 5 postagens retornadas |
| Aluno cria post (`POST /posts`) | `403` (bloqueado) |
| Aluno lista usuários (`GET /users`) | `403` (bloqueado) |
| Professor cria post (`POST /posts`) | `201` (permitido) |
| Professor lista usuários (`GET /users`) | `200` (permitido) |

### Proteção de ambiente

| Cenário | Resultado |
| --- | --- |
| `NODE_ENV=production npm run seed:demo` | Bloqueado, `exit=1` |
| `MONGO_URI=mongodb://db.remoto.example.com/... npm run seed:demo` | Bloqueado, `exit=1` |

---

## 11. Instruções para o avaliador

1. `npm install`
2. `cp .env.example .env` e defina um `JWT_SECRET` forte (`openssl rand -hex 32`).
3. Inicie o MongoDB (ex.: `docker run -d --name blog-de-giz-mongodb -p 27017:27017 mongo:7`).
4. Execute **apenas**:
   ```bash
   npm run seed:demo
   ```
5. Suba o backend: `npm run dev`.
6. Faça login com:
   - Professor: `professor.demo@blogdegiz.local` / `DemoProfessor123`
   - Aluno: `aluno.demo@blogdegiz.local` / `DemoAluno123`
7. Consulte `GET /posts` (público) e teste os fluxos de professor e aluno.

> As credenciais são **exclusivas para desenvolvimento/avaliação local** e nunca
> devem ser usadas em produção. O seed é bloqueado automaticamente em produção.

---

## 12. Limitações

- A validação end-to-end foi executada contra um MongoDB local real
  (`tech_challenge_demo`), que foi **removido** ao final. O banco de
  desenvolvimento do projeto (`tech_challenge_blog`) **não foi tocado**.
- `npx jest --coverage --maxWorkers=2` falha por limitação pré-existente da
  infraestrutura de testes (banco em memória compartilhado exige `maxWorkers: 1`).
  A execução padrão passa integralmente.
- Nenhum commit foi feito (conforme solicitado).
