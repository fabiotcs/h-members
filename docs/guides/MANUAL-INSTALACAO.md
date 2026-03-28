# Manual de Instalacao — H-Members

Plataforma de area de membros estilo Netflix para venda e entrega de cursos online.
Self-hosted, white-label e 100% configuravel.

**Versao do manual:** 1.0
**Ultima atualizacao:** Marco 2026

---

## Sumario

1. [Introducao](#1-introducao)
2. [Requisitos Previos](#2-requisitos-previos)
   - 2.1 [Servidor](#21-servidor)
   - 2.2 [Docker e Docker Compose](#22-docker-e-docker-compose)
   - 2.3 [Dominio](#23-dominio)
   - 2.4 [EasePanel (Opcional mas Recomendado)](#24-easepanel-opcional-mas-recomendado)
3. [Instalacao Passo a Passo](#3-instalacao-passo-a-passo)
   - 3.1 [Conectar no Servidor](#31-conectar-no-servidor)
   - 3.2 [Clonar o Repositorio](#32-clonar-o-repositorio)
   - 3.3 [Configurar Variaveis de Ambiente](#33-configurar-variaveis-de-ambiente)
   - 3.4 [Iniciar a Plataforma](#34-iniciar-a-plataforma)
   - 3.5 [Verificar se Funcionou](#35-verificar-se-funcionou)
   - 3.6 [Acessar a Plataforma](#36-acessar-a-plataforma)
4. [Configuracao de HTTPS (SSL)](#4-configuracao-de-https-ssl)
   - 4.1 [Com EasePanel](#41-com-easepanel)
   - 4.2 [Sem EasePanel — Cloudflare (Recomendado)](#42-sem-easepanel--cloudflare-recomendado)
   - 4.3 [Sem EasePanel — Nginx + Certbot](#43-sem-easepanel--nginx--certbot)
5. [Configuracao de Videos (YouTube)](#5-configuracao-de-videos-youtube)
   - 5.1 [Como Funciona o Mascaramento](#51-como-funciona-o-mascaramento)
   - 5.2 [Formatos de URL Aceitos](#52-formatos-de-url-aceitos)
   - 5.3 [Como Cadastrar um Video](#53-como-cadastrar-um-video)
6. [Configuracao de Webhooks](#6-configuracao-de-webhooks)
   - 6.1 [Webhook de Entrada (Receber Vendas)](#61-webhook-de-entrada-receber-vendas)
   - 6.2 [Configurar na Hotmart](#62-configurar-na-hotmart)
   - 6.3 [Configurar na Kiwify](#63-configurar-na-kiwify)
   - 6.4 [Configurar no Asaas (Pagamento Direto)](#64-configurar-no-asaas-pagamento-direto)
   - 6.5 [Webhook de Saida (Enviar Eventos)](#65-webhook-de-saida-enviar-eventos)
7. [Personalizacao (White Label)](#7-personalizacao-white-label)
   - 7.1 [Via .env (Basico)](#71-via-env-basico)
   - 7.2 [Via Painel Admin (Avancado)](#72-via-painel-admin-avancado)
   - 7.3 [Dominio Personalizado](#73-dominio-personalizado)
8. [Gateway de Pagamento](#8-gateway-de-pagamento)
   - 8.1 [Stripe](#81-stripe)
   - 8.2 [Mercado Pago](#82-mercado-pago)
   - 8.3 [Asaas](#83-asaas)
   - 8.4 [Configurar Preco nos Cursos](#84-configurar-preco-nos-cursos)
9. [Comandos Uteis](#9-comandos-uteis)
10. [Atualizacao](#10-atualizacao)
11. [Solucao de Problemas](#11-solucao-de-problemas)
12. [Seguranca — Boas Praticas](#12-seguranca--boas-praticas)
13. [Suporte](#13-suporte)

---

## 1. Introducao

### O que e o H-Members

O **H-Members** e uma plataforma de area de membros completa, semelhante a Netflix, para venda e entrega de cursos online. Voce instala no seu proprio servidor e tem controle total sobre a plataforma — sem depender de servicos terceiros como Hotmart Spaces, Kiwify Player ou similares.

**Principais recursos:**

- **Vitrine estilo Netflix** — Seus cursos aparecem em cards organizados por categorias, com banners e destaques
- **Player de video profissional** — Videos do YouTube sao exibidos sem o logo do YouTube, sem sugestoes de outros videos e sem links externos. Seu aluno ve apenas o player da sua plataforma
- **White-label completo** — Troque o nome, as cores, o logo e o dominio. A plataforma fica 100% com a sua marca
- **Webhooks bidirecionais** — Integre com Hotmart, Kiwify, Eduzz ou qualquer plataforma de vendas para liberar acesso automaticamente
- **Pagamento integrado** — Aceite pagamentos via Stripe, Mercado Pago ou Asaas diretamente na plataforma
- **Anti-compartilhamento** — Bloqueio de sessoes simultaneas impede que alunos compartilhem logins
- **Progressao do aluno** — Barra de progresso e "continuar assistindo" para cada curso
- **E-mails transacionais** — Recuperacao de senha e notificacoes automaticas
- **Painel administrativo** — Gerencie cursos, alunos, vendas e configuracoes em um so lugar

### Requisitos minimos do servidor

| Recurso | Minimo | Recomendado |
|---------|--------|-------------|
| RAM | 2 GB | 4 GB |
| CPU | 2 vCPU | 4 vCPU |
| Disco | 20 GB SSD | 40 GB SSD |
| Sistema | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| Rede | IP publico fixo | IP publico fixo |

### O que voce vai precisar antes de comecar

Antes de iniciar a instalacao, tenha em maos:

- [ ] Acesso SSH ao servidor (usuario e senha ou chave SSH)
- [ ] Um dominio ou subdominio (ex: `membros.seusite.com`)
- [ ] Um endereco de e-mail para a conta de administrador
- [ ] Uma senha forte para a conta de administrador
- [ ] (Opcional) Credenciais SMTP para envio de e-mails
- [ ] (Opcional) Credenciais do gateway de pagamento (Stripe, Mercado Pago ou Asaas)

---

## 2. Requisitos Previos

### 2.1 Servidor

Voce precisa de um servidor (VPS) com acesso root ou sudo. Recomendamos os seguintes provedores, todos com planos a partir de R$ 25/mes:

| Provedor | Site | Observacao |
|----------|------|------------|
| **Contabo** | contabo.com | Melhor custo-beneficio, servidores na Europa |
| **Hetzner** | hetzner.com | Otima performance, servidores na Europa e EUA |
| **DigitalOcean** | digitalocean.com | Interface simples, servidores no mundo todo |
| **AWS Lightsail** | aws.amazon.com/lightsail | Ecossistema AWS, planos fixos |
| **Hostinger VPS** | hostinger.com.br | Interface em portugues, suporte no Brasil |

**Sistema operacional recomendado:** Ubuntu 22.04 LTS (Long Term Support)

> **Dica:** Na hora de criar o servidor, escolha a regiao mais proxima dos seus alunos. Para o Brasil, servidores na America do Sul ou nos Estados Unidos (leste) oferecem a melhor latencia.

### 2.2 Docker e Docker Compose

O H-Members roda inteiramente dentro de containers Docker. Voce precisa instalar o Docker e o Docker Compose no servidor.

**Passo a passo — Instalacao do Docker no Ubuntu 22.04:**

Conecte no servidor via SSH e execute os comandos abaixo, um por um:

```bash
# 1. Atualizar o sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Docker e o plugin Docker Compose
sudo apt install -y docker.io docker-compose-plugin

# 3. Habilitar Docker para iniciar automaticamente com o servidor
sudo systemctl enable docker
sudo systemctl start docker

# 4. Adicionar seu usuario ao grupo docker (para nao precisar usar sudo)
sudo usermod -aG docker $USER
```

**IMPORTANTE:** Apos o comando acima, voce precisa sair e entrar novamente no servidor para que a mudanca de grupo tenha efeito:

```bash
# 5. Sair do servidor
exit

# 6. Conectar novamente
ssh usuario@seu-servidor-ip
```

**Verificar se a instalacao foi bem-sucedida:**

```bash
# Deve mostrar algo como: Docker version 24.x.x
docker --version

# Deve mostrar algo como: Docker Compose version v2.x.x
docker compose version
```

Se ambos os comandos mostraram versoes, a instalacao esta correta.

### 2.3 Dominio

Para que seus alunos acessem a plataforma com um endereco profissional (ex: `membros.seusite.com`), voce precisa configurar um dominio.

**Passo 1 — Registrar ou escolher um dominio/subdominio**

Se voce ja tem um dominio (ex: `seusite.com`), pode criar um subdominio como `membros.seusite.com`. Nao precisa comprar um dominio novo.

**Passo 2 — Apontar o DNS para o IP do servidor**

Acesse o painel de DNS do seu registrador de dominio (onde voce comprou o dominio — Registro.br, GoDaddy, Cloudflare, etc.) e crie um **registro A**:

| Campo | Valor |
|-------|-------|
| **Tipo** | A |
| **Nome** | `membros` (ou `@` se usar o dominio raiz) |
| **Valor** | IP do seu servidor (ex: `203.0.113.50`) |
| **TTL** | 3600 (ou "Automatico") |

**Passo 3 — Aguardar a propagacao**

Apos salvar o registro DNS, a propagacao pode levar ate 24 horas, mas na maioria dos casos leva apenas 5 a 15 minutos.

**Como verificar se o DNS propagou:**

```bash
# No seu computador local, execute:
ping membros.seusite.com

# Deve responder com o IP do seu servidor
```

Ou acesse: https://dnschecker.org — digite seu dominio e verifique se o IP aparece corretamente.

### 2.4 EasePanel (Opcional mas Recomendado)

O **EasePanel** e um painel de gerenciamento de servidores que simplifica o deploy de aplicacoes Docker. Ele gerencia certificados SSL automaticamente, facilita a configuracao de dominios e oferece uma interface visual para gerenciar containers.

**Vantagens do EasePanel:**
- Deploy visual (sem comandos no terminal)
- SSL automatico (Let's Encrypt)
- Monitoramento de recursos (CPU, RAM, disco)
- Gerenciamento de dominios simplificado

**Como instalar o EasePanel:**

Acesse a documentacao oficial em: https://easepanel.io/docs

**Alternativa:** Se voce preferir nao usar o EasePanel, este manual cobre a instalacao completa usando Docker direto no terminal. O EasePanel e apenas uma conveniencia, nao uma dependencia.

---

## 3. Instalacao Passo a Passo

### 3.1 Conectar no Servidor

Abra o terminal do seu computador e conecte no servidor via SSH:

```bash
ssh usuario@seu-servidor-ip
```

Substitua:
- `usuario` pelo nome de usuario do servidor (geralmente `root` ou o usuario que voce criou)
- `seu-servidor-ip` pelo endereco IP do servidor

Se estiver usando Windows, voce pode usar o **PowerShell**, o **Windows Terminal** ou o programa **PuTTY**.

### 3.2 Clonar o Repositorio

Ja no servidor, execute:

```bash
cd /opt
git clone https://github.com/fabiotcs/h-members.git
cd h-members
```

> **Nota:** Usamos `/opt` como diretorio padrao. Voce pode escolher outro, mas recomendamos `/opt/h-members` para manter a organizacao.

### 3.3 Configurar Variaveis de Ambiente

Copie o arquivo de exemplo e abra para edicao:

```bash
cp .env.example .env
nano .env
```

> **Nota sobre o editor:** O `nano` e um editor de texto simples no terminal. Para salvar, pressione `Ctrl + O` e depois `Enter`. Para sair, pressione `Ctrl + X`.

Abaixo esta a explicacao detalhada de **cada grupo de variaveis**. Preencha com seus dados reais.

---

#### App Core

Configuracoes basicas da aplicacao.

| Variavel | Obrigatoria | Descricao | Exemplo |
|----------|:-----------:|-----------|---------|
| `PORT` | Nao | Porta interna da API (nao mude a menos que saiba o que esta fazendo) | `3001` |
| `NODE_ENV` | Nao | Ambiente de execucao. Mantenha `production` no servidor | `production` |
| `APP_URL` | Sim | URL publica completa da plataforma. **Deve ser a URL final que seus alunos vao acessar** | `https://membros.seusite.com` |
| `APP_PORT` | Nao | Porta HTTP exposta no servidor. Padrao `80` | `80` |
| `CORS_ORIGIN` | Sim | Mesma URL publica da plataforma (igual ao APP_URL) | `https://membros.seusite.com` |
| `LICENSE_KEY` | Nao | Chave de licenca (funcionalidade futura, pode deixar vazio) | |

**Exemplo preenchido:**

```env
PORT=3001
NODE_ENV=production
APP_URL=https://membros.seusite.com
APP_PORT=80
CORS_ORIGIN=https://membros.seusite.com
LICENSE_KEY=
```

---

#### Banco de Dados (MySQL)

O H-Members usa MySQL 8 como banco de dados. O Docker Compose cria o banco automaticamente — voce so precisa definir as credenciais.

| Variavel | Obrigatoria | Descricao | Exemplo |
|----------|:-----------:|-----------|---------|
| `DATABASE_URL` | Sim | String de conexao do banco. **Use `mysql` como host** (nome do container Docker), nao `localhost` | `mysql://hmembers:SenhaForte456!@mysql:3306/hmembers` |
| `DB_ROOT_PASSWORD` | Sim | Senha do usuario root do MySQL. **Crie uma senha forte** | `SenhaRoot@2026!` |
| `DB_USER` | Sim | Nome do usuario do banco | `hmembers` |
| `DB_PASSWORD` | Sim | Senha do usuario do banco. **Crie uma senha forte** | `SenhaForte456!` |
| `DB_NAME` | Sim | Nome do banco de dados | `hmembers` |
| `DB_PORT` | Nao | Porta do MySQL exposta no servidor. Padrao `3306` | `3306` |

> **IMPORTANTE:** Na `DATABASE_URL`, o host deve ser `mysql` (nome do servico no Docker Compose), nao `localhost`. Exemplo correto: `mysql://hmembers:SuaSenha@mysql:3306/hmembers`

**Exemplo preenchido:**

```env
DATABASE_URL=mysql://hmembers:SenhaForte456!@mysql:3306/hmembers
DB_ROOT_PASSWORD=SenhaRoot@2026!
DB_USER=hmembers
DB_PASSWORD=SenhaForte456!
DB_NAME=hmembers
DB_PORT=3306
```

> **Dica:** Use senhas diferentes para `DB_ROOT_PASSWORD` e `DB_PASSWORD`. Nunca use senhas simples como `123456` ou `password`.

---

#### Autenticacao e Seguranca

| Variavel | Obrigatoria | Descricao | Exemplo |
|----------|:-----------:|-----------|---------|
| `JWT_SECRET` | Sim | Chave secreta para gerar tokens de login. **Deve ser uma string aleatoria longa** | *(ver abaixo como gerar)* |
| `JWT_EXPIRES_IN` | Nao | Tempo de expiracao do token. Padrao `7d` (7 dias) | `7d` |
| `ADMIN_EMAIL` | Sim | E-mail do administrador. Sera usado para o primeiro login | `admin@seusite.com` |
| `ADMIN_PASSWORD` | Sim | Senha do administrador. **Crie uma senha forte** | `SuaSenha@123` |
| `MAX_SESSIONS` | Nao | Numero maximo de sessoes simultaneas por aluno. `1` = anti-compartilhamento | `1` |
| `WEBHOOK_SECRET` | Sim | Chave secreta para validar webhooks de entrada. **Deve ser uma string aleatoria** | *(ver abaixo como gerar)* |

**Como gerar chaves seguras:**

Execute esses comandos no terminal do servidor para gerar chaves aleatorias:

```bash
# Gerar JWT_SECRET (64 caracteres hexadecimais)
openssl rand -hex 32

# Gerar WEBHOOK_SECRET (32 caracteres hexadecimais)
openssl rand -hex 16
```

Copie o resultado de cada comando e cole no `.env`.

**Exemplo preenchido:**

```env
JWT_SECRET=a1b2c3d4e5f6...sua_chave_gerada_aqui...
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@seusite.com
ADMIN_PASSWORD=SuaSenha@123
MAX_SESSIONS=1
WEBHOOK_SECRET=f7e8d9c0...sua_chave_gerada_aqui...
```

---

#### E-mail (SMTP)

Configuracao para envio de e-mails transacionais (recuperacao de senha, notificacoes). **Opcional** — a plataforma funciona sem isso, mas a recuperacao de senha por e-mail ficara indisponivel.

| Variavel | Obrigatoria | Descricao | Exemplo |
|----------|:-----------:|-----------|---------|
| `SMTP_HOST` | Nao* | Endereco do servidor SMTP | `smtp.gmail.com` |
| `SMTP_PORT` | Nao | Porta do servidor SMTP | `587` |
| `SMTP_USER` | Nao* | E-mail ou usuario de autenticacao | `seuemail@gmail.com` |
| `SMTP_PASS` | Nao* | Senha ou App Password | `xxxx-xxxx-xxxx-xxxx` |
| `SMTP_FROM` | Nao | E-mail que aparece como remetente | `noreply@seusite.com` |

*Obrigatorio se voce quiser que a recuperacao de senha por e-mail funcione.

**Configuracao com Gmail:**

1. Acesse https://myaccount.google.com/security
2. Ative a **verificacao em duas etapas** (obrigatorio)
3. Em "Senhas de app", crie uma nova senha de aplicativo
4. Use essa senha gerada no campo `SMTP_PASS`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seuemail@gmail.com
SMTP_PASS=abcd-efgh-ijkl-mnop
SMTP_FROM=noreply@seusite.com
```

**Configuracao com outros provedores:**

| Provedor | SMTP_HOST | SMTP_PORT |
|----------|-----------|-----------|
| Gmail | `smtp.gmail.com` | `587` |
| Outlook/Hotmail | `smtp-mail.outlook.com` | `587` |
| Zoho Mail | `smtp.zoho.com` | `587` |
| Amazon SES | `email-smtp.us-east-1.amazonaws.com` | `587` |
| SendGrid | `smtp.sendgrid.net` | `587` |

---

#### White Label (Personalizacao)

Personalize a aparencia da plataforma com sua marca.

| Variavel | Obrigatoria | Descricao | Exemplo |
|----------|:-----------:|-----------|---------|
| `PLATFORM_NAME` | Nao | Nome da plataforma (aparece no cabecalho e titulo da pagina) | `Minha Academia` |
| `PRIMARY_COLOR` | Nao | Cor primaria da interface em formato hexadecimal | `#6366F1` |
| `LOGO_URL` | Nao | Caminho ou URL da logo | `/uploads/logos/meulogo.png` |
| `FAVICON_URL` | Nao | Caminho ou URL do favicon (icone da aba do navegador) | `/uploads/logos/favicon.ico` |

> **Nota:** Esses valores servem como padrao inicial. Depois, voce pode alterar tudo pelo painel admin (Secao 7).

**Exemplo preenchido:**

```env
PLATFORM_NAME=Minha Academia Online
PRIMARY_COLOR=#FF6B00
LOGO_URL=
FAVICON_URL=
```

---

#### Armazenamento de Arquivos

| Variavel | Obrigatoria | Descricao | Exemplo |
|----------|:-----------:|-----------|---------|
| `UPLOAD_DIR` | Nao | Diretorio onde capas, materiais e logos sao salvos | `./uploads` |
| `MAX_UPLOAD_SIZE` | Nao | Tamanho maximo de upload em bytes. Padrao: 50 MB | `52428800` |

> **Nota:** Os uploads ficam na pasta `/app/uploads` dentro do container, que e mapeada para `./uploads` no servidor. Essa pasta e preservada entre atualizacoes.

---

#### Gateway de Pagamento

Escolha qual gateway de pagamento usar (ou `none` se nao for cobrar diretamente na plataforma).

| Variavel | Obrigatoria | Descricao | Exemplo |
|----------|:-----------:|-----------|---------|
| `PAYMENT_GATEWAY` | Nao | Gateway ativo | `stripe`, `mercadopago`, `asaas` ou `none` |

O detalhamento de cada gateway esta na Secao 8. Aqui, veja as variaveis necessarias:

**Stripe:**

| Variavel | Descricao | Onde encontrar |
|----------|-----------|----------------|
| `STRIPE_SECRET_KEY` | Chave secreta da API | Dashboard Stripe > Developers > API Keys |
| `STRIPE_PUBLISHABLE_KEY` | Chave publica da API | Dashboard Stripe > Developers > API Keys |
| `STRIPE_WEBHOOK_SECRET` | Segredo do webhook | Dashboard Stripe > Developers > Webhooks > Signing secret |

**Mercado Pago:**

| Variavel | Descricao | Onde encontrar |
|----------|-----------|----------------|
| `MP_ACCESS_TOKEN` | Token de acesso (producao) | mercadopago.com.br > Suas Integracoes > Credenciais de producao |
| `MP_PUBLIC_KEY` | Chave publica | Mesmo local acima |
| `MP_WEBHOOK_SECRET` | Segredo do webhook | Configurado automaticamente pela API |

**Asaas:**

| Variavel | Descricao | Onde encontrar |
|----------|-----------|----------------|
| `ASAAS_API_KEY` | Chave de API | asaas.com > Configuracoes > Integracao > API |
| `ASAAS_WEBHOOK_TOKEN` | Token de validacao do webhook | Configurado no painel do Asaas ao criar o webhook |
| `ASAAS_SANDBOX` | Modo de teste | `true` (modo teste) / `false` (producao) |

**URLs de retorno do pagamento:**

| Variavel | Descricao | Exemplo |
|----------|-----------|---------|
| `PAYMENT_SUCCESS_URL` | Pagina apos pagamento aprovado | `https://membros.seusite.com/payment/success` |
| `PAYMENT_CANCEL_URL` | Pagina apos pagamento cancelado | `https://membros.seusite.com/payment/cancel` |

---

#### Exemplo completo do .env

Abaixo, um exemplo completo do arquivo `.env` preenchido para producao:

```env
# App Core
PORT=3001
NODE_ENV=production
APP_URL=https://membros.seusite.com
APP_PORT=80
CORS_ORIGIN=https://membros.seusite.com
LICENSE_KEY=

# Banco de Dados
DATABASE_URL=mysql://hmembers:SenhaForte456!@mysql:3306/hmembers
DB_ROOT_PASSWORD=SenhaRoot@2026!
DB_USER=hmembers
DB_PASSWORD=SenhaForte456!
DB_NAME=hmembers
DB_PORT=3306

# Autenticacao
JWT_SECRET=cole_aqui_o_resultado_do_openssl_rand_hex_32
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@seusite.com
ADMIN_PASSWORD=SuaSenhaForte@123
MAX_SESSIONS=1
WEBHOOK_SECRET=cole_aqui_o_resultado_do_openssl_rand_hex_16

# SMTP (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seuemail@gmail.com
SMTP_PASS=abcd-efgh-ijkl-mnop
SMTP_FROM=noreply@seusite.com

# White Label
PLATFORM_NAME=Minha Academia Online
PRIMARY_COLOR=#6366F1
LOGO_URL=
FAVICON_URL=

# Pagamento
PAYMENT_GATEWAY=none
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
MP_ACCESS_TOKEN=
MP_PUBLIC_KEY=
MP_WEBHOOK_SECRET=
ASAAS_API_KEY=
ASAAS_WEBHOOK_TOKEN=
ASAAS_SANDBOX=true
PAYMENT_SUCCESS_URL=https://membros.seusite.com/payment/success
PAYMENT_CANCEL_URL=https://membros.seusite.com/payment/cancel

# Armazenamento
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE=52428800
```

### 3.4 Iniciar a Plataforma

Com o `.env` configurado, inicie a plataforma:

```bash
docker compose up -d --build
```

**O que acontece ao executar esse comando:**

1. **MySQL inicia primeiro** — O container do banco de dados sobe e aguarda estar saudavel (healthcheck a cada 10 segundos)
2. **A aplicacao builda** — Na primeira vez, o Docker baixa as imagens necessarias e compila o codigo. Isso pode levar de **3 a 5 minutos** dependendo da velocidade do servidor
3. **Prisma sincroniza o banco** — As tabelas sao criadas automaticamente no MySQL
4. **Administrador e criado** — O usuario admin e criado com o e-mail e senha definidos no `.env`
5. **Nginx inicia** — O servidor web Nginx comeca a servir a aplicacao na porta 80

> **Nota:** O build inicial e mais demorado. Nas proximas vezes, sera muito mais rapido porque o Docker usa cache.

### 3.5 Verificar se Funcionou

Apos aguardar 1-2 minutos, execute os comandos abaixo para verificar:

**Ver o status dos containers:**

```bash
docker compose ps
```

Resultado esperado — ambos os containers devem mostrar status `Up` e `healthy`:

```
NAME               IMAGE              STATUS                   PORTS
h-members-app      h-members-app      Up 2 minutes (healthy)   0.0.0.0:80->80/tcp
h-members-mysql    mysql:8.0          Up 3 minutes (healthy)   0.0.0.0:3306->3306/tcp
```

**Ver os logs da aplicacao (em tempo real):**

```bash
docker compose logs -f app
```

Procure por mensagens indicando que o servidor iniciou com sucesso. Pressione `Ctrl + C` para parar de ver os logs.

**Testar o endpoint de saude:**

```bash
curl http://localhost/api/v1/health
```

Resultado esperado:

```json
{"status":"ok","timestamp":"2026-03-27T10:00:00.000Z","uptime":120}
```

Se voce viu `{"status":"ok"...}`, a plataforma esta funcionando corretamente.

### 3.6 Acessar a Plataforma

| O que | Endereco |
|-------|----------|
| **Plataforma (vitrine)** | `http://seu-ip` ou `https://membros.seusite.com` |
| **Painel Admin** | `http://seu-ip/admin` ou `https://membros.seusite.com/admin` |
| **Documentacao da API (Swagger)** | `http://seu-ip/api/docs` ou `https://membros.seusite.com/api/docs` |

**Primeiro login:**

1. Acesse o endereco da plataforma no navegador
2. Clique em "Entrar" ou acesse `/admin`
3. Use o e-mail e senha que voce definiu em `ADMIN_EMAIL` e `ADMIN_PASSWORD` no `.env`
4. Voce sera direcionado ao painel administrativo

> **Recomendacao:** Troque a senha do administrador apos o primeiro login, diretamente pelo painel admin.

---

## 4. Configuracao de HTTPS (SSL)

O HTTPS (cadeado verde no navegador) e **essencial** para producao. Sem ele, senhas e dados dos alunos trafegam sem criptografia.

### 4.1 Com EasePanel

Se voce instalou o EasePanel (Secao 2.4), o processo e simples:

1. No painel do EasePanel, va em **Domains**
2. Adicione seu dominio (ex: `membros.seusite.com`)
3. Ative a opcao **"Auto SSL"**
4. O EasePanel gera e renova o certificado Let's Encrypt automaticamente

Pronto. O HTTPS sera configurado sem nenhum comando adicional.

### 4.2 Sem EasePanel — Cloudflare (Recomendado)

O **Cloudflare** e a forma mais simples de adicionar HTTPS sem instalar nada no servidor. O plano gratuito e suficiente.

**Passo 1 — Criar conta no Cloudflare**

1. Acesse https://www.cloudflare.com e crie uma conta gratuita
2. Clique em **"Add a site"** e digite seu dominio (ex: `seusite.com`)
3. Selecione o plano **Free**

**Passo 2 — Alterar os nameservers**

O Cloudflare vai mostrar dois nameservers (ex: `anna.ns.cloudflare.com` e `bob.ns.cloudflare.com`). Voce precisa alterar os nameservers no seu **registrador de dominio** (onde voce comprou o dominio):

1. Acesse o painel do registrador (Registro.br, GoDaddy, etc.)
2. Encontre a configuracao de **DNS** ou **Nameservers**
3. Substitua os nameservers atuais pelos do Cloudflare
4. Salve e aguarde a propagacao (pode levar ate 24 horas)

**Passo 3 — Configurar o DNS no Cloudflare**

1. No Cloudflare, va em **DNS > Records**
2. Adicione um registro:

| Tipo | Nome | Conteudo | Proxy |
|------|------|----------|-------|
| A | `membros` (ou `@` para dominio raiz) | IP do servidor | Ativado (nuvem laranja) |

> **IMPORTANTE:** A nuvem laranja (Proxy ativado) e o que faz o Cloudflare intermediar o trafego e fornecer o HTTPS.

**Passo 4 — Configurar SSL no Cloudflare**

1. Va em **SSL/TLS > Overview**
2. Selecione o modo **"Full"**

Pronto. O Cloudflare agora serve seu site com HTTPS. O certificado e renovado automaticamente.

### 4.3 Sem EasePanel — Nginx + Certbot

Se voce nao quer usar Cloudflare nem EasePanel, pode instalar o Certbot diretamente no servidor. Essa opcao e mais tecnica.

> **Nota:** Como o H-Members ja usa Nginx dentro do container Docker, voce precisara instalar um Nginx no host como proxy reverso. Essa configuracao e mais avancada e recomendamos as opcoes 4.1 ou 4.2 para a maioria dos usuarios.

```bash
# Instalar Nginx e Certbot no host
sudo apt install -y nginx certbot python3-certbot-nginx

# Criar arquivo de configuracao do Nginx
sudo nano /etc/nginx/sites-available/h-members
```

Cole o conteudo abaixo (substitua `membros.seusite.com` pelo seu dominio):

```nginx
server {
    listen 80;
    server_name membros.seusite.com;

    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

> **Nota:** Se usar essa opcao, mude o `APP_PORT` no `.env` para outra porta (ex: `8080`) e aponte o proxy_pass para `http://127.0.0.1:8080`.

```bash
# Ativar o site
sudo ln -s /etc/nginx/sites-available/h-members /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Gerar certificado SSL
sudo certbot --nginx -d membros.seusite.com

# Seguir as instrucoes na tela (aceitar termos, informar e-mail)
```

O Certbot configura o HTTPS e agenda a renovacao automatica do certificado.

---

## 5. Configuracao de Videos (YouTube)

### 5.1 Como Funciona o Mascaramento

O H-Members utiliza o player **Video.js** para reproduzir videos do YouTube de forma profissional. O player customizado:

- **Esconde** o logo do YouTube
- **Remove** sugestoes de videos ao final
- **Oculta** o botao "Assistir no YouTube"
- **Remove** links externos e botao de compartilhar
- **Exibe** apenas os controles de play, volume, tela cheia e barra de progresso

O aluno ve apenas o player da sua plataforma, sem nenhuma referencia ao YouTube.

### 5.2 Formatos de URL Aceitos

Voce pode usar qualquer um destes formatos ao cadastrar um video:

| Formato | Exemplo |
|---------|---------|
| URL padrao | `https://www.youtube.com/watch?v=XXXXXXXXXXX` |
| URL curta | `https://youtu.be/XXXXXXXXXXX` |
| URL embed | `https://www.youtube.com/embed/XXXXXXXXXXX` |

O sistema extrai automaticamente o ID do video (a parte `XXXXXXXXXXX`) e configura o player.

### 5.3 Como Cadastrar um Video

1. Acesse o **Painel Admin** (`/admin`)
2. Va em **Cursos** no menu lateral
3. Selecione o curso desejado
4. Clique no **modulo** onde quer adicionar a aula
5. Clique em **"Adicionar Aula"**
6. Preencha o titulo da aula
7. No campo **"URL do Video"**, cole a URL completa do YouTube
8. Salve a aula

O video sera exibido automaticamente no player mascarado quando o aluno acessar a aula.

> **Dica:** Mantenha os videos como "Nao Listados" no YouTube. Assim, eles nao aparecem em buscas publicas mas podem ser reproduzidos pela plataforma.

---

## 6. Configuracao de Webhooks

Os webhooks permitem que plataformas de vendas externas (Hotmart, Kiwify, Eduzz) liberem acesso aos cursos automaticamente quando uma venda e confirmada.

### 6.1 Webhook de Entrada (Receber Vendas)

**Endpoint da plataforma:**

```
POST https://seu-dominio/api/v1/webhooks/incoming
```

**Header obrigatorio:**

```
X-Webhook-Secret: seu_WEBHOOK_SECRET_do_env
```

O valor do header deve ser **exatamente igual** ao `WEBHOOK_SECRET` que voce definiu no arquivo `.env`.

**Payload esperado (formato padrao):**

```json
{
  "event": "purchase.completed",
  "customer": {
    "email": "aluno@email.com",
    "name": "Nome do Aluno"
  },
  "product": {
    "id": "CURSO-001",
    "name": "Nome do Curso"
  },
  "transaction": {
    "id": "TXN-123456",
    "status": "approved",
    "date": "2026-03-27T10:00:00Z"
  }
}
```

**Como o sistema libera o acesso:**

1. O webhook chega com o e-mail do aluno e o nome/ID do produto
2. O sistema cria o usuario automaticamente (se nao existir) com uma senha aleatoria
3. O aluno recebe acesso ao curso correspondente
4. Se o SMTP estiver configurado, o aluno recebe um e-mail com as credenciais de acesso

### 6.2 Configurar na Hotmart

1. Acesse sua conta na **Hotmart** (https://app.hotmart.com)
2. Va em **Ferramentas > Webhooks** (ou Configuracoes > Webhooks)
3. Clique em **"Configurar Webhook"** ou **"Adicionar"**
4. Preencha:

| Campo | Valor |
|-------|-------|
| **URL** | `https://membros.seusite.com/api/v1/webhooks/incoming` |
| **Evento** | Compra aprovada (ou `PURCHASE_APPROVED`) |

5. Adicione um **header personalizado**:

| Nome do header | Valor |
|----------------|-------|
| `X-Webhook-Secret` | O valor de `WEBHOOK_SECRET` do seu `.env` |

6. Salve a configuracao
7. Use o botao **"Testar"** para enviar um webhook de teste e verificar se a plataforma recebe corretamente

### 6.3 Configurar na Kiwify

1. Acesse sua conta na **Kiwify** (https://dashboard.kiwify.com.br)
2. Va em **Configuracoes > Webhooks**
3. Clique em **"Adicionar Webhook"**
4. Preencha:

| Campo | Valor |
|-------|-------|
| **URL** | `https://membros.seusite.com/api/v1/webhooks/incoming` |
| **Eventos** | Venda confirmada (`order_paid` ou similar) |

5. Se houver campo para header de autenticacao, adicione:
   - Nome: `X-Webhook-Secret`
   - Valor: O valor de `WEBHOOK_SECRET` do seu `.env`

6. Salve e teste

### 6.4 Configurar no Asaas (Pagamento Direto)

Se voce usar o **Asaas como gateway nativo** da plataforma (PAYMENT_GATEWAY=asaas), o webhook de pagamento usa um endpoint diferente:

1. Acesse o painel do **Asaas** (https://www.asaas.com)
2. Va em **Configuracoes > Integracao > Webhooks**
3. Clique em **"Adicionar Webhook"**
4. Preencha:

| Campo | Valor |
|-------|-------|
| **URL** | `https://membros.seusite.com/api/v1/payments/webhook/asaas` |
| **Eventos** | `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED` |
| **Token de autenticacao** | O valor de `ASAAS_WEBHOOK_TOKEN` do seu `.env` |

5. Salve

### 6.5 Webhook de Saida (Enviar Eventos)

A plataforma tambem pode **enviar** notificacoes para sistemas externos quando algo acontece. Isso e util para integrar com CRMs, automacoes (Zapier, N8N, Make) ou ferramentas de e-mail marketing (ActiveCampaign, Mailchimp).

**Eventos disponiveis:**

| Evento | Descricao |
|--------|-----------|
| `user.registered` | Novo usuario cadastrado na plataforma |
| `user.login` | Usuario fez login |
| `course.completed` | Aluno concluiu todas as aulas de um curso |
| `lesson.completed` | Aluno concluiu uma aula especifica |
| `enrollment.created` | Aluno foi matriculado em um curso |

**Como configurar:**

1. Acesse o **Painel Admin** > **Configuracoes** > **Webhooks**
2. Clique em **"Adicionar Webhook de Saida"**
3. Preencha a **URL de destino** (ex: URL do Zapier, N8N ou ActiveCampaign)
4. Selecione os **eventos** que deseja enviar
5. Salve

---

## 7. Personalizacao (White Label)

O H-Members e 100% personalizavel. Voce pode trocar o nome, as cores, o logo e o dominio para que a plataforma fique com a identidade da sua marca.

### 7.1 Via .env (Basico)

Para personalizar antes de iniciar a plataforma, edite as variaveis no arquivo `.env`:

```env
PLATFORM_NAME=Minha Academia Online
PRIMARY_COLOR=#FF6B00
LOGO_URL=
FAVICON_URL=
```

Apos editar, reinicie a aplicacao para aplicar:

```bash
docker compose restart app
```

> **Nota:** Se voce alterar `PLATFORM_NAME` ou `APP_URL`, e necessario fazer um rebuild completo, pois essas variaveis sao usadas no build do Next.js:
> ```bash
> docker compose up --build -d
> ```

### 7.2 Via Painel Admin (Avancado)

Apos o primeiro login, voce pode personalizar tudo pelo painel admin sem tocar em arquivos:

1. Acesse **Admin > Configuracoes > Aparencia**
2. Altere:
   - **Nome da plataforma** — Aparece no cabecalho e no titulo da pagina
   - **Cor primaria** — Use o seletor de cor para escolher a cor da sua marca
   - **Logo** — Faca upload de um arquivo PNG/SVG (recomendado: 200x50px)
   - **Favicon** — Faca upload de um arquivo ICO/PNG (recomendado: 32x32px)
3. Clique em **Salvar**

As alteracoes sao aplicadas imediatamente, sem necessidade de reiniciar.

> **Nota:** As configuracoes feitas pelo painel admin **sobrescrevem** os valores do `.env`. Ou seja, o `.env` define os valores iniciais e o painel admin permite ajustar depois.

### 7.3 Dominio Personalizado

Para usar um dominio personalizado (ex: `academia.suamarca.com`):

1. **Configure o DNS** — No registrador do dominio, crie um registro A apontando para o IP do servidor (igual a Secao 2.3)
2. **Configure o HTTPS** — Siga a Secao 4 para ativar o SSL no novo dominio
3. **Atualize o .env** — Altere as variaveis `APP_URL` e `CORS_ORIGIN`:

```env
APP_URL=https://academia.suamarca.com
CORS_ORIGIN=https://academia.suamarca.com
```

4. **Rebuild e reinicie:**

```bash
docker compose up --build -d
```

---

## 8. Gateway de Pagamento

O H-Members suporta tres gateways de pagamento para vender cursos diretamente na plataforma. Voce tambem pode usar `PAYMENT_GATEWAY=none` e gerenciar vendas por plataformas externas (Hotmart, Kiwify) via webhooks.

**Comparacao dos gateways:**

| Recurso | Stripe | Mercado Pago | Asaas |
|---------|--------|--------------|-------|
| Cartao de credito | Sim | Sim | Sim |
| PIX | Sim | Sim | Sim |
| Boleto | Nao | Sim | Sim |
| Foco no Brasil | Parcial | Sim | Sim |
| Modo de teste (sandbox) | Sim | Sim | Sim |

### 8.1 Stripe

O **Stripe** e uma das maiores plataformas de pagamento do mundo. Aceita cartoes internacionais e PIX.

**Passo 1 — Criar conta**

1. Acesse https://stripe.com e crie uma conta
2. Complete a verificacao de identidade (documentos e conta bancaria)
3. Aguarde a aprovacao (geralmente 1-2 dias uteis)

**Passo 2 — Obter chaves de API**

1. No Dashboard do Stripe, va em **Developers > API Keys**
2. Copie a **Secret key** (comeca com `sua_secret_key_...`)
3. Copie a **Publishable key** (comeca com `sua_publishable_key_...`)

**Passo 3 — Configurar webhook**

1. No Dashboard do Stripe, va em **Developers > Webhooks**
2. Clique em **"Add endpoint"**
3. Preencha:

| Campo | Valor |
|-------|-------|
| **Endpoint URL** | `https://membros.seusite.com/api/v1/payments/webhook/stripe` |
| **Events to send** | `checkout.session.completed` |

4. Apos criar, clique no webhook e copie o **Signing secret** (comeca com `whsec_...`)

**Passo 4 — Configurar no .env**

```env
PAYMENT_GATEWAY=stripe
STRIPE_SECRET_KEY=SUA_SECRET_KEY_AQUI
STRIPE_PUBLISHABLE_KEY=SUA_PUBLISHABLE_KEY_AQUI
STRIPE_WEBHOOK_SECRET=SEU_WEBHOOK_SECRET_AQUI
PAYMENT_SUCCESS_URL=https://membros.seusite.com/payment/success
PAYMENT_CANCEL_URL=https://membros.seusite.com/payment/cancel
```

**Passo 5 — Reiniciar**

```bash
docker compose restart app
```

### 8.2 Mercado Pago

O **Mercado Pago** e o gateway mais popular no Brasil. Aceita cartao, PIX e boleto.

**Passo 1 — Criar conta**

1. Acesse https://www.mercadopago.com.br e crie uma conta
2. Complete a verificacao de identidade

**Passo 2 — Criar aplicacao e obter credenciais**

1. Acesse https://www.mercadopago.com.br/developers/panel
2. Clique em **"Suas integracoes"** > **"Criar aplicacao"**
3. Preencha o nome da aplicacao (ex: "H-Members - Minha Academia")
4. Selecione **"Checkout Pro"** ou **"Pagamentos online"**
5. Apos criar, va em **Credenciais de producao**
6. Copie o **Access Token** e a **Public Key**

**Passo 3 — Configurar no .env**

```env
PAYMENT_GATEWAY=mercadopago
MP_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MP_PUBLIC_KEY=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PAYMENT_SUCCESS_URL=https://membros.seusite.com/payment/success
PAYMENT_CANCEL_URL=https://membros.seusite.com/payment/cancel
```

> **Nota:** O Mercado Pago configura o webhook automaticamente via a API. Nao e necessario configurar manualmente.

**Passo 4 — Reiniciar**

```bash
docker compose restart app
```

### 8.3 Asaas

O **Asaas** e uma plataforma brasileira de cobrancas. Aceita cartao, PIX e boleto, com taxas competitivas.

**Passo 1 — Criar conta**

1. Acesse https://www.asaas.com e crie uma conta
2. Complete a verificacao de identidade e dados bancarios

**Passo 2 — Obter chave de API**

1. No painel do Asaas, va em **Configuracoes > Integracao > API**
2. Gere uma nova **chave de API** (comeca com `$aact_...`)
3. Copie e guarde a chave em local seguro

**Passo 3 — Configurar webhook**

1. No painel do Asaas, va em **Configuracoes > Integracao > Webhooks**
2. Clique em **"Adicionar"**
3. Preencha:

| Campo | Valor |
|-------|-------|
| **URL** | `https://membros.seusite.com/api/v1/payments/webhook/asaas` |
| **Eventos** | `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED` |

4. Defina um **token de autenticacao** e copie-o

**Passo 4 — Configurar no .env**

```env
PAYMENT_GATEWAY=asaas
ASAAS_API_KEY=$aact_xxxxxxxxxxxxxxxxxxxxxxxx
ASAAS_WEBHOOK_TOKEN=seu_token_definido_no_passo_anterior
ASAAS_SANDBOX=false
PAYMENT_SUCCESS_URL=https://membros.seusite.com/payment/success
PAYMENT_CANCEL_URL=https://membros.seusite.com/payment/cancel
```

> **Dica:** Para testar antes de ir para producao, use `ASAAS_SANDBOX=true`. O Asaas possui um ambiente de teste completo em https://sandbox.asaas.com

**Passo 5 — Reiniciar**

```bash
docker compose restart app
```

### 8.4 Configurar Preco nos Cursos

Apos configurar o gateway de pagamento:

1. Acesse o **Painel Admin** > **Cursos**
2. Clique em **Editar** no curso desejado
3. No campo **"Preco"**, informe o valor em reais (ex: `97.00`)
4. Salve as alteracoes

Para alunos que nao possuem acesso ao curso, aparecera um botao **"Comprar por R$ 97,00"**. Ao clicar, o aluno sera redirecionado para a pagina de pagamento do gateway configurado.

> **Nota:** Cursos com preco `0` ou vazio sao considerados gratuitos e podem ser acessados por qualquer usuario cadastrado.

---

## 9. Comandos Uteis

Referencia rapida de comandos para o dia a dia de gerenciamento da plataforma. Execute todos dentro da pasta `/opt/h-members`.

```bash
# Primeiro, entre na pasta do projeto
cd /opt/h-members
```

### Ver status dos containers

```bash
docker compose ps
```

### Ver logs em tempo real

```bash
# Logs da aplicacao (pressione Ctrl+C para parar)
docker compose logs -f app

# Logs do banco de dados
docker compose logs -f mysql

# Logs de tudo
docker compose logs -f
```

### Reiniciar a aplicacao

```bash
# Reiniciar apenas a aplicacao (rapido, sem rebuild)
docker compose restart app

# Rebuild completo (necessario apos atualizar o codigo ou .env com PLATFORM_NAME/APP_URL)
docker compose up --build -d
```

### Parar e iniciar

```bash
# Parar tudo (os dados sao preservados)
docker compose down

# Iniciar novamente
docker compose up -d

# CUIDADO: Parar e APAGAR TODOS OS DADOS (banco, volumes)
# Use apenas se quiser recomecar do zero
docker compose down -v
```

### Acessar o terminal do container

```bash
# Abrir um shell dentro do container da aplicacao
docker exec -it h-members-app sh

# Para sair do shell do container
exit
```

### Banco de dados

```bash
# Acessar o MySQL via terminal
docker exec -it h-members-mysql mysql -u hmembers -p hmembers
# (digite a senha DB_PASSWORD quando solicitado)

# Backup do banco de dados (salva na pasta atual)
docker exec h-members-mysql mysqldump -u root -p"${DB_ROOT_PASSWORD}" hmembers > backup_$(date +%Y%m%d).sql

# Restaurar um backup
docker exec -i h-members-mysql mysql -u root -p"${DB_ROOT_PASSWORD}" hmembers < backup_20260327.sql
```

> **Dica de seguranca:** Faca backup do banco pelo menos uma vez por semana. Voce pode automatizar com um cron job:
> ```bash
> # Editar o crontab
> crontab -e
>
> # Adicionar essa linha para backup diario as 3h da manha
> 0 3 * * * cd /opt/h-members && docker exec h-members-mysql mysqldump -u root -pSuaSenhaRoot hmembers > /opt/h-members/backups/backup_$(date +\%Y\%m\%d).sql
> ```
> Crie a pasta de backups antes: `mkdir -p /opt/h-members/backups`

### Limpeza e manutencao

```bash
# Ver espaco em disco usado pelo Docker
docker system df

# Limpar imagens antigas e nao utilizadas
docker image prune -f

# Limpar tudo que nao esta em uso (imagens, containers parados, redes)
docker system prune -f
```

---

## 10. Atualizacao

Quando uma nova versao do H-Members for lancada, siga estes passos para atualizar:

```bash
# 1. Entrar na pasta do projeto
cd /opt/h-members

# 2. (Recomendado) Fazer backup do banco antes de atualizar
docker exec h-members-mysql mysqldump -u root -p"${DB_ROOT_PASSWORD}" hmembers > backup_pre_update_$(date +%Y%m%d).sql

# 3. Baixar a ultima versao do codigo
git pull origin master

# 4. Rebuild e reiniciar com a nova versao
docker compose up --build -d

# 5. Verificar os logs para garantir que tudo iniciou corretamente
docker compose logs -f app
```

**O que e preservado automaticamente durante a atualizacao:**

- **Banco de dados** — O Prisma executa as migrations automaticamente no boot. Seus dados (cursos, alunos, progresso) sao mantidos
- **Uploads** — A pasta `/uploads` (capas de cursos, materiais, logos) e um volume Docker e nao e afetada pelo rebuild
- **Configuracoes** — O arquivo `.env` nao e tocado pelo `git pull`

**O que pode precisar de atencao:**

- Se o `.env.example` tiver novas variaveis, voce precisa adicioná-las manualmente ao seu `.env`
- Verifique as notas de versao (release notes) no repositorio para saber se ha alguma acao necessaria

> **Dica:** Sempre faca backup do banco antes de atualizar. Se algo der errado, voce pode restaurar o backup (ver Secao 9).

---

## 11. Solucao de Problemas

### Container nao inicia

**Diagnostico:**

```bash
docker compose logs app
```

**Causas comuns:**

- **Arquivo `.env` nao existe ou esta mal configurado** — Verifique se voce copiou o `.env.example` para `.env` e preencheu todas as variaveis obrigatorias
- **Porta 80 ja esta em uso** — Outro servico pode estar usando a porta. Verifique com `sudo lsof -i :80` e pare o servico ou mude `APP_PORT` no `.env`
- **Erro de sintaxe no `.env`** — Nao use espacos ao redor do `=`. Correto: `DB_USER=hmembers`. Errado: `DB_USER = hmembers`

---

### Erro de conexao com o banco de dados

**Sintoma:** Logs mostram erro de conexao MySQL, como `ECONNREFUSED` ou `Access denied`.

**Solucao:**

1. Verifique se a `DATABASE_URL` usa `mysql` como host (nome do container), **nao** `localhost`:

```env
# CORRETO
DATABASE_URL=mysql://hmembers:suasenha@mysql:3306/hmembers

# ERRADO (nao funciona no Docker)
DATABASE_URL=mysql://hmembers:suasenha@localhost:3306/hmembers
```

2. Verifique se `DB_USER`, `DB_PASSWORD` e `DB_NAME` na `DATABASE_URL` conferem com as variaveis `DB_USER`, `DB_PASSWORD` e `DB_NAME` separadas
3. Se voce mudou senhas apos a primeira execucao, pode ser necessario recriar o banco:

```bash
docker compose down -v
docker compose up -d --build
```

> **ATENCAO:** O comando `docker compose down -v` apaga todos os dados do banco. So use se estiver comecando do zero.

---

### Login nao funciona

**Sintoma:** Voce insere e-mail e senha corretos mas nao consegue entrar, ou e redirecionado de volta para a tela de login.

**Solucao:**

1. **Verifique `JWT_SECRET`** — Certifique-se de que o `JWT_SECRET` no `.env` e uma string longa e aleatoria, nao o valor padrao `CHANGE_ME_TO_A_STRONG_RANDOM_STRING`
2. **Verifique `APP_URL`** — Deve corresponder exatamente ao dominio que voce esta acessando no navegador, incluindo `https://` se estiver usando HTTPS

```env
# Se voce acessa via https://membros.seusite.com
APP_URL=https://membros.seusite.com

# Se ainda esta testando via IP
APP_URL=http://203.0.113.50
```

3. **Verifique `CORS_ORIGIN`** — Deve ser o mesmo valor de `APP_URL`
4. **Limpe os cookies** do navegador e tente novamente

---

### E-mail nao envia

**Sintoma:** Recuperacao de senha nao envia e-mail, ou erros de SMTP nos logs.

**Solucao:**

1. Verifique se `SMTP_HOST`, `SMTP_USER` e `SMTP_PASS` estao preenchidos corretamente
2. **Se usar Gmail:** Voce deve usar uma **Senha de Aplicativo**, nao sua senha normal do Gmail:
   - Acesse https://myaccount.google.com/apppasswords
   - Gere uma senha de aplicativo para "E-mail"
   - Use essa senha no `SMTP_PASS`
3. Verifique a porta:
   - `587` para TLS (recomendado)
   - `465` para SSL
4. Verifique nos logs se ha mais detalhes do erro:

```bash
docker compose logs app | grep -i smtp
```

---

### Webhook nao libera acesso

**Sintoma:** A venda e confirmada na Hotmart/Kiwify mas o aluno nao recebe acesso na plataforma.

**Solucao:**

1. **Verifique o `WEBHOOK_SECRET`** — O segredo configurado no `.env` deve ser **identico** ao configurado na plataforma de vendas (Hotmart, Kiwify, etc.)
2. **Verifique o mapeamento do produto** — O `product.name` ou `product.id` do webhook deve corresponder ao titulo ou identificador do curso cadastrado na plataforma
3. **Consulte os logs** para ver se o webhook chegou e qual erro ocorreu:

```bash
docker compose logs app | grep -i webhook
```

4. **Teste manualmente** com curl:

```bash
curl -X POST https://membros.seusite.com/api/v1/webhooks/incoming \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: seu_webhook_secret" \
  -d '{
    "event": "purchase.completed",
    "customer": {"email": "teste@email.com", "name": "Teste"},
    "product": {"id": "1", "name": "Nome do Curso"}
  }'
```

---

### Pagamento nao processa

**Sintoma:** Aluno clica em comprar mas o pagamento nao funciona ou da erro.

**Solucao:**

1. **Verifique `PAYMENT_GATEWAY`** no `.env` — Deve ser `stripe`, `mercadopago` ou `asaas`
2. **Verifique as chaves de API** — Certifique-se de que esta usando as chaves de **producao**, nao de teste
3. **Asaas:** Certifique-se de que `ASAAS_SANDBOX=false` para producao. Com `true`, os pagamentos vao para o ambiente de teste
4. **Stripe:** Verifique se o webhook esta configurado no Dashboard do Stripe com a URL correta e os eventos corretos
5. **Consulte os logs:**

```bash
docker compose logs app | grep -i payment
```

---

### Plataforma lenta ou travando

**Sintoma:** Paginas demoram para carregar ou a aplicacao fica instavel.

**Solucao:**

1. Verifique o uso de recursos:

```bash
docker stats
```

2. Se o uso de memoria estiver acima de 90%, considere aumentar a RAM do servidor
3. Verifique o espaco em disco:

```bash
df -h
```

4. Limpe imagens Docker antigas:

```bash
docker image prune -f
```

---

## 12. Seguranca — Boas Praticas

Use esta lista como checklist de seguranca para sua instalacao:

- [ ] **Trocar a senha do administrador** apos o primeiro login no painel admin
- [ ] **Gerar `JWT_SECRET` forte** — Execute: `openssl rand -hex 32` e cole no `.env`
- [ ] **Gerar `WEBHOOK_SECRET` forte** — Execute: `openssl rand -hex 16` e cole no `.env`
- [ ] **Configurar HTTPS** (Secao 4) — Nunca opere a plataforma em producao sem HTTPS
- [ ] **Nao expor a porta 3306 (MySQL) publicamente** — Se nao precisar acessar o banco externamente, remova a linha `ports` do servico `mysql` no `docker-compose.yml`
- [ ] **Fazer backup regular do banco de dados** (ver Secao 9) — Recomendado: backup diario automatizado
- [ ] **Manter o Docker atualizado:**

```bash
sudo apt update && sudo apt upgrade docker.io -y
```

- [ ] **Manter o sistema operacional atualizado:**

```bash
sudo apt update && sudo apt upgrade -y
```

- [ ] **Configurar firewall** — Permita apenas as portas necessarias (80, 443, 22):

```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

- [ ] **Nao compartilhar o arquivo `.env`** — Ele contem senhas e chaves secretas
- [ ] **Usar `MAX_SESSIONS=1`** para prevenir compartilhamento de logins entre alunos

---

## 13. Suporte

| Recurso | Endereco |
|---------|----------|
| **Repositorio no GitHub** | https://github.com/fabiotcs/h-members |
| **Reportar problemas (Issues)** | https://github.com/fabiotcs/h-members/issues |
| **Documentacao da API (Swagger)** | `https://seu-dominio/api/docs` (disponivel quando a plataforma esta rodando) |

**Antes de abrir um issue, inclua:**

1. Versao do Docker: `docker --version`
2. Logs do erro: `docker compose logs app --tail 50`
3. Sistema operacional do servidor
4. Descricao detalhada do problema e passos para reproduzir
