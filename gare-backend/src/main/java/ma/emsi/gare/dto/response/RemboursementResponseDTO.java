package ma.emsi.gare.dto.response;

import lombok.Data;
import ma.emsi.gare.enums.StatutRemboursement;

import java.time.LocalDateTime;

@Data
public class RemboursementResponseDTO {

    private Long id;

    private Long reservationId;

    private Double montant;

    private String motif;

    private StatutRemboursement statut;

    private LocalDateTime dateDemande;

    private LocalDateTime dateTraitement;

    private Long voyageurId;

    private String voyageurNom;

    private String voyageurPrenom;
}