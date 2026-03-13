package com.participadf.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class ManifestationStatusResponse {
    private String protocol;
    private String sourceType;
    private String status;
    private LocalDateTime createdAt;
}
