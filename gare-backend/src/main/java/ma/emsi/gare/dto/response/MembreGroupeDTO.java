package ma.emsi.gare.dto.response;

import lombok.Data;

@Data
public class MembreGroupeDTO {
    private Long id;
    private String nom;
    private String prenom;
    private String sexe;
    private Integer age;
    private String categorieTarifaire;
    private String lienOrganisateur;
    private boolean enfantSurGenoux;
    private boolean accepteSexeOppose = true;
    private String preferencePosition;
    private Long prefereCoteMembreId;
    private Double prixTicket;
    private String numeroSiege;
    private String qrCode;
    private Long ticketId;
}
