package ma.emsi.gare.dto.response;

import lombok.Data;
import ma.emsi.gare.enums.TypeBagage;

/**
 * DTO de réponse renvoyé après création ou scan d'un bagage.
 * Le qrCodeBagage est null lors de la réservation — il est généré au scan chauffeur.
 */
@Data
public class BagageResponseDTO {

    private Long id;

    /** Type auto-détecté : CABINE / SOUTE / SURDIMENSIONNE */
    private TypeBagage typeBagage;

    private Double poidsKg;

    /** Format "LxWxH" en cm */
    private String dimensionCm;

    /** Frais de surplus calculés automatiquement en DH */
    private Double surplusPrix;

    /** Null jusqu'au scan du chauffeur — généré lors du scan */
    private String qrCodeBagage;

    private Long reservationId;
}
