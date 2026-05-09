package ma.emsi.gare.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ChauffeurUpdateRequest {

    @NotBlank
    private String nom;

    @NotBlank
    private String prenom;

    private String telephone;

    @NotBlank
    private String numeroPermis;

    private LocalDate dateEmbauche;
}
