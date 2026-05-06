# AGENTS.md

Este arquivo fornece instruções e contexto para agentes de IA que trabalham no projeto **Participa DF**.

## Visão Geral do Projeto
Progressive Web App (PWA) para a Ouvidoria do DF, permitindo manifestações multimodais (texto, áudio, vídeo, imagem) com foco em acessibilidade e anonimato.

## Tecnologias Utilizadas
- **Frontend:** Angular 17, Tailwind CSS, Angular Material.
- **Backend (Python):** FastAPI, OpenAI Whisper (transcrição), Tesseract (OCR).
- **Acessibilidade:** WCAG 2.1 AA, `@angular/cdk/a11y`.
- **Infraestrutura:** Docker, FFmpeg.

## Estrutura de Pastas
- `frontend/`: Aplicação PWA altamente acessível.
- `backend/`: API para processamento de mídia e IA.
- `backend-java/`: Versão alternativa em Spring Boot.

## Comandos Principais
- Build/Instalação: `docker-compose up --build`
- Frontend: `ng serve`
- Backend: `python main.py`

## Diretrizes de Desenvolvimento
- **Acessibilidade:** Siga rigorosamente WCAG 2.1 AA. Use rótulos ARIA e gerencie o foco adequadamente.
- **Anonimato:** Remova metadados de arquivos (EXIF, etc.) em manifestações anônimas.
- **Multimodal:** O processamento pesado (Whisper/OCR) deve rodar em `BackgroundTasks`.
- **Privacidade:** Garanta conformidade com a LGPD no armazenamento de dados identificados.
