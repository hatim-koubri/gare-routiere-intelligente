package ma.emsi.gare.dto.request;

import lombok.Data;

@Data
public class TarificationDynamiqueRequest {

    private double reductionTrenteJours;

    private double reductionQuinzeJours;

    private double supplementJourMeme;

    private double seuilHaut;

    private double supplementHaut;

    private double seuilBas;

    private double reductionBas;
}