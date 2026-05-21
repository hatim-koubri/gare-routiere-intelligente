package ma.emsi.gare.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ComparaisonCompagnieDTO {

    private String compagnieNom;
    private double prix;
    private long dureeMinutes;
    private double note;
    private int nbAvis;
}