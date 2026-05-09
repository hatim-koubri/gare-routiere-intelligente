package ma.emsi.gare.repository;

import ma.emsi.gare.entity.Siege;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SiegeRepository extends JpaRepository<Siege, Long> {

    // ✅ Déjà présent — garder
    List<Siege> findByTrajetId(Long trajetId);

    // ✅ Déjà présent — garder
    List<Siege> findByTrajetIdAndOccupeFalseAndBloqueFalse(Long trajetId);

    // ✅ Déjà présent — garder
    Optional<Siege> findByTrajetIdAndNumeroSiege(
            Long trajetId, String numeroSiege);

    // ✅ Déjà présent — garder
    long countByTrajetIdAndOccupeTrue(Long trajetId);

    // ← NOUVEAU pour verrouillage temporaire pendant paiement
    List<Siege> findByTrajetIdAndVerrouilleTemporaireFalse(Long trajetId);

    // ← NOUVEAU libérer sièges expirés
    @Modifying
    @Query("""
        UPDATE Siege s
        SET s.verrouilleTemporaire = false,
            s.verrouilleParReservationId = null
        WHERE s.verrouilleParReservationId = :reservationId
    """)
    void libererSiegesVerrouilles(@Param("reservationId") Long reservationId);

    // ← NOUVEAU pour algorithme placement — sièges libres par rangée
    @Query("""
        SELECT s FROM Siege s
        WHERE s.trajet.id = :trajetId
        AND s.occupe = false
        AND s.bloque = false
        AND s.verrouilleTemporaire = false
        ORDER BY s.numeroRangee ASC, s.positionRangee ASC
    """)
    List<Siege> findSiegesLibresOrdonnes(@Param("trajetId") Long trajetId);

    // ← NOUVEAU compter total sièges
    long countByTrajetId(Long trajetId);

    // ← NOUVEAU vérifier si siège verrouillé par une réservation
    Optional<Siege> findByTrajetIdAndNumeroSiegeAndVerrouilleTemporaireFalse(
            Long trajetId, String numeroSiege);

    @Modifying
    @Query("""
    UPDATE Siege s
    SET s.verrouilleTemporaire = false,
        s.verrouilleParReservationId = null,
        s.verrouilleAt = null
    WHERE s.verrouilleTemporaire = true
    AND s.verrouilleAt < :expiration
""")
    int libererSiegesExpires(@Param("expiration") LocalDateTime expiration);
}