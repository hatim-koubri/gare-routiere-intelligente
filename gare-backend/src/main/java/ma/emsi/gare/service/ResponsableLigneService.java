package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.ArretRequest;
import ma.emsi.gare.dto.request.LigneRequest;
import ma.emsi.gare.entity.*;
import ma.emsi.gare.repository.ArretRepository;
import ma.emsi.gare.repository.CompagnieRepository;
import ma.emsi.gare.repository.LigneRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ResponsableLigneService {

    private final LigneRepository ligneRepository;
    private final ArretRepository arretRepository;
    private final CompagnieRepository compagnieRepository;

    public Ligne creerLigne(
            LigneRequest request,
            Authentication authentication
    ) {

        Compagnie compagnie = getCompagnie(authentication);

        Ligne ligne = new Ligne();

        ligne.setVilleDepart(request.getVilleDepart());
        ligne.setVilleArrivee(request.getVilleArrivee());
        ligne.setDureeMinutes(request.getDureeMinutes());
        ligne.setPrixBase(request.getPrixBase());

        ligne.setCompagnie(compagnie);
        ligne.setActif(true);

        Ligne savedLigne = ligneRepository.save(ligne);

        if (request.getArrets() != null) {
            sauvegarderArrets(savedLigne, request.getArrets());
            savedLigne.setArrets(
                    arretRepository.findByLigneIdOrderByOrdreAsc(savedLigne.getId())
            );
        }

        return savedLigne;
    }

    public Ligne modifierLigne(
            Long id,
            LigneRequest request,
            Authentication authentication
    ) {

        Ligne ligne = getLigneResponsable(id, authentication);

        ligne.setVilleDepart(request.getVilleDepart());
        ligne.setVilleArrivee(request.getVilleArrivee());
        ligne.setDureeMinutes(request.getDureeMinutes());
        ligne.setPrixBase(request.getPrixBase());

        Ligne savedLigne = ligneRepository.save(ligne);

        arretRepository.deleteByLigneId(id);

        if (request.getArrets() != null) {
            sauvegarderArrets(savedLigne, request.getArrets());
            savedLigne.setArrets(
                    arretRepository.findByLigneIdOrderByOrdreAsc(savedLigne.getId())
            );
        }

        return savedLigne;
    }

    public Ligne desactiverLigne(
            Long id,
            Authentication authentication
    ) {

        Ligne ligne = getLigneResponsable(id, authentication);

        ligne.setActif(false);

        return ligneRepository.save(ligne);
    }

    public void supprimerLigne(
            Long id,
            Authentication authentication
    ) {

        Ligne ligne = getLigneResponsable(id, authentication);

        ligne.setActif(false);

        ligneRepository.save(ligne);
    }

    @Transactional(readOnly = true)
    public List<Ligne> getMesLignes(Authentication authentication) {

        Compagnie compagnie = getCompagnie(authentication);

        return ligneRepository.findByCompagnieId(compagnie.getId());
    }

    @Transactional(readOnly = true)
    public Ligne getById(
            Long id,
            Authentication authentication
    ) {

        return getLigneResponsable(id, authentication);
    }

    private Ligne getLigneResponsable(
            Long ligneId,
            Authentication authentication
    ) {

        Compagnie compagnie = getCompagnie(authentication);

        Ligne ligne = ligneRepository.findById(ligneId)
                .orElseThrow(() -> new IllegalArgumentException("Ligne introuvable"));

        if (!ligne.getCompagnie().getId().equals(compagnie.getId())) {
            throw new IllegalArgumentException(
                    "Cette ligne n'appartient pas à votre compagnie"
            );
        }

        return ligne;
    }

    private void sauvegarderArrets(
            Ligne ligne,
            List<ArretRequest> arretsRequest
    ) {

        List<Arret> arrets = arretsRequest.stream().map(req -> {

            Arret arret = new Arret();

            arret.setVille(req.getVille());
            arret.setOrdre(req.getOrdre());
            arret.setDureePauseMinutes(req.getDureePauseMinutes());
            arret.setHeurePrevueOffsetMinutes(
                    req.getHeurePrevueOffsetMinutes()
            );

            arret.setLigne(ligne);

            return arret;

        }).toList();

        arretRepository.saveAll(arrets);
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