package ma.emsi.gare.repository;

import ma.emsi.gare.entity.Admin;
import ma.emsi.gare.entity.User;
import ma.emsi.gare.entity.Voyageur;
import ma.emsi.gare.enums.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
@DisplayName("UserRepository — Tests d'intégration JPA")
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    private Admin admin;
    private Voyageur voyageur;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        admin = new Admin();
        admin.setNom("KOUBRI");
        admin.setPrenom("Hatim");
        admin.setEmail("hatim@emsi.ma");
        admin.setPassword("$2a$10$hashedpwd");
        admin.setRole(Role.ADMIN);
        admin.setEmailVerified(true);
        admin.setActif(true);

        voyageur = new Voyageur();
        voyageur.setNom("LAYHI");
        voyageur.setPrenom("Rayan");
        voyageur.setEmail("rayan@emsi.ma");
        voyageur.setPassword("$2a$10$hashedpwd2");
        voyageur.setRole(Role.VOYAGEUR);
        voyageur.setEmailVerified(true);
        voyageur.setActif(true);
    }

    @Test
    @DisplayName("Save + findByEmail — Admin trouvé")
    void findByEmail_AdminExists_ReturnsAdmin() {
        userRepository.save(admin);

        Optional<User> found = userRepository.findByEmail("hatim@emsi.ma");

        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("hatim@emsi.ma");
        assertThat(found.get().getRole()).isEqualTo(Role.ADMIN);
    }

    @Test
    @DisplayName("findByEmail — email inexistant → empty")
    void findByEmail_NotExists_ReturnsEmpty() {
        Optional<User> found = userRepository.findByEmail("nobody@emsi.ma");
        assertThat(found).isEmpty();
    }

    @Test
    @DisplayName("existsByEmail — email existant → true")
    void existsByEmail_Exists_ReturnsTrue() {
        userRepository.save(admin);
        assertThat(userRepository.existsByEmail("hatim@emsi.ma")).isTrue();
    }

    @Test
    @DisplayName("existsByEmail — email inexistant → false")
    void existsByEmail_NotExists_ReturnsFalse() {
        assertThat(userRepository.existsByEmail("nobody@emsi.ma")).isFalse();
    }

    @Test
    @DisplayName("Save Voyageur — rôle correct en base")
    void save_Voyageur_CorrectRole() {
        userRepository.save(voyageur);

        Optional<User> found = userRepository.findByEmail("rayan@emsi.ma");
        assertThat(found).isPresent();
        assertThat(found.get().getRole()).isEqualTo(Role.VOYAGEUR);
    }

    @Test
    @DisplayName("Email unique — double save → exception")
    void save_DuplicateEmail_ThrowsException() {
        userRepository.save(admin);

        Admin duplicate = new Admin();
        duplicate.setNom("Autre");
        duplicate.setPrenom("User");
        duplicate.setEmail("hatim@emsi.ma"); // même email
        duplicate.setPassword("$2a$10$other");
        duplicate.setRole(Role.ADMIN);
        duplicate.setEmailVerified(true);
        duplicate.setActif(true);

        assertThatThrownBy(() -> userRepository.saveAndFlush(duplicate))
                .isInstanceOf(Exception.class);
    }
}