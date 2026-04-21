package ma.emsi.gare.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TrajetRequest {
    @NotNull private Long ligneId;
    @NotNull private Long busId;
    private Long chauffeurId;
    private Long quaiId;
    @NotNull private LocalDateTime dateDepart;
    private LocalDateTime dateArriveePrevue;
}