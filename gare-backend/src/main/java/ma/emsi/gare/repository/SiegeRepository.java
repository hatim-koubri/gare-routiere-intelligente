package ma.emsi.gare.repository;

import ma.emsi.gare.entity.Siege;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SiegeRepository extends JpaRepository<Siege, Long> {
    List<Siege> findByTrajetId(Long trajetId);
    List<Siege> findByTrajetIdAndOccupeFalseAndBloqueFalse(Long trajetId);
    Optional<Siege> findByTrajetIdAndNumeroSiege(Long trajetId, String numeroSiege);
    long countByTrajetIdAndOccupeTrue(Long trajetId);
}