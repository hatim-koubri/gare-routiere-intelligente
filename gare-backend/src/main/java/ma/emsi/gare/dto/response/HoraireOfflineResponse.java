package ma.emsi.gare.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class HoraireOfflineResponse {

    private String dateGeneration;
    private String periodeDebut;
    private String periodeFin;
    private int nombreTrajets;
    private List<TrajetOfflineDTO> trajets;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TrajetOfflineDTO {
        private Long trajetId;
        private String villeDepart;
        private String villeArrivee;
        private String compagnie;
        private String dateDepart;
        private String dateArriveePrevue;
        private Double prixBase;
        private Integer nbSiegesDisponibles;
        private String statut;
        private List<ArretOfflineDTO> arrets;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ArretOfflineDTO {
        private String ville;
        private Integer ordre;
        private String heurePassage;
        private Integer dureePauseMinutes;
    }
}