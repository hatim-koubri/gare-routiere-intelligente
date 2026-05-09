package ma.emsi.gare.dto.response;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class AbonnementResponseDTO {
    private Long id;
    private Long ligneId;
    private String villeDepart;
    private String villeArrivee;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private Double prixMensuel;
    private boolean actif;
    private boolean renouvellementAuto;
    private LocalDateTime dateCreation;
}
