package ma.emsi.gare.repository;

import ma.emsi.gare.entity.Avis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AvisRepository extends JpaRepository<Avis, Long> {

    // Fixed: trajet -> bus -> compagnie
    List<Avis> findByTrajetBusCompagnieIdOrderByDateAvisDesc(Long compagnieId);

    List<Avis> findByTrajetIdOrderByDateAvisDesc(Long trajetId);

    @Query("SELECT AVG((a.notePonctualite + a.noteConfort + a.noteChauffeur) / 3.0) " +
            "FROM Avis a WHERE a.trajet.bus.compagnie.id = :compagnieId")
    Double avgNoteByCompagnieId(@Param("compagnieId") Long compagnieId);

    @Query("SELECT COUNT(a) FROM Avis a WHERE a.trajet.bus.compagnie.id = :compagnieId")
    Long countByCompagnieId(@Param("compagnieId") Long compagnieId);

    boolean existsByVoyageurIdAndTrajetId(Long voyageurId, Long trajetId);
    List<Avis> findByVoyageurIdOrderByDateAvisDesc(Long voyageurId);
}