package ma.emsi.gare.dto.response;

import lombok.Data;

@Data
public class TarificationDynamiqueResponseDTO {

    private Long id;

    private double reductionTrenteJours;

    private double reductionQuinzeJours;

    private double supplementJourMeme;

    private double seuilHaut;

    private double supplementHaut;

    private double seuilBas;

    private double reductionBas;

    private Long compagnieId;

    private String compagnieNom;
}