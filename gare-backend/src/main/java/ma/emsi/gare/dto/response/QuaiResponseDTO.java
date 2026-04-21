package ma.emsi.gare.dto.response;

import lombok.Data;

@Data
public class QuaiResponseDTO {
    private Long id;
    private Integer numero;
    private Double tarifHoraire;
    private boolean disponible;
    private Long compagnieId;
    private String compagnieNom;
}