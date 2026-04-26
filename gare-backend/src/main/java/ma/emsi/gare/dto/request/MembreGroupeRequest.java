package ma.emsi.gare.dto.request;

import lombok.Data;
import ma.emsi.gare.enums.CategorieTarifaire;

@Data
public class MembreGroupeRequest {

    private Long voyageurId;

    private String nomManuel;
    private String prenomManuel;

    // HOMME / FEMME
    private String sexe;

    private Integer age;

    private CategorieTarifaire categorieTarifaire;

    // CONJOINT / FAMILLE / AMI / COLLEGUE
    private String lienOrganisateur;

    private boolean enfantSurGenoux;

    private PreferenceVoisinageRequest preferenceVoisinage;
}