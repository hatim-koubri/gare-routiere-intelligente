package ma.emsi.gare.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.List;

@Data
public class LigneRequest {
    @NotBlank private String villeDepart;
    @NotBlank private String villeArrivee;
    private Integer dureeMinutes;
    @NotNull @Min(0) private Double prixBase;
    @NotNull private Long compagnieId;
    private List<ArretRequest> arrets;
}