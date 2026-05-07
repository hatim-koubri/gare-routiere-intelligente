package ma.emsi.gare.repository;

import ma.emsi.gare.entity.Trajet;
import ma.emsi.gare.enums.StatutTrajet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TrajetRepository extends JpaRepository<Trajet, Long> {

    // ✅ Sprint 1 — Rayan — garder
    List<Trajet> findByDateDepartBetweenAndStatutIn(
            LocalDateTime debut,
            LocalDateTime fin,
            List<StatutTrajet> statuts
    );

    // ✅ Sprint 1 — garder
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

    // ✅ Sprint 3 — Rayan — garder
    List<Trajet> findByChauffeurIdAndStatutIn(
            Long chauffeurId,
            List<StatutTrajet> statuts
    );

    // ========== SPRINT 4 — NOUVEAU ==========

    // T4-01 — Recherche avec filtre compagnie
    @Query("""
        SELECT t FROM Trajet t
        JOIN t.ligne l
        WHERE l.villeDepart = :villeDepart
        AND l.villeArrivee = :villeArrivee
        AND t.dateDepart BETWEEN :debut AND :fin
        AND t.statut IN :statuts
        AND (:compagnieId IS NULL
             OR l.compagnie.id = :compagnieId)
        ORDER BY t.dateDepart ASC
    """)
    List<Trajet> findByVillePeriodeEtCompagnie(
            @Param("villeDepart") String villeDepart,
            @Param("villeArrivee") String villeArrivee,
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin,
            @Param("statuts") List<StatutTrajet> statuts,
            @Param("compagnieId") Long compagnieId
    );

    // T4-02 — Correspondances (arrêts intermédiaires)
    @Query("""
        SELECT t FROM Trajet t
        JOIN t.ligne l
        JOIN l.arrets a
        WHERE a.ville = :villeDepart
        AND t.dateDepart BETWEEN :debut AND :fin
        AND t.statut IN :statuts
        ORDER BY t.dateDepart ASC
    """)
    List<Trajet> findByVilleDepartArret(
            @Param("villeDepart") String villeDepart,
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin,
            @Param("statuts") List<StatutTrajet> statuts
    );

    // T4-03 — Filtre par prix
    @Query("""
        SELECT t FROM Trajet t
        JOIN t.ligne l
        WHERE l.villeDepart = :villeDepart
        AND l.villeArrivee = :villeArrivee
        AND t.dateDepart BETWEEN :debut AND :fin
        AND t.statut IN :statuts
        AND l.prixBase BETWEEN :prixMin AND :prixMax
        ORDER BY l.prixBase ASC
    """)
    List<Trajet> findByVillePeriodeEtPrix(
            @Param("villeDepart") String villeDepart,
            @Param("villeArrivee") String villeArrivee,
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin,
            @Param("statuts") List<StatutTrajet> statuts,
            @Param("prixMin") Double prixMin,
            @Param("prixMax") Double prixMax
    );

    // T4-03 — Filtre nombre d'arrêts max
    @Query("""
        SELECT t FROM Trajet t
        JOIN t.ligne l
        WHERE l.villeDepart = :villeDepart
        AND l.villeArrivee = :villeArrivee
        AND t.dateDepart BETWEEN :debut AND :fin
        AND t.statut IN :statuts
        AND SIZE(l.arrets) <= :nbArretsMax
        ORDER BY t.dateDepart ASC
    """)
    List<Trajet> findByVillePeriodeEtNbArrets(
            @Param("villeDepart") String villeDepart,
            @Param("villeArrivee") String villeArrivee,
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin,
            @Param("statuts") List<StatutTrajet> statuts,
            @Param("nbArretsMax") int nbArretsMax
    );

    // Historique voyageur (Sprint 4 — US-76)
    @Query("""
        SELECT DISTINCT t FROM Trajet t
        JOIN t.reservations r
        WHERE r.voyageur.id = :voyageurId
        ORDER BY t.dateDepart DESC
    """)
    List<Trajet> findByVoyageurId(
            @Param("voyageurId") Long voyageurId
    );

    // Smart Pricing — compter sièges occupés (T4-09)
    @Query("""
        SELECT COUNT(s) FROM Siege s
        WHERE s.trajet.id = :trajetId
        AND s.occupe = true
    """)
    long countSiegesOccupes(@Param("trajetId") Long trajetId);


    @Query("""
    SELECT COUNT(t)
    FROM Trajet t
    WHERE t.ligne.compagnie.id = :compagnieId
""")
    long countByCompagnieId(@Param("compagnieId") Long compagnieId);
}