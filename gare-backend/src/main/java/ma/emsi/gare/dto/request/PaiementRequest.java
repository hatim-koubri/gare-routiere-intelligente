package ma.emsi.gare.dto.request;

import lombok.Data;

@Data
public class PaiementRequest {

    private Long reservationId;

    // CARTE ou PAYPAL
    private String methodePaiement;
}