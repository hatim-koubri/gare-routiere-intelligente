package ma.emsi.gare.dto.response;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

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
    private String statut;        // ← ajouter
    private List<String> tickets; // ← ajouter
}