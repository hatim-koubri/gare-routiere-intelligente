package ma.emsi.gare.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ArretRequest {
    @NotBlank private String ville;
    @NotNull private Integer ordre;
    private Integer dureePauseMinutes = 0;
    private Integer heurePrevueOffsetMinutes;
}