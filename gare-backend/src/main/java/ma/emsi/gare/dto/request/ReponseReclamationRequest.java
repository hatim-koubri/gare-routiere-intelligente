package ma.emsi.gare.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import ma.emsi.gare.enums.StatutReclamation;

@Data
public class ReponseReclamationRequest {

    private StatutReclamation statut;

    @NotBlank
    private String reponseResponsable;
}