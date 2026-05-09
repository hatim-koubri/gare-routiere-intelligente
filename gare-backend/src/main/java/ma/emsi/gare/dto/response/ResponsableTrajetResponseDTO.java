package ma.emsi.gare.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ResponsableTrajetResponseDTO {
    private Long id;
    private Long ligneId;
    private String villeDepart;
    private String villeArrivee;
    private Long busId;
    private String busMatricule;
    private Long chauffeurId;
    private String chauffeurNom;
    private String chauffeurPrenom;
    private Long quaiId;
    private Integer quaiNumero;
    private LocalDateTime dateDepart;
    private LocalDateTime dateArriveePrevue;
    private LocalDateTime dateArriveeReelle;
    private String statut;
    private Integer retardMinutes;
    private Integer nbReservations;
}