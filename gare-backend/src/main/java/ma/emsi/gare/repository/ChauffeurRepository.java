package ma.emsi.gare.repository;

import ma.emsi.gare.entity.Chauffeur;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ChauffeurRepository extends JpaRepository<Chauffeur, Long> {
    List<Chauffeur> findByCompagnieId(Long compagnieId);
    List<Chauffeur> findByCompagnieIdAndEnCongeFalse(Long compagnieId);
    Optional<Chauffeur> findByNumeroPermis(String numeroPermis);
    boolean existsByNumeroPermis(String numeroPermis);
}