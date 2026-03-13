# Tutorial - Participa DF (Ouvidoria Digital PWA)

> **Participa DF Tutorial** — Complete guide for setting up, using, and developing the Digital Ombudsman PWA.

---

## Sumário / Table of Contents

1. [Visão Geral / Overview](#1-visão-geral--overview)
2. [Pré-requisitos / Prerequisites](#2-pré-requisitos--prerequisites)
3. [Instalação e Configuração / Installation & Setup](#3-instalação-e-configuração--installation--setup)
4. [Estrutura do Projeto / Project Structure](#4-estrutura-do-projeto--project-structure)
5. [Guia de Uso / Usage Guide](#5-guia-de-uso--usage-guide)
6. [API Reference](#6-api-reference)
7. [Segurança / Security](#7-segurança--security)
8. [Desenvolvimento Local / Local Development](#8-desenvolvimento-local--local-development)
9. [Acessibilidade / Accessibility](#9-acessibilidade--accessibility)
10. [PWA](#10-pwa)

---

## 1. Visão Geral / Overview

O **Participa DF** é uma plataforma de ouvidoria digital construída como Progressive Web App (PWA). Permite que cidadãos enviem manifestações (reclamações, sugestões, denúncias) via texto, imagem ou áudio, com processamento por IA para extração de conteúdo.

> **Participa DF** is a digital ombudsman platform built as a Progressive Web App (PWA). It allows citizens to submit manifestations (complaints, suggestions, reports) via text, image, or audio, with AI-powered content extraction.

### Stack Tecnológica / Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Angular 17, Angular Material, Tailwind CSS |
| Backend (Python) | FastAPI, SQLAlchemy, Whisper, Tesseract OCR |
| Backend (Java) | Spring Boot 3.2, JPA/Hibernate |
| Banco de Dados | PostgreSQL 15 |
| Proxy/Web Server | Nginx |
| Containerização | Docker & Docker Compose |

### Arquitetura / Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENTE / CLIENT                   │
│                   (Browser / PWA App)                    │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP (80/443)
                        ▼
┌─────────────────────────────────────────────────────────┐
│                     NGINX (Proxy)                       │
│  ┌─────────────────┐  ┌──────────────────────────────┐  │
│  │  Static Assets  │  │  Reverse Proxy → Backend     │  │
│  │  (Angular SPA)  │  │  /submit-manifestation       │  │
│  │                 │  │  /manifestation/{protocol}   │  │
│  └─────────────────┘  └──────────┬───────────────────┘  │
│  Rate Limiting · Security Headers · CORS                │
└──────────────────────────────────┬──────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
     ┌──────────────────────┐      ┌──────────────────────┐
     │  Backend Python      │  OR  │  Backend Java        │
     │  FastAPI :8000       │      │  Spring Boot :8080   │
     │                      │      │                      │
     │  ┌────────────────┐  │      │  ┌────────────────┐  │
     │  │ Whisper (Audio)│  │      │  │ Tika (Files)   │  │
     │  │ Tesseract (OCR)│  │      │  │                │  │
     │  └────────────────┘  │      │  └────────────────┘  │
     └──────────┬───────────┘      └──────────┬───────────┘
                │                              │
                └──────────────┬───────────────┘
                               ▼
                ┌──────────────────────────┐
                │   PostgreSQL 15          │
                │   participadf database   │
                │   :5432                  │
                └──────────────────────────┘
```

---

## 2. Pré-requisitos / Prerequisites

### Obrigatórios / Required

| Ferramenta | Versão Mínima | Verificação |
|-----------|---------------|-------------|
| Docker | 20.10+ | `docker --version` |
| Docker Compose | 2.0+ | `docker compose version` |

### Opcionais (Desenvolvimento Local) / Optional (Local Dev)

| Ferramenta | Versão | Para quê |
|-----------|--------|----------|
| Node.js | 18+ | Frontend Angular |
| Python | 3.12+ | Backend Python |
| Java JDK | 17+ | Backend Java |
| FFmpeg | latest | Processamento de áudio/vídeo (Whisper) |
| Tesseract OCR | 5+ | Extração de texto de imagens |
| Maven | 3.9+ | Build do backend Java |

---

## 3. Instalação e Configuração / Installation & Setup

### 3.1 Clonar o Repositório / Clone Repository

```bash
git clone <repository-url>
cd participa-df
```

### 3.2 Configurar Variáveis de Ambiente / Configure Environment Variables

```bash
cp .env.example .env
```

Edite o arquivo `.env` com valores seguros:

```env
# PostgreSQL — Credenciais do banco de dados
POSTGRES_USER=user                          # Usuário do PostgreSQL
POSTGRES_PASSWORD=change_me_strong_password # ALTERE para uma senha forte
POSTGRES_DB=participadf                     # Nome do banco

# Backend Python
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
ALLOWED_ORIGINS=http://localhost,http://localhost:80   # Origens CORS permitidas
API_KEY=change_me_to_a_secure_random_key               # Chave de autenticação da API

# Backend Java
SPRING_DATASOURCE_USERNAME=${POSTGRES_USER}
SPRING_DATASOURCE_PASSWORD=${POSTGRES_PASSWORD}
JDBC_DATABASE_URL=jdbc:postgresql://db:5432/${POSTGRES_DB}
DB_DRIVER=org.postgresql.Driver
SHOW_SQL=false                              # true apenas para debug
```

> **IMPORTANT:** Never commit the `.env` file. It is already in `.gitignore`.

### 3.3 Subir os Containers / Start Containers

**Com backend Python:**
```bash
docker compose up --build
```

**Com backend Java:**
```bash
docker compose -f docker-compose-java.yml up --build
```

### 3.4 Verificar / Verify

Após subir, verifique os 3 containers rodando:

```bash
docker ps
```

Saída esperada:
```
CONTAINER ID   IMAGE                    STATUS          PORTS
xxxx           participadf-frontend     Up              0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
xxxx           participadf-backend      Up              0.0.0.0:8000->8000/tcp
xxxx           postgres:15-alpine       Up (healthy)    0.0.0.0:5432->5432/tcp
```

Acesse: **http://localhost**

---

## 4. Estrutura do Projeto / Project Structure

```
participa-df/
├── .env.example                    # Template de variáveis de ambiente
├── .gitignore                      # Ignora .env, node_modules, etc.
├── docker-compose.yml              # Compose com backend Python
├── docker-compose-java.yml         # Compose com backend Java
├── SECURITY_REPORT.md              # Relatório de segurança
│
├── frontend/                       # Angular 17 PWA
│   ├── nginx.conf                  # Nginx config (backend Python)
│   ├── nginx-java.conf             # Nginx config (backend Java)
│   └── src/app/
│       ├── components/
│       │   ├── manifestation-form/       # Formulário de submissão
│       │   ├── manifestation-status/     # Consulta de protocolo
│       │   └── form-builder/             # Form Builder dinâmico
│       └── services/
│           └── manifestation.service.ts  # Serviço HTTP
│
├── backend/                        # FastAPI (Python)
│   ├── Dockerfile
│   ├── requirements.txt            # Dependências pinadas
│   └── main.py                     # Endpoints + IA (Whisper/OCR)
│
└── backend-java/                   # Spring Boot (Java)
    ├── Dockerfile
    ├── pom.xml                     # Maven dependencies
    └── src/main/java/com/participadf/backend/
        ├── controller/ManifestationController.java
        ├── service/ManifestationService.java
        ├── service/ProtocolService.java
        ├── config/CorsConfig.java
        ├── dto/ManifestationResponse.java
        └── dto/ManifestationStatusResponse.java
```

---

## 5. Guia de Uso / Usage Guide

### Fluxo 1: Criar Nova Manifestação / Submit New Manifestation

```
┌──────────────────────────────────────────┐
│         NOVA MANIFESTAÇÃO                │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  Descreva sua manifestação:       │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │                              │  │  │
│  │  │  (campo de texto livre)      │  │  │
│  │  │                              │  │  │
│  │  └──────────────────────────────┘  │  │
│  │                                    │  │
│  │  📎 Anexar arquivo (opcional)      │  │
│  │  [imagem, áudio ou vídeo]          │  │
│  │                                    │  │
│  │  ☑ Enviar como anônimo             │  │
│  │                                    │  │
│  │  [ ENVIAR MANIFESTAÇÃO ]           │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ✅ Protocolo: OUV-20260313-A1B2C3D4    │
│  "Manifestação recebida com sucesso."    │
└──────────────────────────────────────────┘
```

**Passos:**
1. Acesse **http://localhost**
2. Preencha o campo de texto com a manifestação
3. (Opcional) Anexe arquivo de imagem, áudio ou vídeo
4. (Opcional) Marque "Enviar como anônimo"
5. Clique em **ENVIAR MANIFESTAÇÃO**
6. Copie o **número do protocolo** gerado (formato: `OUV-YYYYMMDD-XXXXXXXX`)

### Fluxo 2: Consultar Status / Check Status

```
┌──────────────────────────────────────────┐
│      CONSULTAR MANIFESTAÇÃO              │
│                                          │
│  Número do Protocolo:                    │
│  ┌──────────────────────────┐ [BUSCAR]   │
│  │ OUV-20260313-A1B2C3D4   │            │
│  └──────────────────────────┘            │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  Detalhes da Manifestação         │  │
│  │                                    │  │
│  │  Protocolo: OUV-20260313-A1B2C3D4 │  │
│  │  Tipo de Fonte: text_only         │  │
│  │  Status: EM PROCESSAMENTO         │  │
│  │  Data: 13/03/2026 14:30           │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

**Passos:**
1. Navegue para a tela "Consultar Manifestação"
2. Insira o número do protocolo recebido
3. Clique **BUSCAR** ou pressione Enter
4. Veja o status: **EM PROCESSAMENTO** ou **PROCESSADO**

### Fluxo 3: Form Builder (Avançado)

O Form Builder permite criar formulários dinâmicos com campos personalizados. Útil para administradores que precisam de formulários específicos por tipo de manifestação.

---

## 6. API Reference

### POST `/submit-manifestation`

Submete uma nova manifestação ao sistema.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `text` | string (form) | Não* | Texto da manifestação (max 10.000 caracteres) |
| `file` | file (form) | Não* | Arquivo de mídia (max 50MB). Tipos: `.jpg`, `.png`, `.mp3`, `.wav`, `.mp4`, etc. |
| `anonymous` | boolean (form) | Não | Enviar como anônimo (default: `false`) |
| `X-API-Key` | header | Condicional | Obrigatório se `API_KEY` estiver configurado no servidor |

\* Pelo menos `text` ou `file` deve ser enviado.

**Resposta (200 OK):**
```json
{
  "protocol": "OUV-20260313-A1B2C3D4",
  "message": "Manifestação recebida com sucesso.",
  "timestamp": "2026-03-13T14:30:00"
}
```

**Exemplo com `curl`:**
```bash
# Manifestação com texto
curl -X POST http://localhost/submit-manifestation \
  -H "X-API-Key: sua_chave_aqui" \
  -F "text=Gostaria de relatar um problema no transporte público" \
  -F "anonymous=false"

# Manifestação com arquivo de imagem
curl -X POST http://localhost/submit-manifestation \
  -H "X-API-Key: sua_chave_aqui" \
  -F "file=@foto_problema.jpg" \
  -F "text=Buraco na calçada da Asa Norte" \
  -F "anonymous=true"

# Manifestação com arquivo de áudio
curl -X POST http://localhost/submit-manifestation \
  -H "X-API-Key: sua_chave_aqui" \
  -F "file=@relato.mp3"
```

**Erros possíveis:**

| Código | Descrição |
|--------|-----------|
| 400 | Texto e arquivo ausentes / Tipo de arquivo não permitido / Texto excede 10.000 chars / Arquivo excede 50MB |
| 401 | API key inválida ou ausente |
| 429 | Rate limit excedido (max 10 requisições/minuto) |

---

### GET `/manifestation/{protocol}`

Consulta o status de uma manifestação por protocolo.

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `protocol` | path | Protocolo no formato `OUV-YYYYMMDD-XXXXXXXX` |

**Resposta (200 OK):**
```json
{
  "protocol": "OUV-20260313-A1B2C3D4",
  "source_type": "text_only",
  "status": "processed",
  "created_at": "2026-03-13T14:30:00"
}
```

| Campo | Valores Possíveis |
|-------|-------------------|
| `source_type` | `text_only`, `image_ocr`, `audio_transcription`, `video_transcription` |
| `status` | `processing` (em processamento), `processed` (concluído) |

**Exemplo com `curl`:**
```bash
curl http://localhost/manifestation/OUV-20260313-A1B2C3D4
```

**Erros possíveis:**

| Código | Descrição |
|--------|-----------|
| 400 | Formato de protocolo inválido |
| 404 | Protocolo não encontrado |
| 429 | Rate limit excedido (max 30 requisições/minuto) |

---

## 7. Segurança / Security

O projeto possui 18 correções de segurança aplicadas, documentadas em `SECURITY_REPORT.md`.

### Resumo das Proteções / Security Summary

| Proteção | Descrição |
|----------|-----------|
| Credenciais externas | Variáveis de ambiente via `.env` (não hardcoded) |
| Path Traversal | Sanitização de filename + validação de path resolvido |
| CORS restrito | Apenas origens permitidas em `ALLOWED_ORIGINS` |
| Autenticação API | Header `X-API-Key` obrigatório (quando configurado) |
| Rate Limiting | Nginx + backend: 10 req/min (submit), 30 req/min (query) |
| Security Headers | X-Frame-Options, CSP, HSTS, X-Content-Type-Options, etc. |
| Protocolo seguro | `secrets.choice` com 8 caracteres (espaço ~2.8T combinações) |
| Dados mínimos | GET retorna apenas `protocol`, `source_type`, `status`, `created_at` |
| Validação de input | Texto max 10K chars, arquivo max 50MB, extensões permitidas |
| Cleanup seguro | Arquivos temporários removidos em bloco `finally` |

### Configurar API Key

1. Defina uma chave segura no `.env`:
   ```env
   API_KEY=minha_chave_secreta_123
   ```
2. Inclua o header em todas as requisições POST:
   ```bash
   curl -H "X-API-Key: minha_chave_secreta_123" ...
   ```
3. Se `API_KEY` estiver vazio, a autenticação fica desabilitada (modo desenvolvimento).

---

## 8. Desenvolvimento Local / Local Development

### 8.1 Frontend (Angular)

```bash
cd frontend
npm install
ng serve
```

O frontend roda em `http://localhost:4200`. Configure o proxy para o backend:

**`frontend/proxy.conf.json`:**
```json
{
  "/submit-manifestation": {
    "target": "http://localhost:8000",
    "secure": false
  },
  "/manifestation": {
    "target": "http://localhost:8000",
    "secure": false
  }
}
```

```bash
ng serve --proxy-config proxy.conf.json
```

### 8.2 Backend Python (sem Docker)

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Linux/Mac
# venv\Scripts\activate    # Windows

pip install -r requirements.txt

# Instalar FFmpeg e Tesseract no sistema
# Ubuntu: sudo apt install ffmpeg tesseract-ocr
# Mac: brew install ffmpeg tesseract

# Configurar variáveis
export DATABASE_URL="postgresql://user:password@localhost:5432/participadf"
export ALLOWED_ORIGINS="http://localhost:4200"
export API_KEY=""

python main.py
```

Backend roda em `http://localhost:8000`.

### 8.3 Backend Java (sem Docker)

```bash
cd backend-java

# Configurar variáveis
export DATABASE_URL="jdbc:postgresql://localhost:5432/participadf"
export SPRING_DATASOURCE_USERNAME="user"
export SPRING_DATASOURCE_PASSWORD="password"

mvn spring-boot:run
```

Backend roda em `http://localhost:8080`.

### 8.4 Banco de Dados Local

Se não quiser usar Docker para o banco, instale PostgreSQL localmente:

```bash
createdb participadf
```

---

## 9. Acessibilidade / Accessibility

O Participa DF segue as diretrizes **WCAG 2.1 AA**:

| Recurso | Implementação |
|---------|---------------|
| Alto Contraste | Toggle de modo alto contraste na interface |
| ARIA Labels | Todos os campos e botões possuem `aria-label` descritivos |
| LiveAnnouncer | Anuncia mudanças de status para leitores de tela |
| Navegação por teclado | Todos os elementos interativos acessíveis via Tab |
| Focus Management | Foco automático no resultado após busca de protocolo (`tabindex="-1"`, `focus()`) |
| Indicadores visuais | Chips coloridos para status (verde = processado, azul = processando) |
| Textos em português | Interface totalmente em PT-BR para cidadãos brasileiros |

---

## 10. PWA

### Instalação no Dispositivo / Install on Device

1. Acesse **http://localhost** no navegador (Chrome, Edge, Safari)
2. Clique no ícone de instalação na barra de endereço (ou menu → "Instalar aplicativo")
3. O app será instalado como um aplicativo standalone

### Modo Offline / Offline Mode

- O Service Worker cacheia os assets estáticos (HTML, CSS, JS)
- O formulário pode ser preenchido offline
- Ao retornar à conectividade, os dados são enviados automaticamente

### Atualizações / Updates

- O Service Worker verifica novas versões automaticamente
- O Nginx está configurado com `expires -1` para arquivos `.html` e `.json`, garantindo que o navegador sempre verifique atualizações
- Assets CSS/JS possuem cache de 1 ano com hash de conteúdo para cache busting

---

## Links Úteis / Useful Links

- [SECURITY_REPORT.md](./SECURITY_REPORT.md) — Relatório completo de segurança
- [DEMO.md](./DEMO.md) — Script de demonstração passo-a-passo
- [.env.example](./.env.example) — Template de variáveis de ambiente
