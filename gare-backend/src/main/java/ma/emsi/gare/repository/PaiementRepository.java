package ma.emsi.gare.repository;

import ma.emsi.gare.entity.Paiement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;

public interface PaiementRepository
        extends JpaRepository<Paiement, Long> {

    Optional<Paiement> findByReservationId(Long reservationId);
    Optional<Paiement> findByTransactionId(String transactionId);
    boolean existsByReservationId(Long reservationId);

    @Query("""
    SELECT COALESCE(SUM(p.montant), 0)
    FROM Paiement p
    WHERE p.confirme = true
""")
    double calculerRecettesTickets();
}