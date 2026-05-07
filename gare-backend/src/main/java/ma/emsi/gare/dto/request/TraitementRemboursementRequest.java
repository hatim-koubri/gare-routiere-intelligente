package ma.emsi.gare.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import ma.emsi.gare.enums.StatutRemboursement;

@Data
public class TraitementRemboursementRequest {

    @NotNull
    private StatutRemboursement statut;
}