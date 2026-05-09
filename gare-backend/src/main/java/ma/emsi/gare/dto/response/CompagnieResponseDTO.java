package ma.emsi.gare.dto.response;

import lombok.Data;

@Data
public class CompagnieResponseDTO {
    private Long id;
    private String nom;
    private String code;
    private String description;
    private String telephone;
    private String email;
    private Double noteMoyenne;
    private Integer nbAvis;
    private boolean actif;
    private int nombreBus;
    private int nombreQuais;
}