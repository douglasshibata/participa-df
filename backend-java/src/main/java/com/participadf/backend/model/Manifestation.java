package com.participadf.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "manifestations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Manifestation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String protocol;

    private String sourceType;

    @Column(columnDefinition = "TEXT")
    private String originalText;

    @Column(columnDefinition = "TEXT")
    private String aiContent;

    @Column(columnDefinition = "TEXT")
    private String finalContent;

    private Double confidenceScore;

    private Boolean anonymous;

    private LocalDateTime createdAt;

    private String izaTrackingId;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
