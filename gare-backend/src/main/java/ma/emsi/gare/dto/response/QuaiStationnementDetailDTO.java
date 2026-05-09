package ma.emsi.gare.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class QuaiStationnementDetailDTO {
    private Long quaiId;
    private Integer quaiNumero;
    private Double tarifHoraire;
    private String compagnieNom;
    private List<StationnementLigneDTO> stationnements;
    private double totalQuai;
}
