package ma.emsi.gare.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class ModificationReservationRequest {

    private Long nouveauTrajetId;
    private List<String> nouveauxSieges;
    private String numeroCarte;
    private String dateExpiration;
    private String cvv;
}