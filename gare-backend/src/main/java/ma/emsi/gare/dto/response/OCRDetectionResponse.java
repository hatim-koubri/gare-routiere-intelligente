package ma.emsi.gare.dto.response;

import lombok.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OCRDetectionResponse {
    private String matricule;
    private String statut;        // DETECTE, INCONNU, ILLISIBLE
    private Long stationnementId;
    private Integer quaiAttribue;
    private String compagnie;
    private String message;
    private boolean succès;
}