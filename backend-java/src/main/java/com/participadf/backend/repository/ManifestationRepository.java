package com.participadf.backend.repository;

import com.participadf.backend.model.Manifestation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ManifestationRepository extends JpaRepository<Manifestation, Long> {
    Optional<Manifestation> findByProtocol(String protocol);
}
