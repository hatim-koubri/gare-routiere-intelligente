package ma.emsi.gare.dto.response;

import lombok.Data;

@Data
public class LigneAbonnementDisponibleDTO {
    private Long id;
    private String villeDepart;
    private String villeArrivee;
    private Double prixAbonnementMensuel;
    private String compagnieNom;
}
