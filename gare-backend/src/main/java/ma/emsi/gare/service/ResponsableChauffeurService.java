package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.ChauffeurCreateRequest;
import ma.emsi.gare.entity.Chauffeur;
import ma.emsi.gare.entity.Compagnie;
import ma.emsi.gare.entity.ResponsableCompagnie;
import ma.emsi.gare.enums.Role;
import ma.emsi.gare.repository.ChauffeurRepository;
import ma.emsi.gare.repository.CompagnieRepository;
import ma.emsi.gare.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ResponsableChauffeurService {

    private final ChauffeurRepository chauffeurRepository;
    private final UserRepository userRepository;
    private final CompagnieRepository compagnieRepository;
    private final PasswordEncoder passwordEncoder;

    public Chauffeur creer(
            ChauffeurCreateRequest request,
            Authentication authentication
    ) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email déjà utilisé");
        }

        if (chauffeurRepository.existsByNumeroPermis(
                request.getNumeroPermis()
        )) {
            throw new IllegalArgumentException(
                    "Numéro permis déjà utilisé"
            );
        }

        Compagnie compagnie = getCompagnie(authentication);

        Chauffeur chauffeur = new Chauffeur();

        chauffeur.setNom(request.getNom());
        chauffeur.setPrenom(request.getPrenom());
        chauffeur.setEmail(request.getEmail());

        chauffeur.setPassword(
                passwordEncoder.encode(request.getPassword())
        );

        chauffeur.setTelephone(request.getTelephone());

        chauffeur.setRole(Role.CHAUFFEUR);

        chauffeur.setNumeroPermis(request.getNumeroPermis());
        chauffeur.setDateEmbauche(request.getDateEmbauche());

        chauffeur.setCompagnie(compagnie);

        chauffeur.setEmailVerified(true);
        chauffeur.setActif(true);

        return chauffeurRepository.save(chauffeur);
    }

    @Transactional(readOnly = true)
    public List<Chauffeur> getMesChauffeurs(
            Authentication authentication
    ) {

        Compagnie compagnie = getCompagnie(authentication);

        return chauffeurRepository.findByCompagnieId(compagnie.getId());
    }

    private Compagnie getCompagnie(Authentication authentication) {

        Object principal = authentication.getPrincipal();

        if (!(principal instanceof ResponsableCompagnie responsable)) {
            throw new IllegalStateException("Utilisateur invalide");
        }

        Long compagnieId = responsable.getCompagnie().getId();

        return compagnieRepository.findById(compagnieId)
                .orElseThrow(() ->
                        new IllegalStateException("Compagnie introuvable"));
    }
}