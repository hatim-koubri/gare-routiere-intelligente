package ma.emsi.gare.dto.response;

import lombok.Data;
import ma.emsi.gare.enums.StatutReclamation;

import java.time.LocalDateTime;

@Data
public class ReclamationResponseDTO {

    private Long id;

    private String sujet;

    private String description;

    private StatutReclamation statut;

    private String reponseResponsable;

    private LocalDateTime dateCreation;

    private Long voyageurId;
    private String voyageurNom;

    private Long reservationId;
}