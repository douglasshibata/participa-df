# 📘 Tutorial de Operação e Instalação: Participa DF - Ouvidoria Digital PWA

Guia passo a passo para configuração, inicialização, execução de testes e resolução de problemas no projeto **Participa DF - Ouvidoria Digital PWA** (`participa-df`).

---

## 🛠️ 1. Visão Geral e Arquitetura

Este projeto é uma Progressive Web App (PWA) para a Ouvidoria do Distrito Federal, permitindo manifestações via texto, áudio, vídeo e imagem. - `frontend/`: Aplicação Angular 17+ (Standalone Components, Signals, Material, Tailwind). - `backend/`: API FastAPI em Python para processamento de mídia e integração IZA.

- **Tecnologias Principais:** Java / Spring Boot / Quarkus
- **Diretório do Módulo:** `participa-df`

---

## 📋 2. Pré-requisitos do Sistema

Antes de iniciar a configuração local, certifique-se de ter os seguintes componentes instalados em seu ambiente de desenvolvimento:

- **Git:** Para clonagem e versionamento.
- **Ambiente de Runtime:** Ferramentas correspondentes à stack do projeto (Java / Spring Boot / Quarkus):
  - Node.js 18+ / Python 3.11+ / Go 1.24+ / Java 21 LTS / Flutter SDK / CMake.
- **Docker Engine & Docker Compose:** Recomendado para execução de containers e dependências.

---

## 🚀 3. Passo a Passo de Setup e Instalação

### Passo 1: Acessar a Pasta do Projeto
```bash
cd participa-df
```

### Passo 2: Instalação de Dependências
```bash
mvn clean install -DskipTests
```

### Subindo Infraestrutura via Docker Compose
Se o ambiente dispõe de containerização local, execute os containers integrados:

```bash
# Iniciar serviços auxiliares em background
docker compose up -d --build

# Monitorar logs de execução
docker compose logs -f
```

---

## ⚙️ 4. Configuração do Ambiente

Configure o arquivo de variáveis de ambiente (`.env` ou configurações de projeto) localizado no diretório raiz de `participa-df`:

```ini
# Configurações Gerais
ENVIRONMENT=development
LOG_LEVEL=info

# URLs de Conexão e Serviços
DATABASE_URL=sqlite:///./app.db
REDIS_URL=redis://localhost:6379/0
```

---

## 💻 5. Guia de Execução

### Inicializando a Aplicação
Inicie a aplicação ou serviço utilizando o comando correspondente:

```bash
mvn spring-boot:run # ou ./mvnw quarkus:dev / mvn exec:java
```

---

## 🧪 6. Testes e Validação

Para validar o funcionamento do módulo e garantir que não há regressões, execute a suíte de testes:

```bash
mvn test
```

---

## 🔍 7. Troubleshooting e Resolução de Problemas

1. **Porta em uso ou Conflito de Rede:**
   - Cancele processos pendentes na porta utilizada ou utilize `docker compose down` e suba novamente.
2. **Erros de Dependências Ausentes:**
   - Certifique-se de estar executando os comandos dentro do diretório `participa-df` e com as versões corretas das linguagens.
3. **Falhas na Suíte de Testes:**
   - Verifique se as variáveis de ambiente necessárias foram inicializadas corretamente.
