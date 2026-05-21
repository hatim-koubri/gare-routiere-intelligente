package ma.emsi.gare.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import ma.emsi.gare.enums.Role;

@Data
public class RegisterRequest {
    @NotBlank private String nom;
    @NotBlank private String prenom;
    @Email @NotBlank private String email;
    @NotBlank @Size(min = 8) private String password;
    private String telephone;
    @NotNull private Role role;
    private String sexe; // HOMME ou FEMME
}