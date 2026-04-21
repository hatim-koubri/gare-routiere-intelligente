package ma.emsi.gare.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class StationnementOCRResponseDTO {
    private Long id;
    private String matricule;
    private String compagnieNom;
    private Integer quaiAttribue;
    private LocalDateTime debut;
    private LocalDateTime fin;
    private String statut;
    private Double montant;
    private boolean correctionManuelle;
}