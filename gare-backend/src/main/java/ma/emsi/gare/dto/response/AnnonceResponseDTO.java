package ma.emsi.gare.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AnnonceResponseDTO {

    private Long id;

    private String titreFr;

    private String titreAr;

    private String contenuFr;

    private String contenuAr;

    private LocalDateTime dateDebut;

    private LocalDateTime dateFin;

    private boolean active;

    private Long compagnieId;

    private String compagnieNom;
}