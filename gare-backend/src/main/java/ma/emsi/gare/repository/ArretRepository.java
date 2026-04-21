package ma.emsi.gare.repository;

import ma.emsi.gare.entity.Arret;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ArretRepository extends JpaRepository<Arret, Long> {
    List<Arret> findByLigneIdOrderByOrdreAsc(Long ligneId);
    void deleteByLigneId(Long ligneId);
}