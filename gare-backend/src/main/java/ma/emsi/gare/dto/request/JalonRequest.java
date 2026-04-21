package ma.emsi.gare.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class JalonRequest {
    @NotNull private Long trajetId;
    @NotBlank private String ville;
    @NotNull private Integer ordre;
}