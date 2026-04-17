package ma.emsi.gare.dto.response;

import lombok.*;
import ma.emsi.gare.enums.Role;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String token;
    private String email;
    private String nom;
    private String prenom;
    private Role role;
    private Long userId;
}