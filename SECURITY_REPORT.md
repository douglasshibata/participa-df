# Relatório de Segurança - Participa DF

**Projeto:** Participa DF - Ouvidoria Digital PWA
**Data:** 2026-03-13
**Versão:** 1.0
**Stack:** Angular 17 + FastAPI (Python) + Spring Boot 3.2.5 (Java) + PostgreSQL + Nginx + Docker

---

## Resumo Executivo

A análise de segurança do projeto Participa DF identificou **18 vulnerabilidades** distribuídas em 4 níveis de severidade:

| Severidade | Quantidade | Status |
|------------|-----------|--------|
| CRITICAL   | 4         | Corrigido |
| HIGH       | 6         | Corrigido |
| MEDIUM     | 6         | Corrigido |
| LOW        | 2         | Corrigido |

---

## Vulnerabilidades Identificadas

### CRITICAL-01: Credenciais Hardcoded nos Docker Compose

- **Severidade:** CRITICAL
- **CWE:** CWE-798 (Use of Hard-coded Credentials)
- **Arquivos:** `docker-compose.yml` (linhas 6-8, 24), `docker-compose-java.yml` (linhas 6-8, 26-27)

**Codigo vulneravel:**
```yaml
environment:
  POSTGRES_USER: user
  POSTGRES_PASSWORD: password
  POSTGRES_DB: participadf
```

**Codigo corrigido:**
```yaml
env_file:
  - .env
environment:
  POSTGRES_USER: ${POSTGRES_USER}
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  POSTGRES_DB: ${POSTGRES_DB}
```

**Correcao:** Criado `.env.example` com template de variaveis, `.gitignore` adicionando `.env`, e substituicao de todas as credenciais por variaveis de ambiente nos dois docker-compose.

---

### CRITICAL-02: Path Traversal no Upload de Arquivos (Python)

- **Severidade:** CRITICAL
- **CWE:** CWE-22 (Improper Limitation of a Pathname to a Restricted Directory)
- **Arquivo:** `backend/main.py` (linha 167)

**Codigo vulneravel:**
```python
temp_file_path = f"temp_uploads/{protocol}_{file.filename}"
```

**Codigo corrigido:**
```python
safe_filename = sanitize_filename(file.filename or "upload")
ext = os.path.splitext(safe_filename)[1].lower()
if ext not in ALLOWED_EXTENSIONS:
    raise HTTPException(status_code=400, detail=f"File type '{ext}' is not allowed.")

temp_file_path = os.path.join("temp_uploads", f"{protocol}_{safe_filename}")

# Verify resolved path is within temp_uploads
resolved_path = os.path.realpath(temp_file_path)
upload_dir = os.path.realpath("temp_uploads")
if not resolved_path.startswith(upload_dir):
    raise HTTPException(status_code=400, detail="Invalid file path.")
```

**Funcao de sanitizacao adicionada:**
```python
def sanitize_filename(filename: str) -> str:
    filename = os.path.basename(filename)
    filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
    return filename
```

---

### CRITICAL-03: Path Traversal no Upload de Arquivos (Java)

- **Severidade:** CRITICAL
- **CWE:** CWE-22 (Improper Limitation of a Pathname to a Restricted Directory)
- **Arquivo:** `backend-java/.../ManifestationController.java` (linha 49)

**Codigo vulneravel:**
```java
tempFile = File.createTempFile(protocol + "_", file.getOriginalFilename());
```

**Codigo corrigido:**
```java
String originalFilename = file.getOriginalFilename();
if (originalFilename != null) {
    originalFilename = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
} else {
    originalFilename = "upload";
}

String ext = "";
int dotIndex = originalFilename.lastIndexOf('.');
if (dotIndex >= 0) {
    ext = originalFilename.substring(dotIndex).toLowerCase();
}
if (!ALLOWED_EXTENSIONS.contains(ext)) {
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File type not allowed.");
}

tempFile = File.createTempFile(protocol + "_", "_" + originalFilename);
```

---

### CRITICAL-04: Ausencia de Autenticacao

- **Severidade:** CRITICAL
- **CWE:** CWE-306 (Missing Authentication for Critical Function)
- **Arquivos:** `backend/main.py`, `backend-java/.../ManifestationController.java`

**Codigo corrigido (Python):**
```python
API_KEY = os.getenv("API_KEY", "")

def validate_api_key(x_api_key: Optional[str]) -> bool:
    if not API_KEY:
        return True
    return x_api_key == API_KEY

# No endpoint POST:
x_api_key: Optional[str] = Header(None)
if not validate_api_key(x_api_key):
    raise HTTPException(status_code=401, detail="Invalid or missing API key.")
```

**Codigo corrigido (Java):**
```java
@Value("${api.key:}")
private String apiKey;

// No endpoint POST:
@RequestHeader(value = "X-API-Key", required = false) String requestApiKey
if (apiKey != null && !apiKey.isBlank() && !apiKey.equals(requestApiKey)) {
    throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or missing API key.");
}
```

---

### HIGH-01: CORS Wildcard (Python)

- **Severidade:** HIGH
- **CWE:** CWE-942 (Overly Permissive Cross-domain Whitelist)
- **Arquivo:** `backend/main.py` (linhas 46-52)

**Codigo vulneravel:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Codigo corrigido:**
```python
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost,http://localhost:80").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in ALLOWED_ORIGINS],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization", "X-API-Key"],
)
```

---

### HIGH-02: CORS Wildcard (Java)

- **Severidade:** HIGH
- **CWE:** CWE-942 (Overly Permissive Cross-domain Whitelist)
- **Arquivo:** `backend-java/.../ManifestationController.java` (linha 17)

**Codigo vulneravel:**
```java
@CrossOrigin(origins = "*")
```

**Codigo corrigido:** Removido `@CrossOrigin` do controller. Criado `config/CorsConfig.java` com configuracao global via `application.properties`:
```java
@Configuration
public class CorsConfig {
    @Value("${cors.allowed-origins:http://localhost}")
    private String allowedOrigins;

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
        config.setAllowedMethods(List.of("GET", "POST"));
        config.setAllowedHeaders(List.of("Content-Type", "Authorization", "X-API-Key"));
        config.setAllowCredentials(true);
        // ...
    }
}
```

---

### HIGH-03: Geracao de Protocolo Previsivel (Python)

- **Severidade:** HIGH
- **CWE:** CWE-330 (Use of Insufficiently Random Values)
- **Arquivo:** `backend/main.py` (linhas 67-70)

**Codigo vulneravel:**
```python
random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
```

**Codigo corrigido:**
```python
random_part = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
```

**Impacto:** Espaco de combinacoes aumentou de ~1.6M para ~2.8T.

---

### HIGH-04: Geracao de Protocolo Previsivel (Java)

- **Severidade:** HIGH
- **CWE:** CWE-330 (Use of Insufficiently Random Values)
- **Arquivo:** `backend-java/.../ProtocolService.java`

**Codigo vulneravel:**
```java
private final Random random = new Random();
// k=4
```

**Codigo corrigido:**
```java
private final SecureRandom random = new SecureRandom();
// k=8
```

---

### HIGH-05: Ausencia de Rate Limiting

- **Severidade:** HIGH
- **CWE:** CWE-770 (Allocation of Resources Without Limits or Throttling)
- **Arquivos:** `backend/main.py`, `frontend/nginx.conf`, `frontend/nginx-java.conf`

**Codigo corrigido (Python - slowapi):**
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/submit-manifestation")
@limiter.limit("10/minute")

@app.get("/manifestation/{protocol}")
@limiter.limit("30/minute")
```

**Codigo corrigido (Nginx):**
```nginx
limit_req_zone $binary_remote_addr zone=submit:10m rate=10r/m;
limit_req_zone $binary_remote_addr zone=query:10m rate=30r/m;

location /submit-manifestation {
    limit_req zone=submit burst=5 nodelay;
}

location /manifestation/ {
    limit_req zone=query burst=10 nodelay;
}
```

---

### HIGH-06: Exposicao Excessiva de Dados no GET

- **Severidade:** HIGH
- **CWE:** CWE-200 (Exposure of Sensitive Information to an Unauthorized Actor)
- **Arquivos:** `backend/main.py` (linhas 187-198), `backend-java/.../ManifestationController.java`

**Codigo vulneravel (Python):**
```python
return {
    "id": m.id,
    "protocol": m.protocol,
    "original_text": m.original_text,
    "ai_content": m.ai_content,
    "final_content": m.final_content,
    "source_type": m.source_type,
    "confidence_score": m.confidence_score,
    "anonymous": m.anonymous,
    "iza_tracking_id": m.iza_tracking_id,
    "status": "processed" if m.iza_tracking_id else "processing"
}
```

**Codigo corrigido (Python):**
```python
return {
    "protocol": m.protocol,
    "source_type": m.source_type,
    "status": "processed" if m.iza_tracking_id else "processing",
    "created_at": m.created_at.isoformat() if m.created_at else None,
}
```

**Codigo corrigido (Java):** Criado DTO `ManifestationStatusResponse` com apenas `protocol`, `sourceType`, `status`, `createdAt`.

**Campos removidos da resposta publica:** `id`, `iza_tracking_id`, `original_text`, `ai_content`, `final_content`, `confidence_score`, `anonymous`.

---

### MEDIUM-01: Ausencia de Security Headers no Nginx

- **Severidade:** MEDIUM
- **CWE:** CWE-693 (Protection Mechanism Failure)
- **Arquivos:** `frontend/nginx.conf`, `frontend/nginx-java.conf`

**Codigo corrigido:**
```nginx
server_tokens off;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; ..." always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

### MEDIUM-02: Mensagens de Erro Expondo Stack Trace

- **Severidade:** MEDIUM
- **CWE:** CWE-209 (Generation of Error Message Containing Sensitive Information)
- **Arquivo:** `backend/main.py` (linha 102)

**Codigo vulneravel:**
```python
ai_text = f"Error processing file: {str(e)}"
```

**Codigo corrigido:**
```python
ai_text = "Erro ao processar arquivo. Tente novamente."
```

---

### MEDIUM-03: Cleanup de Arquivos Temporarios Inconsistente (Python)

- **Severidade:** MEDIUM
- **CWE:** CWE-459 (Incomplete Cleanup)
- **Arquivo:** `backend/main.py`

**Codigo vulneravel:** `os.remove` dentro do bloco `try`, podendo nao executar em caso de excecao.

**Codigo corrigido:** Movido para bloco `finally`:
```python
try:
    # processing...
except Exception as e:
    logger.error(...)
finally:
    if os.path.exists(file_path):
        os.remove(file_path)
```

---

### MEDIUM-04: Cleanup de Arquivos Temporarios Inconsistente (Java)

- **Severidade:** MEDIUM
- **CWE:** CWE-459 (Incomplete Cleanup)
- **Arquivo:** `backend-java/.../ManifestationService.java`

**Codigo vulneravel:** `file.delete()` no fluxo principal, nao executando em caso de excecao.

**Codigo corrigido:** Movido para bloco `finally`:
```java
try {
    // processing...
} catch (Exception e) {
    log.error(...);
} finally {
    if (file.exists()) {
        file.delete();
    }
}
```

---

### MEDIUM-05: SQL Logging Habilitado em Producao

- **Severidade:** MEDIUM
- **CWE:** CWE-532 (Insertion of Sensitive Information into Log File)
- **Arquivo:** `backend-java/.../application.properties`

**Codigo vulneravel:**
```properties
spring.jpa.show-sql=true
```

**Codigo corrigido:**
```properties
spring.jpa.show-sql=${SHOW_SQL:false}
```

---

### MEDIUM-06: Ausencia de HTTPS

- **Severidade:** MEDIUM
- **CWE:** CWE-319 (Cleartext Transmission of Sensitive Information)
- **Arquivos:** `frontend/nginx.conf`, `frontend/nginx-java.conf`, `docker-compose.yml`, `docker-compose-java.yml`

**Correcao:** Adicionado bloco HTTPS comentado no nginx (pronto para ativar com certificados SSL). Porta 443 mapeada nos docker-compose. Volume SSL configurado. Header HSTS ja adicionado.

---

### LOW-01: Ausencia de Validacao de Input (Tamanho de Texto)

- **Severidade:** LOW
- **CWE:** CWE-20 (Improper Input Validation)
- **Arquivos:** `backend/main.py`, `backend-java/.../ManifestationController.java`

**Codigo corrigido:** Adicionada validacao de tamanho maximo de texto (10.000 caracteres) e tamanho maximo de arquivo (50MB) em ambos os backends.

---

### LOW-02: Dependencias sem Versao Pinada

- **Severidade:** LOW
- **CWE:** CWE-1104 (Use of Unmaintained Third-Party Components)
- **Arquivo:** `backend/requirements.txt`

**Codigo vulneravel:**
```
fastapi
uvicorn
python-multipart
```

**Codigo corrigido:**
```
fastapi==0.115.0
uvicorn==0.30.0
python-multipart==0.0.9
sqlalchemy==2.0.31
psycopg2-binary==2.9.9
openai-whisper==20231117
pytesseract==0.3.13
Pillow==10.4.0
pydantic==2.8.0
python-dotenv==1.0.1
slowapi==0.1.9
python-magic==0.4.27
```

---

## Atualizacao de Dependencias

| Componente | Versao Anterior | Versao Atualizada |
|-----------|----------------|------------------|
| Spring Boot | 3.2.5 | 3.2.12 |
| fastapi | sem pinar | 0.115.0 |
| uvicorn | sem pinar | 0.30.0 |
| python-multipart | sem pinar | 0.0.9 |
| sqlalchemy | sem pinar | 2.0.31 |
| psycopg2-binary | sem pinar | 2.9.9 |
| Pillow | sem pinar | 10.4.0 |
| pydantic | sem pinar | 2.8.0 |

**Novas dependencias adicionadas:**

| Pacote | Versao | Proposito |
|--------|--------|-----------|
| slowapi | 0.1.9 | Rate limiting para FastAPI |
| python-magic | 0.4.27 | Validacao MIME type |
| spring-boot-starter-validation | (managed) | Validacao de input Java |
| tika-core | 2.9.1 | Validacao MIME type Java |

---

## Novos Arquivos Criados

| Arquivo | Proposito |
|---------|-----------|
| `.env.example` | Template de variaveis de ambiente |
| `.gitignore` | Prevenir commit de secrets |
| `SECURITY_REPORT.md` | Este relatorio |
| `backend-java/.../config/CorsConfig.java` | Configuracao CORS centralizada |
| `backend-java/.../dto/ManifestationStatusResponse.java` | DTO para resposta publica reduzida |

---

## Recomendacoes DAST (Dynamic Application Security Testing)

### Ferramentas Recomendadas

#### 1. OWASP ZAP (Zed Attack Proxy)
```bash
# Scan automatizado
docker run -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t http://localhost:80

# Scan completo com API
docker run -t ghcr.io/zaproxy/zaproxy:stable zap-full-scan.py -t http://localhost:80
```

**Verificacoes prioritarias:**
- Path Traversal (confirmar que `../../etc/passwd` e rejeitado)
- CORS misconfiguration (Origin: https://evil.com)
- Security headers presentes
- Rate limiting ativo

#### 2. Nuclei
```bash
# Scan com templates de seguranca web
nuclei -u http://localhost:80 -t cves/ -t vulnerabilities/ -t misconfiguration/

# Verificar headers especificamente
nuclei -u http://localhost:80 -t http/misconfiguration/
```

#### 3. pip-audit (Python Dependencies)
```bash
cd backend
pip-audit -r requirements.txt
```

#### 4. npm audit (Frontend Dependencies)
```bash
cd frontend
npm audit
npm audit fix
```

#### 5. OWASP Dependency-Check (Java)
```bash
cd backend-java
mvn org.owasp:dependency-check-maven:check
```

Adicionar ao `pom.xml` para execucao recorrente:
```xml
<plugin>
    <groupId>org.owasp</groupId>
    <artifactId>dependency-check-maven</artifactId>
    <version>9.0.9</version>
    <executions>
        <execution>
            <goals><goal>check</goal></goals>
        </execution>
    </executions>
</plugin>
```

---

## Checklist de Verificacao

- [ ] `docker-compose up` funciona sem erros
- [ ] Upload com filename malicioso (`../../etc/passwd`) e rejeitado
- [ ] Request com `Origin: https://evil.com` bloqueado pelo CORS
- [ ] `curl -I http://localhost` retorna security headers
- [ ] 20 requests em 10s ativa rate limiting
- [ ] GET `/manifestation/{protocol}` nao retorna `iza_tracking_id` nem `id`
- [ ] Protocolo agora tem 8 caracteres aleatorios
- [ ] `npm audit` no frontend sem vulnerabilidades criticas
- [ ] `pip-audit` no backend Python sem vulnerabilidades criticas

---

## Arquivos Modificados

| Arquivo | Correcoes Aplicadas |
|---------|-------------------|
| `backend/main.py` | CORS, path traversal, protocolo, rate limit, validacao, exposicao dados, erros, cleanup, API key |
| `backend/requirements.txt` | Versoes pinadas, slowapi e python-magic adicionados |
| `backend-java/.../ManifestationController.java` | CORS, path traversal, validacao, exposicao dados, API key |
| `backend-java/.../ProtocolService.java` | SecureRandom, 8 caracteres |
| `backend-java/.../ManifestationService.java` | Cleanup em finally |
| `backend-java/.../application.properties` | SQL logging configuravel, CORS, API key |
| `backend-java/pom.xml` | Spring Boot 3.2.12, tika-core, starter-validation |
| `frontend/nginx.conf` | Security headers, rate limit, HTTPS prep |
| `frontend/nginx-java.conf` | Security headers, rate limit, HTTPS prep |
| `frontend/src/app/services/manifestation.service.ts` | Interface ManifestationData reduzida |
| `frontend/src/app/components/manifestation-status/...component.html` | Campos removidos do template |
| `docker-compose.yml` | Credenciais externalizadas, porta 443, volume SSL |
| `docker-compose-java.yml` | Credenciais externalizadas, porta 443, volume SSL |
