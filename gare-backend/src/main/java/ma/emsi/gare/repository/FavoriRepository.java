package ma.emsi.gare.repository;

import ma.emsi.gare.entity.Favori;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FavoriRepository extends JpaRepository<Favori, Long> {
    List<Favori> findByVoyageurIdOrderByDateCreationDesc(Long voyageurId);
    Optional<Favori> findByVoyageurIdAndLigneId(Long voyageurId, Long ligneId);
    boolean existsByVoyageurIdAndLigneId(Long voyageurId, Long ligneId);
    void deleteByVoyageurIdAndLigneId(Long voyageurId, Long ligneId);
}
