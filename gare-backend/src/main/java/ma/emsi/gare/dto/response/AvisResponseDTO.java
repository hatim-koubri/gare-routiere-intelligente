package ma.emsi.gare.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AvisResponseDTO {
    private Long id;
    private Long voyageurId;
    private String voyageurNom;
    private String voyageurPrenom;
    private Long trajetId;
    private Integer notePonctualite;
    private Integer noteConfort;
    private Integer noteChauffeur;
    private String commentaire;
    private LocalDateTime dateAvis;
    private Long compagnieId;
    private String compagnieNom;
    private String villeDepart;
    private String villeArrivee;
    private String dateDepart;
}
