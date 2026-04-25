package ma.emsi.gare.repository;

import ma.emsi.gare.entity.Trajet;
import ma.emsi.gare.enums.StatutTrajet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TrajetRepository extends JpaRepository<Trajet, Long> {

    // Trajets dans une période donnée
    List<Trajet> findByDateDepartBetweenAndStatutIn(
            LocalDateTime debut,
            LocalDateTime fin,
            List<StatutTrajet> statuts
    );

    // Trajets par ville départ et arrivée
    @Query("""
        SELECT t FROM Trajet t
        JOIN t.ligne l
        WHERE l.villeDepart = :villeDepart
        AND l.villeArrivee = :villeArrivee
        AND t.dateDepart BETWEEN :debut AND :fin
        AND t.statut IN :statuts
        ORDER BY t.dateDepart ASC
    """)
    List<Trajet> findByVilleAndPeriode(
            @Param("villeDepart") String villeDepart,
            @Param("villeArrivee") String villeArrivee,
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin,
            @Param("statuts") List<StatutTrajet> statuts
    );
    List<Trajet> findByChauffeurIdAndStatutIn(Long chauffeurId, List<StatutTrajet> statuts);
}