package com.participadf.backend.controller;

import com.participadf.backend.dto.ManifestationResponse;
import com.participadf.backend.dto.ManifestationStatusResponse;
import com.participadf.backend.model.Manifestation;
import com.participadf.backend.repository.ManifestationRepository;
import com.participadf.backend.service.ManifestationService;
import com.participadf.backend.service.ProtocolService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.regex.Pattern;

@RestController
@RequiredArgsConstructor
public class ManifestationController {

    private final ManifestationRepository repository;
    private final ManifestationService manifestationService;
    private final ProtocolService protocolService;

    private static final int MAX_TEXT_LENGTH = 10_000;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            ".jpg", ".jpeg", ".png", ".bmp", ".tiff",
            ".mp3", ".wav", ".m4a", ".mp4", ".mov", ".avi", ".mkv"
    );
    private static final Pattern PROTOCOL_PATTERN = Pattern.compile("^OUV-\\d{8}-[A-Z0-9]{4,8}$");

    @Value("${api.key:}")
    private String apiKey;

    @PostMapping("/submit-manifestation")
    public ResponseEntity<ManifestationResponse> submitManifestation(
            @RequestParam(required = false) String text,
            @RequestParam(required = false) MultipartFile file,
            @RequestParam(defaultValue = "false") Boolean anonymous,
            @RequestHeader(value = "X-API-Key", required = false) String requestApiKey
    ) throws IOException {

        // API key validation
        if (apiKey != null && !apiKey.isBlank() && !apiKey.equals(requestApiKey)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or missing API key.");
        }

        if (text == null && file == null) {
            return ResponseEntity.badRequest().build();
        }

        // Validate text length
        if (text != null && text.length() > MAX_TEXT_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Text exceeds maximum length of " + MAX_TEXT_LENGTH + " characters.");
        }

        String protocol = protocolService.generateProtocol();

        // Save initial record
        Manifestation manifestation = Manifestation.builder()
                .protocol(protocol)
                .originalText(text)
                .finalContent(text != null ? text : "")
                .anonymous(anonymous)
                .build();
        repository.save(manifestation);

        File tempFile = null;
        if (file != null && !file.isEmpty()) {
            // Sanitize filename
            String originalFilename = file.getOriginalFilename();
            if (originalFilename != null) {
                originalFilename = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
            } else {
                originalFilename = "upload";
            }

            // Validate extension
            String ext = "";
            int dotIndex = originalFilename.lastIndexOf('.');
            if (dotIndex >= 0) {
                ext = originalFilename.substring(dotIndex).toLowerCase();
            }
            if (!ALLOWED_EXTENSIONS.contains(ext)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "File type '" + ext + "' is not allowed.");
            }

            tempFile = File.createTempFile(protocol + "_", "_" + originalFilename);
            file.transferTo(tempFile);
        }

        // Process in background
        manifestationService.processMedia(protocol, tempFile, text, anonymous);

        return ResponseEntity.ok(new ManifestationResponse(
                protocol,
                "Manifestação recebida com sucesso.",
                LocalDateTime.now()
        ));
    }

    @GetMapping("/manifestation/{protocol}")
    public ResponseEntity<ManifestationStatusResponse> getManifestation(@PathVariable String protocol) {
        // Validate protocol format
        if (!PROTOCOL_PATTERN.matcher(protocol).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid protocol format.");
        }

        return repository.findByProtocol(protocol)
                .map(m -> ResponseEntity.ok(new ManifestationStatusResponse(
                        m.getProtocol(),
                        m.getSourceType(),
                        m.getIzaTrackingId() != null ? "processed" : "processing",
                        m.getCreatedAt()
                )))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Protocol not found."));
    }
}
