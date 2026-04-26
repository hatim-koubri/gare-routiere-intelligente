package ma.emsi.gare.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PaiementResponseDTO {

    private Long paiementId;
    private Long reservationId;
    private Double montant;
    private String methodePaiement;
    private String transactionId;
    private LocalDateTime datePaiement;
    private boolean confirme;
    private String statutReservation;
}