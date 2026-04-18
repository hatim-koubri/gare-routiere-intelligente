package ma.emsi.gare.service;

import ma.emsi.gare.dto.request.LoginRequest;
import ma.emsi.gare.dto.request.RegisterRequest;
import ma.emsi.gare.dto.response.AuthResponse;
import ma.emsi.gare.entity.Admin;
import ma.emsi.gare.entity.User;
import ma.emsi.gare.entity.Voyageur;
import ma.emsi.gare.enums.Role;
import ma.emsi.gare.repository.UserRepository;
import ma.emsi.gare.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService — Tests unitaires")
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest();
        registerRequest.setNom("KOUBRI");
        registerRequest.setPrenom("Hatim");
        registerRequest.setEmail("hatim@emsi.ma");
        registerRequest.setPassword("password123");
        registerRequest.setTelephone("0600000000");
        registerRequest.setRole(Role.ADMIN);

        loginRequest = new LoginRequest();
        loginRequest.setEmail("hatim@emsi.ma");
        loginRequest.setPassword("password123");
    }

    // ===================== REGISTER TESTS =====================

    @Test
    @DisplayName("Register ADMIN — succès")
    void register_Admin_Success() {
        // Arrange
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$hashedPassword");
        when(jwtService.generateToken(any())).thenReturn("fake-jwt-token");

        Admin savedAdmin = new Admin();
        savedAdmin.setId(1L);
        savedAdmin.setNom("KOUBRI");
        savedAdmin.setPrenom("Hatim");
        savedAdmin.setEmail("hatim@emsi.ma");
        savedAdmin.setRole(Role.ADMIN);
        savedAdmin.setEmailVerified(true);
        when(userRepository.save(any(User.class))).thenReturn(savedAdmin);

        // Act
        AuthResponse response = authService.register(registerRequest);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("fake-jwt-token");
        assertThat(response.getEmail()).isEqualTo("hatim@emsi.ma");
        assertThat(response.getRole()).isEqualTo(Role.ADMIN);
        verify(userRepository, times(1)).save(any(User.class));
        verify(jwtService, times(1)).generateToken(any());
    }

    @Test
    @DisplayName("Register VOYAGEUR — succès")
    void register_Voyageur_Success() {
        // Arrange
        registerRequest.setRole(Role.VOYAGEUR);
        registerRequest.setEmail("voyageur@emsi.ma");

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$hashedPassword");

        Voyageur savedVoyageur = new Voyageur();
        savedVoyageur.setId(2L);
        savedVoyageur.setEmail("voyageur@emsi.ma");
        savedVoyageur.setRole(Role.VOYAGEUR);
        savedVoyageur.setEmailVerified(true);
        when(userRepository.save(any(User.class))).thenReturn(savedVoyageur);
        when(jwtService.generateToken(any())).thenReturn("voyageur-token");

        // Act
        AuthResponse response = authService.register(registerRequest);

        // Assert
        assertThat(response.getRole()).isEqualTo(Role.VOYAGEUR);
        assertThat(response.getToken()).isEqualTo("voyageur-token");
    }

    @Test
    @DisplayName("Register — email déjà utilisé → exception")
    void register_EmailAlreadyExists_ThrowsException() {
        // Arrange
        when(userRepository.existsByEmail("hatim@emsi.ma")).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Email déjà utilisé");

        verify(userRepository, never()).save(any());
        verify(jwtService, never()).generateToken(any());
    }

    @Test
    @DisplayName("Register — password encodé en BCrypt")
    void register_PasswordIsEncoded() {
        // Arrange
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("$2a$10$encoded");

        Admin saved = new Admin();
        saved.setId(1L);
        saved.setEmail("hatim@emsi.ma");
        saved.setRole(Role.ADMIN);
        saved.setEmailVerified(true);
        when(userRepository.save(any())).thenReturn(saved);
        when(jwtService.generateToken(any())).thenReturn("token");

        // Act
        authService.register(registerRequest);

        // Assert
        verify(passwordEncoder, times(1)).encode("password123");
    }

    // ===================== LOGIN TESTS =====================

    @Test
    @DisplayName("Login — succès")
    void login_Success() {
        // Arrange
        Admin admin = new Admin();
        admin.setId(1L);
        admin.setNom("KOUBRI");
        admin.setPrenom("Hatim");
        admin.setEmail("hatim@emsi.ma");
        admin.setRole(Role.ADMIN);
        admin.setEmailVerified(true);
        admin.setActif(true);

        when(authenticationManager.authenticate(any())).thenReturn(
                new UsernamePasswordAuthenticationToken("hatim@emsi.ma", "password123")
        );
        when(userRepository.findByEmail("hatim@emsi.ma")).thenReturn(Optional.of(admin));
        when(jwtService.generateToken(any())).thenReturn("login-jwt-token");

        // Act
        AuthResponse response = authService.login(loginRequest);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("login-jwt-token");
        assertThat(response.getEmail()).isEqualTo("hatim@emsi.ma");
        assertThat(response.getNom()).isEqualTo("KOUBRI");
    }

    @Test
    @DisplayName("Login — mauvais mot de passe → exception")
    void login_BadCredentials_ThrowsException() {
        // Arrange
        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        // Act & Assert
        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(BadCredentialsException.class);

        verify(userRepository, never()).findByEmail(any());
        verify(jwtService, never()).generateToken(any());
    }

    @Test
    @DisplayName("Login — utilisateur non trouvé → exception")
    void login_UserNotFound_ThrowsException() {
        // Arrange
        when(authenticationManager.authenticate(any())).thenReturn(
                new UsernamePasswordAuthenticationToken("hatim@emsi.ma", "password123")
        );
        when(userRepository.findByEmail("hatim@emsi.ma")).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Utilisateur non trouvé");
    }
}