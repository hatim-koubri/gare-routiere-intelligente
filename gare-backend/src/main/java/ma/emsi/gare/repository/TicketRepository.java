package ma.emsi.gare.repository;

import ma.emsi.gare.entity.Ticket;
import ma.emsi.gare.enums.StatutTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
    Optional<Ticket> findByQrCode(String qrCode);
    List<Ticket> findByReservationId(Long reservationId);
    List<Ticket> findByStatut(StatutTicket statut);

    @Query("SELECT t FROM Ticket t JOIN t.reservation r WHERE r.voyageur.id = :voyageurId AND t.statut = :statut")
    List<Ticket> findByVoyageurIdAndStatut(@Param("voyageurId") Long voyageurId, @Param("statut") StatutTicket statut);
}