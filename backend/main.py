import os
import uuid
import datetime
import random
import string
import logging
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import whisper
import pytesseract
from PIL import Image
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, Text, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

app = FastAPI(title="Participa DF - Ouvidoria Digital API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"OUV-{date_part}-{random_part}"

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

            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            logger.error(f"Error during media processing for {protocol}: {e}")
            ai_text = f"Error processing file: {str(e)}"
            confidence = 0.0

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
async def submit_manifestation(
    background_tasks: BackgroundTasks,
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    anonymous: bool = Form(False)
):
    if not text and not file:
        raise HTTPException(status_code=400, detail="Either text or a media file must be provided.")

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
        os.makedirs("temp_uploads", exist_ok=True)
        temp_file_path = f"temp_uploads/{protocol}_{file.filename}"
        with open(temp_file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

    background_tasks.add_task(process_media_task, protocol, temp_file_path, text, anonymous)

    return ManifestationResponse(
        protocol=protocol,
        message="Manifestação recebida com sucesso.",
        timestamp=datetime.datetime.now()
    )

@app.get("/manifestation/{protocol}")
async def get_manifestation(protocol: str):
    db = SessionLocal()
    try:
        m = db.query(ManifestationModel).filter(ManifestationModel.protocol == protocol).first()
        if not m:
            return {"protocol": protocol, "status": "not found"}
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
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
