package ma.emsi.gare.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DashboardFinancierDTO {

    private double recettesTickets;
    private double recettesStationnement;
    private double recettesTotales;
    private long reservationsConfirmees;
    private long reservationsAnnulees;
    private double tauxRemplissageGlobal;
}