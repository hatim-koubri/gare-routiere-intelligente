package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.RegisterRequest;
import ma.emsi.gare.dto.request.TrajetRequest;
import ma.emsi.gare.entity.*;
import ma.emsi.gare.enums.Role;
import ma.emsi.gare.enums.StatutTrajet;
import ma.emsi.gare.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminTrajetChauffeurService {

    private final TrajetRepository trajetRepository;
    private final BusRepository busRepository;
    private final ChauffeurRepository chauffeurRepository;
    private final QuaiRepository quaiRepository;
    private final LigneRepository ligneRepository;
    private final UserRepository userRepository;
    private final CompagnieRepository compagnieRepository;
    private final PasswordEncoder passwordEncoder;

    // ===== T2-05 — Trajets =====

    public Trajet creerTrajet(TrajetRequest request) {
        Ligne ligne = ligneRepository.findById(request.getLigneId())
                .orElseThrow(() -> new RuntimeException("Ligne non trouvée"));
        Bus bus = busRepository.findById(request.getBusId())
                .orElseThrow(() -> new RuntimeException("Bus non trouvé"));

        Trajet trajet = new Trajet();
        trajet.setLigne(ligne);
        trajet.setBus(bus);
        trajet.setDateDepart(request.getDateDepart());
        trajet.setDateArriveePrevue(request.getDateArriveePrevue());
        trajet.setStatut(StatutTrajet.PLANIFIE);

        if (request.getChauffeurId() != null) {
            Chauffeur chauffeur = chauffeurRepository
                    .findById(request.getChauffeurId())
                    .orElseThrow(() -> new RuntimeException("Chauffeur non trouvé"));
            trajet.setChauffeur(chauffeur);
        }

        if (request.getQuaiId() != null) {
            Quai quai = quaiRepository.findById(request.getQuaiId())
                    .orElseThrow(() -> new RuntimeException("Quai non trouvé"));
            trajet.setQuai(quai);
        }

        return trajetRepository.save(trajet);
    }

    public Trajet modifierTrajet(Long id, TrajetRequest request) {
        Trajet trajet = trajetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trajet non trouvé"));

        trajet.setDateDepart(request.getDateDepart());
        trajet.setDateArriveePrevue(request.getDateArriveePrevue());
        return trajetRepository.save(trajet);
    }

    public Trajet annulerTrajet(Long id) {
        Trajet trajet = trajetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trajet non trouvé"));
        trajet.setStatut(StatutTrajet.ANNULE);
        return trajetRepository.save(trajet);
    }

    public List<Trajet> getTousLesTrajets() {
        return trajetRepository.findAll();
    }

    // ===== T2-06 — Créer compte chauffeur =====

    public Chauffeur creerChauffeur(RegisterRequest request, Long compagnieId) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email déjà utilisé");
        }

        Compagnie compagnie = compagnieRepository.findById(compagnieId)
                .orElseThrow(() -> new RuntimeException("Compagnie non trouvée"));

        Chauffeur chauffeur = new Chauffeur();
        chauffeur.setNom(request.getNom());
        chauffeur.setPrenom(request.getPrenom());
        chauffeur.setEmail(request.getEmail());
        chauffeur.setPassword(passwordEncoder.encode(request.getPassword()));
        chauffeur.setTelephone(request.getTelephone());
        chauffeur.setRole(Role.CHAUFFEUR);
        chauffeur.setEmailVerified(true);
        chauffeur.setActif(true);
        chauffeur.setCompagnie(compagnie);
        chauffeur.setEnConge(false);

        return (Chauffeur) userRepository.save(chauffeur);
    }

    // ===== T2-07 — Gestion congés =====

    public Chauffeur mettreEnConge(Long chauffeurId) {
        Chauffeur chauffeur = chauffeurRepository.findById(chauffeurId)
                .orElseThrow(() -> new RuntimeException("Chauffeur non trouvé"));
        chauffeur.setEnConge(true);
        return (Chauffeur) userRepository.save(chauffeur);
    }

    public Chauffeur remettreDuConge(Long chauffeurId) {
        Chauffeur chauffeur = chauffeurRepository.findById(chauffeurId)
                .orElseThrow(() -> new RuntimeException("Chauffeur non trouvé"));
        chauffeur.setEnConge(false);
        return (Chauffeur) userRepository.save(chauffeur);
    }

    public List<Chauffeur> getChauffeursDisponibles(Long compagnieId) {
        return chauffeurRepository
                .findByCompagnieIdAndEnCongeFalse(compagnieId);
    }
}