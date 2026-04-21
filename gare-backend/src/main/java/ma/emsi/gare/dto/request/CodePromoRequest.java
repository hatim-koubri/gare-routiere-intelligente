package ma.emsi.gare.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CodePromoRequest {
    @NotBlank private String code;
    @NotNull @Min(1) @Max(100) private Double pourcentageReduction;
    @NotNull private LocalDateTime dateExpiration;
    private Integer nbUtilisationsMax;
    private Long compagnieId;
}