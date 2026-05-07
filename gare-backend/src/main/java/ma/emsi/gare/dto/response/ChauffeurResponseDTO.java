package ma.emsi.gare.dto.response;

import lombok.Data;

import java.time.LocalDate;

@Data
public class ChauffeurResponseDTO {

    private Long id;

    private String nom;
    private String prenom;
    private String email;
    private String telephone;

    private String numeroPermis;
    private LocalDate dateEmbauche;

    private Double noteMoyenne;

    private boolean enConge;
    private boolean actif;

    private Long compagnieId;
    private String compagnieNom;
}