package ma.emsi.gare.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TrajetResponseDTO {
    private Long id;
    private LocalDateTime dateDepart;
    private LocalDateTime dateArriveePrevue;
    private LocalDateTime dateArriveeReelle;
    private String statut;
    private Integer retardMinutes;
    private Integer nbReservations;

    // Ligne — juste les infos essentielles
    private Long ligneId;
    private String villeDepart;
    private String villeArrivee;
    private Double prixBase;

    // Bus — juste les infos essentielles
    private Long busId;
    private String busMatricule;
    private String busMarque;
    private Integer nbSieges;

    // Chauffeur — juste les infos essentielles
    private Long chauffeurId;
    private String chauffeurNom;
    private String chauffeurPrenom;

    // Quai — juste les infos essentielles
    private Long quaiId;
    private Integer quaiNumero;

    // Compagnie
    private Long compagnieId;
    private String compagnieNom;
    private Double compagnieNoteMoyenne;
    private Integer compagnieNbAvis;
}