package ma.emsi.gare.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;

@Data
public class BusRequest {
    @NotBlank private String matricule;
    @NotBlank private String marque;
    private String modele;
    @NotNull @Min(1) @Max(100) private Integer nbSieges;
    private boolean climatise;
    private boolean wifi;
    private LocalDate dateMaintenance;
    @NotNull private Long compagnieId;
}