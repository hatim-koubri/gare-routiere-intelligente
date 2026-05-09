package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.entity.Favori;
import ma.emsi.gare.entity.Ligne;
import ma.emsi.gare.entity.Voyageur;
import ma.emsi.gare.repository.FavoriRepository;
import ma.emsi.gare.repository.LigneRepository;
import ma.emsi.gare.repository.VoyageurRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FavoriService {

    private final FavoriRepository favoriRepository;
    private final VoyageurRepository voyageurRepository;
    private final LigneRepository ligneRepository;

    public List<Map<String, Object>> getFavoris(Long voyageurId) {
        return favoriRepository.findByVoyageurIdOrderByDateCreationDesc(voyageurId)
                .stream().map(f -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", f.getId());
                    map.put("ligneId", f.getLigne().getId());
                    map.put("villeDepart", f.getLigne().getVilleDepart());
                    map.put("villeArrivee", f.getLigne().getVilleArrivee());
                    map.put("prixBase", f.getLigne().getPrixBase());
                    map.put("compagnieNom", f.getLigne().getCompagnie().getNom());
                    map.put("compagnieId", f.getLigne().getCompagnie().getId());
                    map.put("dateCreation", f.getDateCreation());
                    return map;
                }).collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> ajouterFavori(Long voyageurId, Long ligneId) {
        Voyageur voyageur = voyageurRepository.findById(voyageurId)
                .orElseThrow(() -> new RuntimeException("Voyageur non trouvé"));
        Ligne ligne = ligneRepository.findById(ligneId)
                .orElseThrow(() -> new RuntimeException("Ligne non trouvée"));

        if (favoriRepository.existsByVoyageurIdAndLigneId(voyageurId, ligneId)) {
            throw new RuntimeException("Cette ligne est déjà dans vos favoris");
        }

        Favori favori = new Favori();
        favori.setVoyageur(voyageur);
        favori.setLigne(ligne);
        favori = favoriRepository.save(favori);

        Map<String, Object> map = new HashMap<>();
        map.put("id", favori.getId());
        map.put("ligneId", ligne.getId());
        map.put("villeDepart", ligne.getVilleDepart());
        map.put("villeArrivee", ligne.getVilleArrivee());
        map.put("message", "Ligne ajoutée aux favoris");
        return map;
    }

    @Transactional
    public void supprimerFavori(Long voyageurId, Long ligneId) {
        if (!favoriRepository.existsByVoyageurIdAndLigneId(voyageurId, ligneId)) {
            throw new RuntimeException("Cette ligne n'est pas dans vos favoris");
        }
        favoriRepository.deleteByVoyageurIdAndLigneId(voyageurId, ligneId);
    }
}
