package com.participadf.backend.controller;

import com.participadf.backend.dto.ManifestationResponse;
import com.participadf.backend.model.Manifestation;
import com.participadf.backend.repository.ManifestationRepository;
import com.participadf.backend.service.ManifestationService;
import com.participadf.backend.service.ProtocolService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;

@RestController
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ManifestationController {

    private final ManifestationRepository repository;
    private final ManifestationService manifestationService;
    private final ProtocolService protocolService;

    @PostMapping("/submit-manifestation")
    public ResponseEntity<ManifestationResponse> submitManifestation(
            @RequestParam(required = false) String text,
            @RequestParam(required = false) MultipartFile file,
            @RequestParam(defaultValue = "false") Boolean anonymous
    ) throws IOException {

        if (text == null && file == null) {
            return ResponseEntity.badRequest().build();
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
            tempFile = File.createTempFile(protocol + "_", file.getOriginalFilename());
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
    public ResponseEntity<?> getManifestation(@PathVariable String protocol) {
        return repository.findByProtocol(protocol)
                .map(m -> ResponseEntity.ok(m))
                .orElse(ResponseEntity.notFound().build());
    }
}
