package ma.emsi.gare.repository;

import ma.emsi.gare.entity.CodePromo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CodePromoRepository extends JpaRepository<CodePromo, Long> {
    Optional<CodePromo> findByCode(String code);
    boolean existsByCode(String code);
    List<CodePromo> findByCompagnieId(Long compagnieId);

    List<CodePromo> findByActifTrueAndDateExpirationAfter(
            LocalDateTime maintenant);

    long countByCompagnieIdAndActifTrue(Long compagnieId);
}