package ma.emsi.gare.dto.response;

import lombok.Data;

@Data
public class PreferenceNonSatisfaiteDTO {

    private Long membreId;

    private String nom;

    private String prenom;

    private String siege;

    private String genre;

    private String voisinSiege;

    private String voisinGenre;

    private String probleme;

    private Long trajetId;
}