package ma.emsi.gare.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class OCRCorrectionRequest {
    @NotBlank
    private String matricule;
    private LocalDateTime heureEntree;
    private LocalDateTime heureSortie;
    private Long quaiId;
}