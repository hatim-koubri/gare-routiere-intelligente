package ma.emsi.gare.dto.response;

import lombok.Data;
import java.time.LocalDate;

@Data
public class BusResponseDTO {
    private Long id;
    private String matricule;
    private String marque;
    private String modele;
    private Integer nbSieges;
    private boolean climatise;
    private boolean wifi;
    private LocalDate dateMaintenance;
    private boolean enMaintenance;
    private boolean actif;
    private Long compagnieId;
    private String compagnieNom;
}