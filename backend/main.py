import os
import re
import uuid
import datetime
import secrets
import string
import logging
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import whisper
import pytesseract
from PIL import Image
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, Text, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
API_KEY = os.getenv("API_KEY", "")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost,http://localhost:80").split(",")
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.mp3', '.wav', '.m4a', '.mp4', '.mov', '.avi', '.mkv'}
MAX_TEXT_LENGTH = 10_000
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

# Database Setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./participadf.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class ManifestationModel(Base):
    __tablename__ = "manifestations"
    id = Column(Integer, primary_key=True, index=True)
    protocol = Column(String, unique=True, index=True)
    source_type = Column(String)
    original_text = Column(Text)
    ai_content = Column(Text)
    final_content = Column(Text)
    confidence_score = Column(Float)
    anonymous = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    iza_tracking_id = Column(String, nullable=True)

Base.metadata.create_all(bind=engine)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Participa DF - Ouvidoria Digital API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration - restricted origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in ALLOWED_ORIGINS],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization", "X-API-Key"],
)

# AI Models Loader
try:
    model = whisper.load_model("base")
    logger.info("Whisper model loaded successfully.")
except Exception as e:
    logger.warning(f"Whisper model could not be loaded: {e}. AI transcription will be mocked.")
    model = None

class ManifestationResponse(BaseModel):
    protocol: str
    message: str
    timestamp: datetime.datetime

def generate_protocol() -> str:
    date_part = datetime.datetime.now().strftime("%Y%m%d")
    random_part = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
    return f"OUV-{date_part}-{random_part}"

def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal attacks."""
    filename = os.path.basename(filename)
    filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
    return filename

def validate_api_key(x_api_key: Optional[str]) -> bool:
    """Validate API key if configured."""
    if not API_KEY:
        return True
    return x_api_key == API_KEY

def send_to_iza_system(payload: dict):
    logger.info(f"[IZA INTEGRATION] Sending payload for protocol {payload.get('protocol')}")
    return {"status": "success", "iza_tracking_id": str(uuid.uuid4())}

async def process_media_task(protocol: str, file_path: Optional[str], original_text: Optional[str], anonymous: bool):
    ai_text = ""
    source_type = "text_only"
    confidence = 1.0

    if file_path and os.path.exists(file_path):
        ext = os.path.splitext(file_path)[1].lower()
        try:
            if ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']:
                source_type = "image_ocr"
                ai_text = pytesseract.image_to_string(Image.open(file_path))
                confidence = 0.88
            elif ext in ['.mp3', '.wav', '.m4a', '.mp4', '.mov', '.avi', '.mkv']:
                source_type = "video_transcription" if ext in ['.mp4', '.mov', '.avi', '.mkv'] else "audio_transcription"
                if model:
                    result = model.transcribe(file_path)
                    ai_text = result.get('text', '')
                    confidence = 0.95
                else:
                    ai_text = "[AI Model Offline] Transcription placeholder"
                    confidence = 0.0
        except Exception as e:
            logger.error(f"Error during media processing for {protocol}: {e}")
            ai_text = "Erro ao processar arquivo. Tente novamente."
            confidence = 0.0
        finally:
            if os.path.exists(file_path):
                os.remove(file_path)

    # Logic Fix: Concatenate instead of overwrite
    final_content = (original_text or "").strip()
    if ai_text:
        if final_content:
            final_content += "\n\n--- Conteúdo Extraído via IA ---\n" + ai_text.strip()
        else:
            final_content = ai_text.strip()

    # Update Database
    db = SessionLocal()
    try:
        manifestation = db.query(ManifestationModel).filter(ManifestationModel.protocol == protocol).first()
        if manifestation:
            manifestation.ai_content = ai_text
            manifestation.final_content = final_content
            manifestation.source_type = source_type
            manifestation.confidence_score = confidence

            # Send to IZA
            iza_res = send_to_iza_system({
                "manifestation_id": manifestation.id,
                "protocol": protocol,
                "source_type": source_type,
                "content": final_content,
                "confidence_score": confidence,
                "user_metadata": {"anonymous": anonymous}
            })
            manifestation.iza_tracking_id = iza_res.get("iza_tracking_id")
            db.commit()
    finally:
        db.close()

@app.post("/submit-manifestation", response_model=ManifestationResponse)
@limiter.limit("10/minute")
async def submit_manifestation(
    request: Request,
    background_tasks: BackgroundTasks,
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    anonymous: bool = Form(False),
    x_api_key: Optional[str] = Header(None),
):
    # API key validation
    if not validate_api_key(x_api_key):
        raise HTTPException(status_code=401, detail="Invalid or missing API key.")

    if not text and not file:
        raise HTTPException(status_code=400, detail="Either text or a media file must be provided.")

    # Validate text length
    if text and len(text) > MAX_TEXT_LENGTH:
        raise HTTPException(status_code=400, detail=f"Text exceeds maximum length of {MAX_TEXT_LENGTH} characters.")

    protocol = generate_protocol()

    # Save initial record to DB
    db = SessionLocal()
    try:
        new_manifestation = ManifestationModel(
            protocol=protocol,
            original_text=text,
            anonymous=anonymous,
            final_content=text or ""
        )
        db.add(new_manifestation)
        db.commit()
        db.refresh(new_manifestation)
    finally:
        db.close()

    temp_file_path = None
    if file:
        # Validate file size
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File exceeds maximum size of 50MB.")

        # Sanitize filename and validate extension
        safe_filename = sanitize_filename(file.filename or "upload")
        ext = os.path.splitext(safe_filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"File type '{ext}' is not allowed.")

        os.makedirs("temp_uploads", exist_ok=True)
        temp_file_path = os.path.join("temp_uploads", f"{protocol}_{safe_filename}")

        # Verify resolved path is within temp_uploads
        resolved_path = os.path.realpath(temp_file_path)
        upload_dir = os.path.realpath("temp_uploads")
        if not resolved_path.startswith(upload_dir):
            raise HTTPException(status_code=400, detail="Invalid file path.")

        with open(temp_file_path, "wb") as buffer:
            buffer.write(content)

    background_tasks.add_task(process_media_task, protocol, temp_file_path, text, anonymous)

    return ManifestationResponse(
        protocol=protocol,
        message="Manifestação recebida com sucesso.",
        timestamp=datetime.datetime.now()
    )

@app.get("/manifestation/{protocol}")
@limiter.limit("30/minute")
async def get_manifestation(request: Request, protocol: str):
    # Validate protocol format
    if not re.match(r'^OUV-\d{8}-[A-Z0-9]{4,8}$', protocol):
        raise HTTPException(status_code=400, detail="Invalid protocol format.")

    db = SessionLocal()
    try:
        m = db.query(ManifestationModel).filter(ManifestationModel.protocol == protocol).first()
        if not m:
            raise HTTPException(status_code=404, detail="Protocol not found.")
        return {
            "protocol": m.protocol,
            "source_type": m.source_type,
            "status": "processed" if m.iza_tracking_id else "processing",
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
