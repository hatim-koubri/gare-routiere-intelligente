package ma.emsi.gare.repository;

import ma.emsi.gare.entity.Reservation;
import ma.emsi.gare.enums.StatutReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface ReservationRepository
        extends JpaRepository<Reservation, Long> {

    List<Reservation> findByVoyageurId(Long voyageurId);

    List<Reservation> findByTrajetId(Long trajetId);

    List<Reservation> findByVoyageurIdAndStatut(
            Long voyageurId, StatutReservation statut);

    Page<Reservation> findAll(Pageable pageable);

    long countByStatut(ma.emsi.gare.enums.StatutReservation statut);

    // Historique complet avec tickets, voyageur et trajet
    @Query("""
        SELECT r FROM Reservation r
        LEFT JOIN FETCH r.tickets
        LEFT JOIN FETCH r.voyageur
        LEFT JOIN FETCH r.trajet
        WHERE r.voyageur.id = :voyageurId
        ORDER BY r.dateReservation DESC
    """)
    List<Reservation> findHistoriqueVoyageur(
            @Param("voyageurId") Long voyageurId);

    // Vérifier si voyageur a déjà réservé ce trajet
    boolean existsByVoyageurIdAndTrajetId(
            Long voyageurId, Long trajetId);

    @Query("""
    SELECT COUNT(r)
    FROM Reservation r
    WHERE r.trajet.ligne.compagnie.id = :compagnieId
""")
    long countByCompagnieId(@Param("compagnieId") Long compagnieId);

    @Query("""
    SELECT COUNT(r)
    FROM Reservation r
    WHERE r.trajet.ligne.compagnie.id = :compagnieId
    AND r.dateReservation BETWEEN :debut AND :fin
""")
    long countByCompagnieIdAndDateReservationBetween(
            @Param("compagnieId") Long compagnieId,
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin
    );

    @Query("""
    SELECT r FROM Reservation r
    WHERE r.statut = 'EN_ATTENTE'
    AND r.dateReservation < :expiration
""")
    List<Reservation> findExpiredEnAttente(@Param("expiration") LocalDateTime expiration);
}