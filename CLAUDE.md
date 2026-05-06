# Participa DF - CLAUDE.md

Guia de comandos e diretrizes para o Participa DF.

## Comandos de Build e Execução

### Docker Compose (Recomendado)
```bash
docker-compose up --build
```

### Backend (Python/FastAPI)
```bash
cd participa-df/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

### Frontend (Angular 17)
```bash
cd participa-df/frontend
npm install
ng serve
```

## Diretrizes de Desenvolvimento

- **Frontend:** Utiliza Standalone Components, Signals e Angular Material.
- **Acessibilidade:** Segue WCAG 2.1 AA. Use rótulos ARIA e `LiveAnnouncer`.
- **Backend:** Processamento de áudio (Whisper) e imagens (OCR) via FastAPI.
- **Multimodal:** Suporta texto, áudio, vídeo e imagem.
- **Segurança:** Suporte nativo para manifestações anônimas.
