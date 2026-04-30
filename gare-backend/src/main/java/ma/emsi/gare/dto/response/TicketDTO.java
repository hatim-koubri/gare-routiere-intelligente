package ma.emsi.gare.dto.response;

import lombok.Data;

@Data
public class TicketDTO {
    private Long id;
    private String numeroSiege;
    private String nomPassager;
    private String prenomPassager;
    private Double prix;
    private String qrCode;
    private String statut;
}