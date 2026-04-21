package ma.emsi.gare.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class IncidentResponseDTO {
    private Long id;
    private String type;
    private String description;
    private LocalDateTime dateIncident;
    private boolean resolu;

    // Trajet — infos essentielles seulement
    private Long trajetId;
    private String villeDepart;
    private String villeArrivee;
    private LocalDateTime dateDepart;

    // Chauffeur — infos essentielles seulement
    private Long chauffeurId;
    private String chauffeurNom;
    private String chauffeurPrenom;
}