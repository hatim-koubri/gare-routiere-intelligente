package ma.emsi.gare.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class StationnementLigneDTO {
    private Long stationnementId;
    private String matricule;
    private String compagnieNom;
    private String debut;
    private String fin;
    private long dureeMinutes;
    private double coutCalcule;
    private String statut;
}
