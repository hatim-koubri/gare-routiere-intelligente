package ma.emsi.gare.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class QuaiRequest {
    @NotNull private Integer numero;
    @NotNull @Min(0) private Double tarifHoraire;
    private Long compagnieId; // null = non attribué
}