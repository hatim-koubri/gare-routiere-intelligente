package ma.emsi.gare.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CompagnieStatsDTO {

    private Long totalTrajets;

    private Long totalReservations;

    private Double totalVentes;

    private Double tauxRemplissageMoyen;

    private Long totalBusActifs;

    private Long totalCodesPromoActifs;
}