package com.participadf.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class ManifestationResponse {
    private String protocol;
    private String message;
    private LocalDateTime timestamp;
}
