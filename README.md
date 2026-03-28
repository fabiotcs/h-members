# H-Members — Plataforma de Membros SaaS

Plataforma de area de membros estilo Netflix para venda e entrega de cursos online. Self-hosted, white-label e 100% configuravel via `.env`.

---

## Visao Geral

O **H-Members** permite que infoprodutores e criadores de conteudo oferecam uma experiencia de streaming profissional para seus alunos, com interface moderna baseada em cards, banners e categorias — semelhante a plataformas como Netflix e Disney+.

**Principais diferenciais:**

- **Self-hosted** — O cliente hospeda em sua propria infraestrutura, sem dependencia de SaaS terceiro
- **White-label completo** — Cores, logos, dominio customizado, tudo configuravel via `.env` ou painel admin
- **Player YouTube mascarado** — Videos do YouTube sem branding, sugestoes ou links externos
- **Deploy simplificado** — Docker otimizado para EasePanel, deploy em minutos
- **Armazenamento local** — Sem necessidade de S3/Minio, arquivos em pasta local
- **Webhooks bidirecionais** — Integracao nativa com qualquer plataforma de vendas e CRM

---

## Funcionalidades

- Vitrine estilo Netflix com cards e categorias
- Player de video customizado (YouTube mascarado via Video.js)
- Progressao do aluno (barra de progresso, continuar assistindo)
- Vitrine inteligente (cursos bloqueados redirecionam para compra)
- Webhooks bidirecionais (entrada: vendas / saida: eventos)
- E-mails transacionais (recuperacao de senha)
- Painel administrativo completo
- Bloqueio de sessoes simultaneas (anti-compartilhamento)
- White-label (cores, logo, dominio customizado)
- 100% configuravel via `.env`

---

## Stack Tecnologico

| Tecnologia | Funcao |
|------------|--------|
| **Next.js** | Frontend (SSR, app router, mobile-first) |
| **NestJS** | Backend (API REST, autenticacao, webhooks) |
| **Prisma** | ORM (type-safe, migrations automaticas) |
| **MySQL 8** | Banco de dados relacional |
| **Video.js** | Player de video customizado (YouTube mascarado) |
| **Tailwind CSS** | Estilizacao (utility-first, responsivo) |
| **Docker** | Container unico (Nginx + Node.js via supervisord) |

---

## Requisitos Previos

- **Docker** e **Docker Compose** instalados
- **EasePanel** (opcional, recomendado para deploy simplificado)
- **Dominio apontado** para o servidor (para producao com HTTPS)

---

## Instalacao Rapida (Docker)

### 1. Clone o repositorio

```bash
git clone https://github.com/fabiotcs/h-members.git
cd h-members
```

### 2. Configure as variaveis de ambiente

```bash
cp .env.example .env
nano .env  # edite com seus dados
```

Veja a secao [Configuracao de Variaveis de Ambiente](#configuracao-de-variaveis-de-ambiente) para detalhes de cada variavel.

### 3. Inicie a plataforma

```bash
docker-compose up -d --build
```

Na primeira execucao, o sistema ira:
- Criar o banco de dados MySQL
- Executar as migrations do Prisma automaticamente
- Criar o usuario administrador com as credenciais definidas no `.env`

### 4. Acesse

| Recurso | URL |
|---------|-----|
| **Plataforma** | `http://localhost` (ou seu dominio) |
| **Painel Admin** | `http://localhost/admin` |
| **API Docs (Swagger)** | `http://localhost/api/docs` |

---

## Deploy no EasePanel

1. No painel do EasePanel, clique em **"Create New Project"**
2. Selecione **"App"** e escolha **"Service Type: Docker Image"** ou conecte seu repositorio GitHub
3. Na aba **Environment**, copie o conteudo do `.env.example` e preencha com seus dados reais
4. Na aba **Domains**, aponte seu dominio (ex: `membros.seucliente.com`)
5. Configure o volume persistente: `/app/uploads` (para manter arquivos entre deploys)
6. Clique em **Deploy**

> **Dica:** O EasePanel gerencia certificados SSL automaticamente quando um dominio e configurado.

---

## Configuracao de Variaveis de Ambiente

### App Core

| Variavel | Descricao | Obrigatorio | Padrao |
|----------|-----------|:-----------:|--------|
| `PORT` | Porta do servidor API (interna ao container) | Nao | `3001` |
| `NODE_ENV` | Ambiente de execucao (`development` ou `production`) | Nao | `development` |
| `CORS_ORIGIN` | URL permitida para CORS (URL do frontend) | Nao | `http://localhost:3000` |
| `LICENSE_KEY` | Chave de licenca (funcionalidade futura) | Nao | — |

### Database (MySQL / MariaDB)

| Variavel | Descricao | Obrigatorio | Padrao |
|----------|-----------|:-----------:|--------|
| `DATABASE_URL` | String de conexao Prisma completa | Sim | `mysql://hmembers:YOUR_PASSWORD@localhost:3306/hmembers` |
| `DB_ROOT_PASSWORD` | Senha root do MySQL (usado pelo docker-compose) | Sim | — |
| `DB_NAME` | Nome do banco de dados | Sim | — |
| `DB_USER` | Usuario do banco de dados | Sim | — |
| `DB_PASSWORD` | Senha do usuario do banco | Sim | — |
| `DB_PORT` | Porta exposta do MySQL no host | Nao | `3306` |

> **Nota:** No docker-compose, a `DATABASE_URL` e montada automaticamente a partir de `DB_USER`, `DB_PASSWORD` e `DB_NAME`. A variavel `DATABASE_URL` do `.env` e usada apenas para desenvolvimento local.

### Autenticacao e Seguranca

| Variavel | Descricao | Obrigatorio | Padrao |
|----------|-----------|:-----------:|--------|
| `JWT_SECRET` | Chave secreta para tokens JWT (use uma string aleatoria forte) | Sim | — |
| `JWT_EXPIRES_IN` | Tempo de expiracao do token JWT | Nao | `7d` |
| `ADMIN_EMAIL` | E-mail do administrador (criado na primeira execucao) | Sim | `admin@seudominio.com` |
| `ADMIN_PASSWORD` | Senha do administrador (criado na primeira execucao) | Sim | — |
| `MAX_SESSIONS` | Maximo de sessoes simultaneas por usuario (anti-compartilhamento) | Nao | `1` |
| `WEBHOOK_SECRET` | Chave secreta para validacao HMAC de webhooks de entrada | Sim | — |

> **Importante:** Gere strings aleatorias fortes para `JWT_SECRET` e `WEBHOOK_SECRET`. Exemplo: `openssl rand -hex 32`

### SMTP (E-mails Transacionais)

| Variavel | Descricao | Obrigatorio | Padrao |
|----------|-----------|:-----------:|--------|
| `SMTP_HOST` | Servidor SMTP | Nao | — |
| `SMTP_PORT` | Porta do servidor SMTP | Nao | `587` |
| `SMTP_USER` | Usuario de autenticacao SMTP | Nao | — |
| `SMTP_PASS` | Senha de autenticacao SMTP | Nao | — |
| `SMTP_FROM` | E-mail de remetente das mensagens | Nao | `noreply@seudominio.com` |

> Se nao configurado, o sistema funciona normalmente, mas o envio de e-mails (recuperacao de senha) estara indisponivel.

### White Label / Personalizacao

| Variavel | Descricao | Obrigatorio | Padrao |
|----------|-----------|:-----------:|--------|
| `PLATFORM_NAME` | Nome da plataforma (exibido no header, titulo, etc.) | Nao | `H-Members` |
| `PRIMARY_COLOR` | Cor primaria da interface (hex) | Nao | `#6366F1` |
| `LOGO_URL` | URL ou caminho da logo da plataforma | Nao | — |
| `FAVICON_URL` | URL ou caminho do favicon | Nao | — |

> Esses valores servem como padrao. Podem ser sobrescritos pelo painel admin (armazenados na tabela `PlatformSetting` do banco).

### Armazenamento de Arquivos

| Variavel | Descricao | Obrigatorio | Padrao |
|----------|-----------|:-----------:|--------|
| `UPLOAD_DIR` | Diretorio para armazenamento de uploads | Nao | `./uploads` |
| `MAX_UPLOAD_SIZE` | Tamanho maximo de upload em bytes | Nao | `52428800` (50 MB) |

### Docker Compose

| Variavel | Descricao | Obrigatorio | Padrao |
|----------|-----------|:-----------:|--------|
| `APP_PORT` | Porta HTTP exposta no host | Nao | `80` |
| `APP_URL` | URL publica da aplicacao (usado no build do Next.js) | Nao | `http://localhost` |

---

## Mascaramento de Videos (YouTube)

### Como funciona

O player Video.js intercepta a reproducao do YouTube e renderiza o video dentro de um player customizado, escondendo completamente a interface original do YouTube. O aluno nao ve logo, sugestoes de videos, links ou botao de compartilhar.

### Como cadastrar um video

No painel admin, ao cadastrar uma aula, cole a URL completa do YouTube. Os seguintes formatos sao aceitos:

| Formato | Exemplo |
|---------|---------|
| URL padrao | `https://www.youtube.com/watch?v=dQw4w9WgXcQ` |
| URL curta | `https://youtu.be/dQw4w9WgXcQ` |
| URL embed | `https://www.youtube.com/embed/dQw4w9WgXcQ` |

O sistema extrai automaticamente o ID do video e configura o player.

---

## Webhooks

### Webhook de Entrada (Receber vendas)

Recebe notificacoes de plataformas de vendas para liberar acesso automaticamente.

- **Endpoint:** `POST /api/v1/webhooks/incoming`
- **Header de autenticacao:** `X-Webhook-Secret: <seu_webhook_secret>`

**Exemplo de payload:**

```json
{
  "event": "purchase.completed",
  "customer": {
    "email": "aluno@email.com",
    "name": "Nome do Aluno"
  },
  "product": {
    "id": "CURSO-001",
    "name": "Curso Completo"
  },
  "transaction": {
    "id": "TXN-123456",
    "status": "approved",
    "date": "2026-03-27T10:00:00Z"
  }
}
```

**Plataformas compativeis:** Hotmart, Kiwify, Eduzz (via mapeamento de payload).

### Webhook de Saida (Enviar eventos)

Envia notificacoes para URLs externas quando eventos ocorrem na plataforma.

**Eventos disponiveis:**

| Evento | Descricao |
|--------|-----------|
| `user.registered` | Novo usuario cadastrado |
| `user.login` | Usuario fez login |
| `course.completed` | Aluno concluiu um curso |
| `lesson.completed` | Aluno concluiu uma aula |
| `enrollment.created` | Aluno matriculado em um curso |

Configuravel no painel admin em **Configuracoes > Webhooks**.

---

## Personalizacao (White Label)

### Via variaveis de ambiente

Configure no `.env` antes do deploy:

```env
PLATFORM_NAME=Minha Escola Online
PRIMARY_COLOR=#FF6B00
LOGO_URL=https://meusite.com/logo.png
FAVICON_URL=https://meusite.com/favicon.ico
```

### Via painel admin

Acesse **Admin > Configuracoes > Aparencia** para alterar nome, cor, logo e favicon em tempo real. As configuracoes do painel admin sobrescrevem os valores do `.env`.

### Dominio customizado

1. Aponte o DNS do seu dominio (ex: `membros.seucliente.com`) para o IP do servidor
2. Configure o SSL (automatico no EasePanel, ou via Let's Encrypt/Certbot)
3. Atualize a variavel `APP_URL` no `.env` com a URL final

---

## Estrutura do Projeto

```
h-members/
├── packages/
│   ├── api/          # Backend NestJS (autenticacao, webhooks, CRUD)
│   ├── web/          # Frontend Next.js (vitrine, player, admin)
│   └── shared/       # Types e interfaces compartilhados
├── docker/           # Configs Docker (nginx, supervisord, entrypoint)
├── uploads/          # Armazenamento local de arquivos (capas, materiais, logos)
├── docs/             # Documentacao (PRD, stories, arquitetura)
├── Dockerfile        # Build multi-stage (deps → build → production)
├── docker-compose.yml
└── .env.example
```

---

## API Documentation

- **Swagger UI** disponivel em `/api/docs` quando o servidor esta rodando
- Autenticacao via **JWT** (cookie httpOnly ou header `Authorization: Bearer <token>`)
- Todas as rotas protegidas requerem autenticacao
- Rotas administrativas requerem role `ADMIN`

---

## Comandos Uteis

```bash
# Ver logs em tempo real
docker-compose logs -f app

# Reiniciar a aplicacao
docker-compose restart app

# Rebuild completo (apos mudancas no codigo)
docker-compose up --build -d

# Acessar shell do container
docker exec -it h-members-app sh

# Prisma Studio (visualizar e editar banco via interface web)
docker exec -it h-members-app sh -c "cd /app/packages/api && npx prisma studio"

# Ver status dos containers
docker-compose ps

# Parar a plataforma
docker-compose down

# Parar e remover volumes (CUIDADO: apaga o banco de dados)
docker-compose down -v
```

---

## Seguranca

| Recurso | Detalhes |
|---------|----------|
| **Senhas** | Hash com bcrypt (salt 10) |
| **Autenticacao** | JWT com cookies httpOnly (protege contra XSS) |
| **Rate Limiting** | Login: 5 tentativas/min — Webhooks: 100 requests/min |
| **Webhooks** | Validacao HMAC via `X-Webhook-Secret` |
| **Uploads** | Validacao de tipo MIME e tamanho maximo configuravel |
| **Sessoes** | Bloqueio de sessoes simultaneas (configuravel via `MAX_SESSIONS`) |

---

## Licenca

Proprietario — Editora Level Up. Todos os direitos reservados.
