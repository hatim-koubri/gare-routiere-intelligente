package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.ArretRequest;
import ma.emsi.gare.dto.request.LigneRequest;
import ma.emsi.gare.entity.Arret;
import ma.emsi.gare.entity.Compagnie;
import ma.emsi.gare.entity.Ligne;
import ma.emsi.gare.repository.ArretRepository;
import ma.emsi.gare.repository.CompagnieRepository;
import ma.emsi.gare.repository.LigneRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminLigneService {

    private final LigneRepository ligneRepository;
    private final ArretRepository arretRepository;
    private final CompagnieRepository compagnieRepository;

    @Transactional
    public Ligne creerLigne(LigneRequest request) {
        Compagnie compagnie = compagnieRepository
                .findById(request.getCompagnieId())
                .orElseThrow(() -> new RuntimeException("Compagnie non trouvée"));

        Ligne ligne = new Ligne();
        ligne.setVilleDepart(request.getVilleDepart());
        ligne.setVilleArrivee(request.getVilleArrivee());
        ligne.setDureeMinutes(request.getDureeMinutes());
        ligne.setPrixBase(request.getPrixBase());
        ligne.setCompagnie(compagnie);
        ligne.setActif(true);
        Ligne savedLigne = ligneRepository.save(ligne);

        // Créer les arrêts si fournis
        if (request.getArrets() != null) {
            sauvegarderArrets(savedLigne, request.getArrets());
        }
        return savedLigne;
    }

    @Transactional
    public Ligne modifierLigne(Long id, LigneRequest request) {
        Ligne ligne = ligneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ligne non trouvée"));

        ligne.setVilleDepart(request.getVilleDepart());
        ligne.setVilleArrivee(request.getVilleArrivee());
        ligne.setDureeMinutes(request.getDureeMinutes());
        ligne.setPrixBase(request.getPrixBase());
        Ligne savedLigne = ligneRepository.save(ligne);

        // Remplacer les arrêts
        if (request.getArrets() != null) {
            arretRepository.deleteByLigneId(id);
            sauvegarderArrets(savedLigne, request.getArrets());
        }
        return savedLigne;
    }

    public void supprimerLigne(Long id) {
        Ligne ligne = ligneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ligne non trouvée"));
        ligne.setActif(false);
        ligneRepository.save(ligne);
    }

    public List<Ligne> getLignesParCompagnie(Long compagnieId) {
        return ligneRepository.findByCompagnieId(compagnieId);
    }

    public List<Ligne> getToutesLesLignes() {
        return ligneRepository.findByActifTrue();
    }

    public List<Arret> getArretsParLigne(Long ligneId) {
        return arretRepository.findByLigneIdOrderByOrdreAsc(ligneId);
    }

    private void sauvegarderArrets(Ligne ligne, List<ArretRequest> arretsRequest) {
        List<Arret> arrets = arretsRequest.stream().map(req -> {
            Arret arret = new Arret();
            arret.setVille(req.getVille());
            arret.setOrdre(req.getOrdre());
            arret.setDureePauseMinutes(req.getDureePauseMinutes());
            arret.setHeurePrevueOffsetMinutes(req.getHeurePrevueOffsetMinutes());
            arret.setLigne(ligne);
            return arret;
        }).toList();
        arretRepository.saveAll(arrets);
    }
}