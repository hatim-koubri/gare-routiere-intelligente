package ma.emsi.gare.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AnnonceRequest {

    @NotBlank
    private String titreFr;

    private String titreAr;

    @NotBlank
    private String contenuFr;

    private String contenuAr;

    private LocalDateTime dateDebut;

    private LocalDateTime dateFin;

    private Long compagnieId;
}