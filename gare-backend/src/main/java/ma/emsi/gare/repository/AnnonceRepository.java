package ma.emsi.gare.repository;

import ma.emsi.gare.entity.Annonce;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface AnnonceRepository extends JpaRepository<Annonce, Long> {

    // Annonces actives et visibles maintenant
    @Query("""
        SELECT a FROM Annonce a
        WHERE a.active = true
        AND (a.dateDebut IS NULL OR a.dateDebut <= :now)
        AND (a.dateFin IS NULL OR a.dateFin >= :now)
        ORDER BY a.dateDebut DESC
    """)
    List<Annonce> findAnnoncesActives(LocalDateTime now);

    @Query("""
        SELECT a FROM Annonce a
        WHERE a.active = true
        AND (a.dateDebut IS NULL OR a.dateDebut <= :now)
        AND (a.dateFin IS NULL OR a.dateFin >= :now)
        AND (:compagnieId IS NULL OR a.compagnie.id = :compagnieId)
        AND (:dateMin IS NULL OR a.dateDebut IS NULL OR a.dateDebut >= :dateMin)
        AND (:dateMax IS NULL OR a.dateFin IS NULL OR a.dateFin <= :dateMax)
        ORDER BY a.dateDebut DESC
    """)
    List<Annonce> findAnnoncesActivesFiltered(
        @Param("now") LocalDateTime now,
        @Param("compagnieId") Long compagnieId,
        @Param("dateMin") LocalDateTime dateMin,
        @Param("dateMax") LocalDateTime dateMax
    );

    List<Annonce> findByCompagnieId(Long compagnieId);
    List<Annonce> findByCompagnieIsNull();
}