package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.response.AbonnementResponseDTO;
import ma.emsi.gare.dto.response.LigneAbonnementDisponibleDTO;
import ma.emsi.gare.entity.Abonnement;
import ma.emsi.gare.entity.Ligne;
import ma.emsi.gare.entity.Voyageur;
import ma.emsi.gare.repository.AbonnementRepository;
import ma.emsi.gare.repository.LigneRepository;
import ma.emsi.gare.repository.VoyageurRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AbonnementService {

    private final AbonnementRepository abonnementRepository;
    private final VoyageurRepository voyageurRepository;
    private final LigneRepository ligneRepository;

    @Transactional
    public AbonnementResponseDTO souscrire(Long voyageurId, Long ligneId) {
        Voyageur voyageur = voyageurRepository.findById(voyageurId)
                .orElseThrow(() -> new RuntimeException("Voyageur non trouvé"));
        Ligne ligne = ligneRepository.findById(ligneId)
                .orElseThrow(() -> new RuntimeException("Ligne non trouvée"));

        if (abonnementRepository.existsByVoyageurIdAndLigneIdAndActifTrue(voyageurId, ligneId)) {
            throw new RuntimeException("Vous avez déjà un abonnement actif sur cette ligne");
        }

        double prixMensuel = ligne.getPrixAbonnementMensuel() != null
                ? ligne.getPrixAbonnementMensuel()
                : ligne.getPrixBase() * 8;

        Abonnement abonnement = new Abonnement();
        abonnement.setVoyageur(voyageur);
        abonnement.setLigne(ligne);
        abonnement.setDateDebut(LocalDate.now());
        abonnement.setDateFin(LocalDate.now().plusMonths(1));
        abonnement.setPrixMensuel(prixMensuel);
        abonnement.setRenouvellementAuto(false);
        abonnement = abonnementRepository.save(abonnement);

        return toDto(abonnement);
    }

    public List<AbonnementResponseDTO> mesAbonnements(Long voyageurId) {
        return abonnementRepository.findByVoyageurId(voyageurId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public void resilier(Long abonnementId, Long voyageurId) {
        Abonnement abonnement = abonnementRepository.findById(abonnementId)
                .orElseThrow(() -> new RuntimeException("Abonnement non trouvé"));
        if (!abonnement.getVoyageur().getId().equals(voyageurId)) {
            throw new RuntimeException("Cet abonnement ne vous appartient pas");
        }
        abonnement.setActif(false);
        abonnementRepository.save(abonnement);
    }

    @Transactional
    public void toggleRenouvellementAuto(Long abonnementId, Long voyageurId) {
        Abonnement abonnement = abonnementRepository.findById(abonnementId)
                .orElseThrow(() -> new RuntimeException("Abonnement non trouvé"));
        if (!abonnement.getVoyageur().getId().equals(voyageurId)) {
            throw new RuntimeException("Cet abonnement ne vous appartient pas");
        }
        abonnement.setRenouvellementAuto(!abonnement.isRenouvellementAuto());
        abonnementRepository.save(abonnement);
    }

    public List<LigneAbonnementDisponibleDTO> getLignesDisponibles() {
        return ligneRepository.findByActifTrue().stream()
                .filter(l -> l.getPrixAbonnementMensuel() != null)
                .map(l -> {
                    LigneAbonnementDisponibleDTO dto = new LigneAbonnementDisponibleDTO();
                    dto.setId(l.getId());
                    dto.setVilleDepart(l.getVilleDepart());
                    dto.setVilleArrivee(l.getVilleArrivee());
                    dto.setPrixAbonnementMensuel(l.getPrixAbonnementMensuel());
                    dto.setCompagnieNom(l.getCompagnie().getNom());
                    return dto;
                })
                .toList();
    }

    private AbonnementResponseDTO toDto(Abonnement a) {
        AbonnementResponseDTO dto = new AbonnementResponseDTO();
        dto.setId(a.getId());
        dto.setLigneId(a.getLigne().getId());
        dto.setVilleDepart(a.getLigne().getVilleDepart());
        dto.setVilleArrivee(a.getLigne().getVilleArrivee());
        dto.setDateDebut(a.getDateDebut());
        dto.setDateFin(a.getDateFin());
        dto.setPrixMensuel(a.getPrixMensuel());
        dto.setActif(a.isActif());
        dto.setRenouvellementAuto(a.isRenouvellementAuto());
        dto.setDateCreation(a.getDateCreation());
        return dto;
    }
}
