package com.participadf.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.util.stream.Collectors;

@Service
@Slf4j
public class AiService {

    public String transcribeMedia(File file) {
        log.info("Starting transcription for file: {}", file.getName());
        try {
            // whisper [file] --model base --output_format txt
            ProcessBuilder pb = new ProcessBuilder("whisper", file.getAbsolutePath(), "--model", "base", "--output_format", "txt", "--output_dir", "/tmp");
            Process process = pb.start();
            int exitCode = process.waitFor();

            if (exitCode == 0) {
                File resultFile = new File("/tmp/" + file.getName().substring(0, file.getName().lastIndexOf('.')) + ".txt");
                if (resultFile.exists()) {
                    String content = java.nio.file.Files.readString(resultFile.toPath());
                    resultFile.delete();
                    return content;
                }
            } else {
                String error = new BufferedReader(new InputStreamReader(process.getErrorStream()))
                        .lines().collect(Collectors.joining("\n"));
                log.error("Whisper error: {}", error);
            }
        } catch (Exception e) {
            log.error("Failed to transcribe media", e);
        }
        return "[Error or No Content extracted]";
    }

    public String extractTextFromImage(File file) {
        log.info("Starting OCR for file: {}", file.getName());
        try {
            // tesseract [file] stdout
            ProcessBuilder pb = new ProcessBuilder("tesseract", file.getAbsolutePath(), "stdout");
            Process process = pb.start();

            String content = new BufferedReader(new InputStreamReader(process.getInputStream()))
                    .lines().collect(Collectors.joining("\n"));

            int exitCode = process.waitFor();
            if (exitCode == 0) {
                return content;
            } else {
                log.error("Tesseract error");
            }
        } catch (Exception e) {
            log.error("Failed to extract text from image", e);
        }
        return "[Error or No Content extracted]";
    }
}
