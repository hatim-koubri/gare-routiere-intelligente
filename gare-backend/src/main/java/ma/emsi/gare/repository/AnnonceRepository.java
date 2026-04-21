package ma.emsi.gare.repository;

import ma.emsi.gare.entity.Annonce;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
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

    List<Annonce> findByCompagnieId(Long compagnieId);
    List<Annonce> findByCompagnieIsNull(); // annonces globales gare
}