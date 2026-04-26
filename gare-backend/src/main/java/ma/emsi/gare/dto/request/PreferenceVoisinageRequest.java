package ma.emsi.gare.dto.request;

import lombok.Data;

@Data
public class PreferenceVoisinageRequest {

    private boolean accepteSexeOppose = true;

    // FENETRE / COULOIR / INDIFFERENT
    private String preferencePosition;

    private Long prefereCoteMembreId;
}