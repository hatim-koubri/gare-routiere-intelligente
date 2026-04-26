package ma.emsi.gare.dto.request;

import lombok.Data;
import java.time.LocalDate;

@Data
public class RechercheTrajetRequest {
    private String villeDepart;
    private String villeArrivee;
    private LocalDate date;
    private Long compagnieId;

    private Double prixMin;
    private Double prixMax;
    private Integer heureDepartMin;
    private Integer heureDepartMax;
    private Integer nbArretsMax;
}