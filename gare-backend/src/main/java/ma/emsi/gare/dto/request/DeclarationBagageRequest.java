package ma.emsi.gare.dto.request;

import lombok.Data;

@Data
public class DeclarationBagageRequest {
    private String qrCodeBagage;
    private String type; // PERDU or ENDOMMAGE
}