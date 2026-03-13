# Demo - Participa DF (Ouvidoria Digital PWA)

> **Demo Script** — Roteiro passo-a-passo para demonstrar o sistema Participa DF.
> Tempo total estimado: ~20 minutos.

---

## Parte 1: Setup (2 min)

### 1.1 Subir o Ambiente / Start the Environment

```bash
# Clonar e configurar
git clone <repository-url>
cd participa-df
cp .env.example .env

# Subir com backend Python
docker compose up --build -d

# OU com backend Java
docker compose -f docker-compose-java.yml up --build -d
```

### 1.2 Verificar Containers / Verify Containers

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Saída esperada / Expected output:
```
NAMES                    STATUS            PORTS
participadf-frontend     Up                0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
participadf-backend      Up                0.0.0.0:8000->8000/tcp
participadf-db           Up (healthy)      0.0.0.0:5432->5432/tcp
```

> Aguarde o banco ficar `healthy` antes de prosseguir (~10s).
> Wait for DB to become `healthy` before proceeding (~10s).

---

## Parte 2: Demo do Fluxo Principal (5 min)

### Passo 1: Abrir a Interface / Open the Interface

Acesse **http://localhost** no navegador.

```
┌──────────────────────────────────────────┐
│  PARTICIPA DF - Ouvidoria Digital        │
│                                          │
│  [Nova Manifestação]  [Consultar]        │
└──────────────────────────────────────────┘
```

> Destaque a interface responsiva e os componentes Angular Material.
> Highlight the responsive interface and Angular Material components.

### Passo 2: Submeter Manifestação com Texto / Submit Text Manifestation

1. Clique em **"Nova Manifestação"**
2. Digite no campo de texto:
   ```
   Gostaria de relatar que o semáforo da W3 Sul com Eixo está
   com defeito há mais de uma semana, causando congestionamentos
   diários no horário de pico.
   ```
3. Deixe "Enviar como anônimo" desmarcado
4. Clique em **ENVIAR MANIFESTAÇÃO**

### Passo 3: Copiar Protocolo / Copy Protocol

Após o envio, o sistema retorna:

```
✅ Manifestação recebida com sucesso.
Protocolo: OUV-20260313-A1B2C3D4
```

> Copie o número do protocolo. Destaque o formato seguro com 8 caracteres aleatórios.
> Copy the protocol number. Highlight the secure format with 8 random characters.

### Passo 4: Consultar Protocolo / Check Protocol Status

1. Navegue para **"Consultar Manifestação"**
2. Cole o protocolo no campo de busca
3. Clique em **BUSCAR**

### Passo 5: Verificar Status / Verify Status

O resultado mostra:

```
Detalhes da Manifestação
────────────────────────
Protocolo:    OUV-20260313-A1B2C3D4
Tipo de Fonte: text_only
Status:       EM PROCESSAMENTO → PROCESSADO
Data:         13/03/2026 14:30
```

> O processamento em background converte o status de `processing` para `processed` após integração com o sistema IZA.
> Background processing changes status from `processing` to `processed` after IZA system integration.

---

## Parte 3: Demo com Arquivo de Mídia (3 min)

### 3.1 Submeter Imagem (OCR)

```bash
# Via curl — enviar imagem para extração de texto via OCR
curl -X POST http://localhost/submit-manifestation \
  -F "file=@documento.jpg" \
  -F "text=Documento comprovando irregularidade" \
  -F "anonymous=true"
```

> O Tesseract OCR extrai texto da imagem automaticamente.
> Tesseract OCR automatically extracts text from the image.

### 3.2 Submeter Áudio (Whisper)

```bash
# Via curl — enviar áudio para transcrição via Whisper
curl -X POST http://localhost/submit-manifestation \
  -F "file=@relato_audio.mp3" \
  -F "anonymous=false"
```

> O modelo Whisper transcreve o áudio em texto para processamento.
> The Whisper model transcribes audio to text for processing.

### 3.3 Verificar Processamento

```bash
# Consultar o protocolo retornado
curl http://localhost/manifestation/OUV-20260313-XXXXXXXX
```

Resposta esperada:
```json
{
  "protocol": "OUV-20260313-XXXXXXXX",
  "source_type": "image_ocr",
  "status": "processed",
  "created_at": "2026-03-13T14:35:00"
}
```

> O `source_type` indica como o conteúdo foi processado: `image_ocr`, `audio_transcription` ou `video_transcription`.

---

## Parte 4: Demo de Segurança (5 min)

### 4.1 Testar CORS / Test CORS

```bash
# Requisição de origem maliciosa — deve ser bloqueada
curl -X POST http://localhost/submit-manifestation \
  -H "Origin: https://evil.com" \
  -F "text=Teste CORS" \
  -v 2>&1 | grep -i "access-control"
```

> Nenhum header `Access-Control-Allow-Origin` é retornado para origens não-permitidas.
> No `Access-Control-Allow-Origin` header is returned for disallowed origins.

### 4.2 Verificar Security Headers

```bash
curl -I http://localhost
```

Saída esperada / Expected output:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; ...
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

> Todos os headers de segurança recomendados estão presentes.
> All recommended security headers are present.

### 4.3 Testar Rate Limiting

```bash
# Enviar 15 requisições rápidas — as últimas devem receber 429
for i in $(seq 1 15); do
  echo "Request $i: $(curl -s -o /dev/null -w '%{http_code}' \
    -X POST http://localhost/submit-manifestation \
    -F "text=Rate limit test $i")"
done
```

Saída esperada:
```
Request 1: 200
Request 2: 200
...
Request 11: 429    ← Rate limited!
Request 12: 429
...
```

> O rate limit é de 10 requisições/minuto para submissão.
> Rate limit is 10 requests/minute for submissions.

### 4.4 Testar Path Traversal

```bash
# Tentativa de path traversal no filename — deve ser rejeitada/sanitizada
curl -X POST http://localhost/submit-manifestation \
  -F "file=@test.jpg;filename=../../etc/passwd" \
  -F "text=Path traversal test"
```

> O filename é sanitizado: caracteres especiais são substituídos por `_`, e o path resolvido é validado contra o diretório de uploads.
> Filename is sanitized: special characters replaced with `_`, and resolved path is validated against the upload directory.

### 4.5 Testar Validação de Input

```bash
# Texto excedendo 10.000 caracteres — deve retornar 400
python3 -c "print('A' * 10001)" | \
  curl -X POST http://localhost/submit-manifestation \
  -F "text=$(python3 -c "print('A' * 10001)")"
```

Resposta esperada:
```json
{"detail": "Text exceeds maximum length of 10000 characters."}
```

### 4.6 Verificar Dados Mínimos no GET

```bash
# O GET retorna apenas dados não-sensíveis
curl http://localhost/manifestation/OUV-20260313-A1B2C3D4 | python3 -m json.tool
```

```json
{
    "protocol": "OUV-20260313-A1B2C3D4",
    "source_type": "text_only",
    "status": "processed",
    "created_at": "2026-03-13T14:30:00"
}
```

> Campos sensíveis removidos: `id`, `iza_tracking_id`, `original_text`, `ai_content`, `final_content`, `confidence_score`, `anonymous`.
> Sensitive fields removed from public response.

---

## Parte 5: Demo de Acessibilidade (2 min)

### 5.1 Alto Contraste / High Contrast

1. Localize o botão de alto contraste na interface
2. Ative o modo — as cores mudam para maior legibilidade
3. Desative para retornar ao modo normal

### 5.2 Navegação por Teclado / Keyboard Navigation

1. Pressione **Tab** para navegar entre os elementos
2. Observe o indicador de foco (borda azul) em cada campo
3. Pressione **Enter** para ativar botões
4. No campo de protocolo, pressione **Enter** para buscar

> Todos os elementos interativos são acessíveis via teclado com `aria-label` descritivos.
> All interactive elements are keyboard-accessible with descriptive `aria-label` attributes.

### 5.3 Indicador Offline / Offline Indicator

1. Abra DevTools (F12) → Network → marque "Offline"
2. O PWA exibe indicador de modo offline
3. Desmarque "Offline" — a aplicação reconecta automaticamente

---

## Parte 6: Demo via API (3 min)

### 6.1 Submeter Manifestação via API

```bash
# Submeter manifestação com texto (com API key)
curl -X POST http://localhost/submit-manifestation \
  -H "X-API-Key: $(grep API_KEY .env | cut -d= -f2)" \
  -F "text=Reclamação sobre iluminação pública na quadra 308 Norte" \
  -F "anonymous=false" \
  | python3 -m json.tool
```

Resposta:
```json
{
    "protocol": "OUV-20260313-X9Y8Z7W6",
    "message": "Manifestação recebida com sucesso.",
    "timestamp": "2026-03-13T15:00:00"
}
```

### 6.2 Consultar Status via API

```bash
# Aguardar 2 segundos para processamento background
sleep 2

# Consultar o protocolo
curl http://localhost/manifestation/OUV-20260313-X9Y8Z7W6 \
  | python3 -m json.tool
```

Resposta:
```json
{
    "protocol": "OUV-20260313-X9Y8Z7W6",
    "source_type": "text_only",
    "status": "processed",
    "created_at": "2026-03-13T15:00:00"
}
```

### 6.3 Demonstrar Rate Limit via API

```bash
# Enviar múltiplas consultas para atingir rate limit do GET (30/min)
for i in $(seq 1 35); do
  CODE=$(curl -s -o /dev/null -w '%{http_code}' \
    http://localhost/manifestation/OUV-20260313-X9Y8Z7W6)
  [ "$CODE" = "429" ] && echo "Request $i: $CODE (RATE LIMITED)" && break
  echo "Request $i: $CODE"
done
```

---

## Encerramento / Cleanup

```bash
# Parar e remover os containers
docker compose down

# Parar e remover, incluindo volumes do banco
docker compose down -v
```

---

## Resumo da Demo / Demo Summary

| Parte | Tempo | O que foi demonstrado |
|-------|-------|-----------------------|
| 1. Setup | 2 min | Docker Compose, 3 containers, health checks |
| 2. Fluxo Principal | 5 min | Submissão de texto, protocolo, consulta de status |
| 3. Mídia | 3 min | Upload de imagem (OCR) e áudio (Whisper) |
| 4. Segurança | 5 min | CORS, headers, rate limiting, path traversal, validação |
| 5. Acessibilidade | 2 min | Alto contraste, teclado, offline |
| 6. API | 3 min | curl submit, consulta, rate limit |
| **Total** | **~20 min** | |

---

## Links

- [TUTORIAL.md](./TUTORIAL.md) — Tutorial completo do projeto
- [SECURITY_REPORT.md](./SECURITY_REPORT.md) — Relatório de segurança detalhado
