package ma.emsi.gare.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RmiPriceResponseDTO {

    private double distanceKm;

    private double occupancyRate;

    private boolean weekend;

    private boolean vip;

    private double estimatedPrice;

    private String technology;
}