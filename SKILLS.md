# SKILLS.md - Participa DF

Diretrizes para evolução da ouvidoria digital acessível.

## 🛡️ Auditoria de Segurança

1. **Anonimato Real:** Verifique se metadados de arquivos (EXIF de fotos, metadados de áudio) são removidos em manifestações anônimas.
2. **Upload Safety:** Garanta que arquivos enviados passem por verificação de tipo e tamanho para evitar ataques de DoS ou execução remota.
3. **PII Handling:** Audite como os dados identificados são armazenados no PostgreSQL, garantindo conformidade com a LGPD.

## 📈 Melhorias Sugeridas

1. **Acessibilidade:**
   - Adicionar suporte nativo a VLibras no frontend Angular.
   - Melhorar a navegação via teclado no formulário inteligente.
2. **Inteligência:**
   - Implementar triagem automática de manifestações baseada em categoria (Saúde, Educação, etc.) usando NLP.
   - Adicionar resumo automático de vídeos longos de denúncia.
3. **UX/UI:**
   - Implementar modo Offline no PWA para salvar manifestações e enviar quando houver conexão.

## 🤖 Papel do Claude

- **Frontend Expert:** Ajude a refatorar componentes para utilizar Signals do Angular 17.
- **A11y Auditor:** Realize revisões de código focadas em conformidade com WCAG 2.1.
- **Python Developer:** Otimize as `BackgroundTasks` do FastAPI para processamento pesado de Whisper/OCR.
