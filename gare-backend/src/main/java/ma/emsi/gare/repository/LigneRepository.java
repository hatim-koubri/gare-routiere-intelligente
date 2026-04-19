package ma.emsi.gare.repository;

import ma.emsi.gare.entity.Ligne;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LigneRepository extends JpaRepository<Ligne, Long> {
    List<Ligne> findByCompagnieId(Long compagnieId);
    List<Ligne> findByActifTrue();
    List<Ligne> findByVilleDepartAndVilleArrivee(
            String villeDepart, String villeArrivee);
}