package ma.emsi.gare.dto.request;

import lombok.Data;
import ma.emsi.gare.enums.TypeBagage;

/**
 * DTO pour déclarer un bagage lors de la réservation.
 * Le QR code sera généré plus tard au scan par le chauffeur.
 */
@Data
public class BagageRequest {

    /**
     * Poids du bagage en kilogrammes (ex: 20.5)
     */
    private Double poidsKg;

    /**
     * Dimensions au format "LxWxH" en cm (ex: "60x40x30")
     */
    private String dimensionCm;

    /**
     * Type optionnel — si null, auto-détecté selon poids + volume
     */
    private TypeBagage typeBagage;
}
