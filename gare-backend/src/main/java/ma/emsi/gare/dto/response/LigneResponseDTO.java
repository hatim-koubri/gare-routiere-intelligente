package ma.emsi.gare.dto.response;

import lombok.Data;
import java.util.List;

@Data
public class LigneResponseDTO {
    private Long id;
    private String villeDepart;
    private String villeArrivee;
    private Integer dureeMinutes;
    private Double prixBase;
    private boolean actif;
    private Long compagnieId;
    private String compagnieNom;
    private List<ArretResponseDTO> arrets;

    @Data
    public static class ArretResponseDTO {
        private Long id;
        private String ville;
        private Integer ordre;
        private Integer dureePauseMinutes;
        private Integer heurePrevueOffsetMinutes;
    }
}