package ma.emsi.gare.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CodePromoResponseDTO {

    private Long id;

    private String code;

    private Double pourcentageReduction;

    private LocalDateTime dateExpiration;

    private Integer nbUtilisationsMax;

    private Integer nbUtilisationsActuel;

    private boolean actif;

    private Long compagnieId;

    private String compagnieNom;
}