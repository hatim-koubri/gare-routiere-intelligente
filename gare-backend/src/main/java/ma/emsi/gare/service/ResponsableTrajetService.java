package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.TrajetRequest;
import ma.emsi.gare.entity.*;
import ma.emsi.gare.enums.StatutTrajet;
import ma.emsi.gare.repository.*;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ResponsableTrajetService {

    private final TrajetRepository trajetRepository;
    private final LigneRepository ligneRepository;
    private final BusRepository busRepository;
    private final ChauffeurRepository chauffeurRepository;
    private final QuaiRepository quaiRepository;
    private final CompagnieRepository compagnieRepository;

    public Trajet creerTrajet(
            TrajetRequest request,
            Authentication authentication
    ) {

        Compagnie compagnie = getCompagnie(authentication);

        Ligne ligne = ligneRepository.findById(request.getLigneId())
                .orElseThrow(() -> new IllegalArgumentException("Ligne introuvable"));

        if (!ligne.getCompagnie().getId().equals(compagnie.getId())) {
            throw new IllegalArgumentException("Cette ligne n'appartient pas à votre compagnie");
        }

        Bus bus = busRepository.findById(request.getBusId())
                .orElseThrow(() -> new IllegalArgumentException("Bus introuvable"));

        if (!bus.getCompagnie().getId().equals(compagnie.getId())) {
            throw new IllegalArgumentException("Ce bus n'appartient pas à votre compagnie");
        }

        Chauffeur chauffeur = null;

        if (request.getChauffeurId() != null) {
            chauffeur = chauffeurRepository.findById(request.getChauffeurId())
                    .orElseThrow(() -> new IllegalArgumentException("Chauffeur introuvable"));
        }

        Quai quai = null;

        if (request.getQuaiId() != null) {
            quai = quaiRepository.findById(request.getQuaiId())
                    .orElseThrow(() -> new IllegalArgumentException("Quai introuvable"));
        }

        Trajet trajet = new Trajet();

        trajet.setLigne(ligne);
        trajet.setBus(bus);
        trajet.setChauffeur(chauffeur);
        trajet.setQuai(quai);

        trajet.setDateDepart(request.getDateDepart());
        trajet.setDateArriveePrevue(request.getDateArriveePrevue());

        trajet.setStatut(StatutTrajet.PLANIFIE);
        trajet.setNbReservations(0);
        trajet.setRetardMinutes(0);

        return trajetRepository.save(trajet);
    }

    @Transactional(readOnly = true)
    public List<Trajet> getMesTrajets(Authentication authentication) {

        Compagnie compagnie = getCompagnie(authentication);

        return trajetRepository.findAll()
                .stream()
                .filter(t -> t.getLigne().getCompagnie().getId().equals(compagnie.getId()))
                .toList();
    }

    @Transactional(readOnly = true)
    public Trajet getTrajetById(Long id, Authentication authentication) {
        Compagnie compagnie = getCompagnie(authentication);
        Trajet trajet = trajetRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Trajet introuvable"));

        if (!trajet.getLigne().getCompagnie().getId().equals(compagnie.getId())) {
            throw new IllegalArgumentException("Ce trajet n'appartient pas à votre compagnie");
        }

        return trajet;
    }

    public Trajet annulerTrajet(Long id, Authentication authentication) {
        Compagnie compagnie = getCompagnie(authentication);
        Trajet trajet = trajetRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Trajet introuvable"));

        if (!trajet.getLigne().getCompagnie().getId().equals(compagnie.getId())) {
            throw new IllegalArgumentException("Ce trajet n'appartient pas à votre compagnie");
        }

        if (trajet.getNbReservations() != null && trajet.getNbReservations() > 0) {
            throw new IllegalStateException(
                    "Impossible d'annuler un trajet avec des réservations actives (" +
                    trajet.getNbReservations() + " réservation(s))"
            );
        }

        trajet.setStatut(StatutTrajet.ANNULE);
        return trajetRepository.save(trajet);
    }

    private Compagnie getCompagnie(Authentication authentication) {

        Object principal = authentication.getPrincipal();

        if (!(principal instanceof ResponsableCompagnie responsable)) {
            throw new IllegalStateException("Utilisateur invalide");
        }

        Long compagnieId = responsable.getCompagnie().getId();

        return compagnieRepository.findById(compagnieId)
                .orElseThrow(() -> new IllegalStateException("Compagnie introuvable"));
    }
}