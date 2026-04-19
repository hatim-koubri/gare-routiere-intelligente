package ma.emsi.gare.dto.request;

import lombok.Data;

@Data
public class TarificationRequest {
    // Tarification par délai
    private Double reductionTrentejours = 20.0;   // -20%
    private Double reductionQuinzeJours = 10.0;   // -10%
    private Double supplementJourMeme   = 10.0;   // +10%

    // Smart pricing par remplissage
    private Double seuilHaut         = 80.0;  // >80% → supplement
    private Double supplementHaut    = 15.0;  // +15%
    private Double seuilBas          = 30.0;  // <30% → reduction
    private Double reductionBas      = 10.0;  // -10%
}