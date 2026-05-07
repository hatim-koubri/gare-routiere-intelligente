package ma.emsi.gare.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ChauffeurCreateRequest {

    @NotBlank
    private String nom;

    @NotBlank
    private String prenom;

    @Email
    @NotBlank
    private String email;

    @NotBlank
    @Size(min = 8)
    private String password;

    private String telephone;

    @NotBlank
    private String numeroPermis;

    private LocalDate dateEmbauche;
}