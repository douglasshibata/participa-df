# Participa DF - Ouvidoria Digital PWA

Este projeto é uma Progressive Web App (PWA) para a Ouvidoria do Distrito Federal, permitindo manifestações via texto, áudio, vídeo e imagem.

## Estrutura do Projeto

- `frontend/`: Aplicação Angular 17+ (Standalone Components, Signals, Material, Tailwind).
- `backend/`: API FastAPI em Python para processamento de mídia e integração IZA.

## Tecnologias

- **Frontend**: Angular 17, Tailwind CSS, Angular Material.
- **Backend**: FastAPI, OpenAI Whisper (transcrição), Pytesseract (OCR).
- **Database**: PostgreSQL (SQLAlchemy).
- **IA**: Integração simulada com o sistema IZA.

## Requisitos do Sistema

Para o funcionamento correto dos modelos de IA no backend, os seguintes pacotes devem estar instalados no sistema operacional:
- **FFmpeg**: Necessário para o processamento de áudio e vídeo pelo Whisper.
- **Tesseract OCR**: Necessário para a extração de texto de imagens.

No Debian/Ubuntu:
```bash
sudo apt-get update && sudo apt-get install -y ffmpeg tesseract-ocr
```

## Acessibilidade

O projeto segue as diretrizes **WCAG 2.1 AA**, utilizando:
- `@angular/cdk/a11y` para `LiveAnnouncer` e gerenciamento de foco.
- Rótulos ARIA em todos os elementos não textuais.
- Suporte a alto contraste via CSS/Material.

## Como Executar

### Backend
1. `cd backend`
2. `python -m venv venv`
3. `source venv/bin/activate`
4. `pip install -r requirements.txt`
5. `python main.py`

### Frontend
1. `cd frontend`
2. `npm install`
3. `ng serve`

### Docker (Recomendado)
Para subir todo o ecossistema (Frontend, Backend e Banco de Dados) de uma vez:
1. Instale o Docker e o Docker Compose.
2. Na raiz do projeto (`participa-df/`):
```bash
docker-compose up --build
```
O frontend estará disponível em `http://localhost`, o backend em `http://localhost:8000` e o banco de dados em `http://localhost:5432`.

## Funcionalidades Principais

- **Formulário Inteligente**: Entrada unificada para texto e upload de arquivos.
- **Anonimato**: Alternância simples entre identificado e anônimo.
- **Geração de Protocolo**: O protocolo (OUV-YYYYMMDD-XXXX) é gerado instantaneamente.
- **Processamento em Background**: Whisper e OCR rodam em tarefas de segundo plano para evitar timeouts.
