package ma.emsi.gare.security;

import ma.emsi.gare.entity.Admin;
import ma.emsi.gare.enums.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("JwtService — Tests unitaires")
class JwtServiceTest {

    private JwtService jwtService;
    private Admin adminUser;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey",
                "gare_routiere_secret_key_emsi_2025_hatim_koubri_very_long_key");
        ReflectionTestUtils.setField(jwtService, "expiration", 86400000L);

        adminUser = new Admin();
        adminUser.setId(1L);
        adminUser.setEmail("hatim@emsi.ma");
        adminUser.setPassword("$2a$10$hashedpwd");
        adminUser.setRole(Role.ADMIN);
        adminUser.setActif(true);
        adminUser.setEmailVerified(true);
    }

    @Test
    @DisplayName("generateToken — retourne un token non null")
    void generateToken_ReturnsNonNullToken() {
        String token = jwtService.generateToken(adminUser);
        assertThat(token).isNotNull().isNotEmpty();
    }

    @Test
    @DisplayName("generateToken — token contient 3 parties JWT")
    void generateToken_HasThreeJwtParts() {
        String token = jwtService.generateToken(adminUser);
        String[] parts = token.split("\\.");
        assertThat(parts).hasSize(3);
    }

    @Test
    @DisplayName("extractUsername — retourne l'email correct")
    void extractUsername_ReturnsCorrectEmail() {
        String token = jwtService.generateToken(adminUser);
        String username = jwtService.extractUsername(token);
        assertThat(username).isEqualTo("hatim@emsi.ma");
    }

    @Test
    @DisplayName("isTokenValid — token valide retourne true")
    void isTokenValid_ValidToken_ReturnsTrue() {
        String token = jwtService.generateToken(adminUser);
        boolean valid = jwtService.isTokenValid(token, adminUser);
        assertThat(valid).isTrue();
    }

    @Test
    @DisplayName("isTokenValid — mauvais utilisateur retourne false")
    void isTokenValid_WrongUser_ReturnsFalse() {
        String token = jwtService.generateToken(adminUser);

        Admin otherUser = new Admin();
        otherUser.setEmail("other@emsi.ma");
        otherUser.setPassword("$2a$10$other");
        otherUser.setRole(Role.ADMIN);
        otherUser.setActif(true);
        otherUser.setEmailVerified(true);

        boolean valid = jwtService.isTokenValid(token, otherUser);
        assertThat(valid).isFalse();
    }

    @Test
    @DisplayName("isTokenValid — token expiré retourne false")
    void isTokenValid_ExpiredToken_ReturnsFalse() {
        // Token avec expiration = 0ms (déjà expiré)
        ReflectionTestUtils.setField(jwtService, "expiration", 0L);
        String expiredToken = jwtService.generateToken(adminUser);

        assertThatThrownBy(() -> jwtService.isTokenValid(expiredToken, adminUser))
                .isInstanceOf(Exception.class);
    }

    @Test
    @DisplayName("Deux tokens générés sont différents")
    void generateToken_TwoTokensAreDifferent() {
        String token1 = jwtService.generateToken(adminUser);

        // Petit délai pour que iat soit différent
        try { Thread.sleep(1000); } catch (InterruptedException e) { e.printStackTrace(); }

        String token2 = jwtService.generateToken(adminUser);
        assertThat(token1).isNotEqualTo(token2);
    }
}