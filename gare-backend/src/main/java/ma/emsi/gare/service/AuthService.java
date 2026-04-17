package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.LoginRequest;
import ma.emsi.gare.dto.request.RegisterRequest;
import ma.emsi.gare.dto.response.AuthResponse;
import ma.emsi.gare.entity.*;
import ma.emsi.gare.enums.Role;
import ma.emsi.gare.repository.UserRepository;
import ma.emsi.gare.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email déjà utilisé");
        }

        User user = createUserByRole(request);
        user.setEmailVerified(true); // à remplacer par vrai flow email Sprint 2
        userRepository.save(user);

        String token = jwtService.generateToken(user);
        return buildResponse(token, user);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        String token = jwtService.generateToken(user);
        return buildResponse(token, user);
    }

    private User createUserByRole(RegisterRequest r) {
        String hashedPwd = passwordEncoder.encode(r.getPassword());
        return switch (r.getRole()) {
            case VOYAGEUR -> {
                Voyageur v = new Voyageur();
                setBaseFields(v, r, hashedPwd, Role.VOYAGEUR);
                yield v;
            }
            case CHAUFFEUR -> {
                Chauffeur c = new Chauffeur();
                setBaseFields(c, r, hashedPwd, Role.CHAUFFEUR);
                yield c;
            }
            case RESPONSABLE_COMPAGNIE -> {
                ResponsableCompagnie rc = new ResponsableCompagnie();
                setBaseFields(rc, r, hashedPwd, Role.RESPONSABLE_COMPAGNIE);
                yield rc;
            }
            case ADMIN -> {
                Admin a = new Admin();
                setBaseFields(a, r, hashedPwd, Role.ADMIN);
                yield a;
            }
        };
    }

    private void setBaseFields(User u, RegisterRequest r, String pwd, Role role) {
        u.setNom(r.getNom());
        u.setPrenom(r.getPrenom());
        u.setEmail(r.getEmail());
        u.setPassword(pwd);
        u.setTelephone(r.getTelephone());
        u.setRole(role);
    }

    private AuthResponse buildResponse(String token, User user) {
        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .role(user.getRole())
                .userId(user.getId())
                .build();
    }
}