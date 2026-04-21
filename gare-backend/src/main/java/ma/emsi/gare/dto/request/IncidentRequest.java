package ma.emsi.gare.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class IncidentRequest {
    @NotNull private Long trajetId;
    @NotBlank private String type; // PANNE, RETARD, ACCIDENT, AUTRE
    @NotBlank private String description;
}