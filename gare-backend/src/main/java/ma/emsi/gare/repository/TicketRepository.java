package ma.emsi.gare.repository;

import ma.emsi.gare.entity.Ticket;
import ma.emsi.gare.enums.StatutTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
    Optional<Ticket> findByQrCode(String qrCode);
    List<Ticket> findByReservationId(Long reservationId);
    List<Ticket> findByStatut(StatutTicket statut);
}