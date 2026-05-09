package ma.emsi.gare.dto.request;

import lombok.Data;

@Data
public class MembreGroupeRequest {
    private String nomManuel;
    private String prenomManuel;
    private String sexe;
    private Integer age;
    private String categorieTarifaire;
    private String lienOrganisateur;
    private boolean enfantSurGenoux;
    private boolean accepteSexeOppose = true;
    private String preferencePosition;
    private Long prefereCoteMembreId;
    private String numeroSiege;
    private String numeroCarte;
    private String dateExpiration;
    private String cvv;
}
