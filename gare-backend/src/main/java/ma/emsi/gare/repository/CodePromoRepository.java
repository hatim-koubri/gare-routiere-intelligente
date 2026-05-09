package ma.emsi.gare.repository;

import ma.emsi.gare.entity.CodePromo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CodePromoRepository extends JpaRepository<CodePromo, Long> {
    Optional<CodePromo> findByCode(String code);
    boolean existsByCode(String code);
    List<CodePromo> findByCompagnieId(Long compagnieId);

    List<CodePromo> findByActifTrueAndDateExpirationAfter(
            LocalDateTime maintenant);

    @Query("SELECT c FROM CodePromo c WHERE c.actif = true AND c.dateExpiration > :now AND (:compagnieId IS NULL OR c.compagnie.id = :compagnieId) ORDER BY c.dateExpiration DESC")
    List<CodePromo> findActifsByCompagnie(@Param("now") LocalDateTime now, @Param("compagnieId") Long compagnieId);

    long countByCompagnieIdAndActifTrue(Long compagnieId);
}