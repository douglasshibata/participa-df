package com.participadf.backend.service;

import com.participadf.backend.model.Manifestation;
import com.participadf.backend.repository.ManifestationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.io.File;

@Service
@RequiredArgsConstructor
@Slf4j
public class ManifestationService {

    private final ManifestationRepository repository;
    private final AiService aiService;
    private final IzaService izaService;

    @Async
    public void processMedia(String protocol, File file, String originalText, Boolean anonymous) {
        log.info("Processing media for protocol: {}", protocol);
        String aiText = "";
        String sourceType = "text_only";
        Double confidence = 1.0;

        try {
            if (file != null && file.exists()) {
                String fileName = file.getName().toLowerCase();
                try {
                    if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg") || fileName.endsWith(".png") || fileName.endsWith(".bmp")) {
                        sourceType = "image_ocr";
                        aiText = aiService.extractTextFromImage(file);
                        confidence = 0.88;
                    } else if (fileName.endsWith(".mp3") || fileName.endsWith(".wav") || fileName.endsWith(".mp4") || fileName.endsWith(".mov")) {
                        sourceType = fileName.endsWith(".mp4") || fileName.endsWith(".mov") ? "video_transcription" : "audio_transcription";
                        aiText = aiService.transcribeMedia(file);
                        confidence = 0.95;
                    }
                } catch (Exception e) {
                    log.error("Error during media processing for {}: {}", protocol, e.getMessage());
                    aiText = "Erro ao processar arquivo. Tente novamente.";
                    confidence = 0.0;
                } finally {
                    if (file.exists()) {
                        file.delete();
                    }
                }
            }

            String finalContent = (originalText != null ? originalText : "").trim();
            if (!aiText.isBlank()) {
                if (!finalContent.isEmpty()) {
                    finalContent += "\n\n--- Conteúdo Extraído via IA ---\n" + aiText.trim();
                } else {
                    finalContent = aiText.trim();
                }
            }

            final String finalResult = finalContent;
            final String finalSourceType = sourceType;
            final Double finalConfidence = confidence;
            final String finalAiText = aiText;

            repository.findByProtocol(protocol).ifPresent(m -> {
                m.setAiContent(finalAiText);
                m.setFinalContent(finalResult);
                m.setSourceType(finalSourceType);
                m.setConfidenceScore(finalConfidence);

                String izaId = izaService.sendToIza(m);
                m.setIzaTrackingId(izaId);

                repository.save(m);
                log.info("Finished processing for protocol: {}", protocol);
            });
        } catch (Exception e) {
            log.error("Unexpected error processing protocol {}: {}", protocol, e.getMessage());
        }
    }
}
