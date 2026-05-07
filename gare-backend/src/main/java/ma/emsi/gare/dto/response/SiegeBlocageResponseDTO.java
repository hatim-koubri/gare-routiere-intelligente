package ma.emsi.gare.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SiegeBlocageResponseDTO {
    private Long id;
    private String numeroSiege;
    private Integer numeroRangee;
    private String positionRangee;
    private boolean occupe;
    private boolean bloque;
    private String motifBlocage;
    private LocalDateTime dateBlocage;
    private Long trajetId;
}