package ma.emsi.gare.dto.request;

import lombok.Data;
import ma.emsi.gare.enums.TypeReclamation;

@Data
public class CreerReclamationRequest {
    private TypeReclamation type;
    private String sujet;
    private String description;
    private Long reservationId;
    private String codeBagage;
    private Long compagnieId;
}

