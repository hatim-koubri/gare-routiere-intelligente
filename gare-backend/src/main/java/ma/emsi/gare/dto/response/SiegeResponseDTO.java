package ma.emsi.gare.dto.response;

import lombok.Data;

@Data
public class SiegeResponseDTO {

    private String numeroSiege;
    private Integer numeroRangee;
    private String positionRangee;

    private boolean occupe;
    private boolean bloque;
    private boolean verrouilleTemporaire;

    private String genreOccupant;
    private boolean enfantSurGenoux;

    // HOMME / FEMME / ENFANT / GROUPE / null
    private String typeOccupant;
}