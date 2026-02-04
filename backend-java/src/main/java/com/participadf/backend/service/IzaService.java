package com.participadf.backend.service;

import com.participadf.backend.model.Manifestation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
@Slf4j
public class IzaService {
    public String sendToIza(Manifestation manifestation) {
        log.info("[IZA INTEGRATION] Sending payload for protocol: {}", manifestation.getProtocol());
        // Mocking external system call
        return UUID.randomUUID().toString();
    }
}
