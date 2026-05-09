package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.response.AvisResponseDTO;
import ma.emsi.gare.entity.*;
import ma.emsi.gare.enums.StatutTicket;
import ma.emsi.gare.repository.AvisRepository;
import ma.emsi.gare.repository.CompagnieRepository;
import ma.emsi.gare.repository.TicketRepository;
import ma.emsi.gare.repository.TrajetRepository;
import ma.emsi.gare.repository.VoyageurRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AvisService {

    private final AvisRepository avisRepository;
    private final TrajetRepository trajetRepository;
    private final VoyageurRepository voyageurRepository;
    private final CompagnieRepository compagnieRepository;
    private final TicketRepository ticketRepository;

    @Transactional
    public AvisResponseDTO ajouterAvis(Long voyageurId, Long trajetId,
            Integer notePonctualite, Integer noteConfort,
            Integer noteChauffeur, String commentaire) {

        Voyageur voyageur = voyageurRepository.findById(voyageurId)
                .orElseThrow(() -> new RuntimeException("Voyageur non trouvé"));
        Trajet trajet = trajetRepository.findById(trajetId)
                .orElseThrow(() -> new RuntimeException("Trajet non trouvé"));

        // Vérifier que le voyageur a un ticket UTILISÉ pour ce trajet
        List<Ticket> ticketsUtilises = ticketRepository.findByVoyageurIdAndStatut(voyageurId, StatutTicket.UTILISE);
        boolean aVoyage = ticketsUtilises.stream()
                .anyMatch(t -> t.getReservation().getTrajet().getId().equals(trajetId));
        if (!aVoyage) {
            throw new RuntimeException("Vous ne pouvez laisser un avis que pour un trajet où vous avez voyagé (ticket validé par le chauffeur).");
        }

        // Vérifier que le voyageur n'a pas déjà laissé un avis pour ce trajet
        if (avisRepository.existsByVoyageurIdAndTrajetId(voyageurId, trajetId)) {
            throw new RuntimeException("Vous avez déjà laissé un avis pour ce trajet.");
        }

        Avis avis = new Avis();
        avis.setVoyageur(voyageur);
        avis.setTrajet(trajet);
        avis.setNotePonctualite(notePonctualite);
        avis.setNoteConfort(noteConfort);
        avis.setNoteChauffeur(noteChauffeur);
        avis.setCommentaire(commentaire);
        avis = avisRepository.save(avis);

        recalculerNoteCompagnie(trajet.getBus().getCompagnie().getId());

        return toDto(avis);
    }

    public List<AvisResponseDTO> getAvisByCompagnie(Long compagnieId) {
        return avisRepository.findByTrajetBusCompagnieIdOrderByDateAvisDesc(compagnieId)
                .stream().map(this::toDto).toList();
    }

    public List<AvisResponseDTO> getAvisByTrajet(Long trajetId) {
        return avisRepository.findByTrajetIdOrderByDateAvisDesc(trajetId)
                .stream().map(this::toDto).toList();
    }

    public List<AvisResponseDTO> getMesAvis(Long voyageurId) {
        return avisRepository.findByVoyageurIdOrderByDateAvisDesc(voyageurId)
                .stream().map(this::toDto).toList();
    }

    public List<Map<String, Object>> getTrajetsEligibles(Long voyageurId) {
        List<Ticket> ticketsUtilises = ticketRepository.findByVoyageurIdAndStatut(voyageurId, StatutTicket.UTILISE);

        return ticketsUtilises.stream()
                .map(Ticket::getReservation)
                .map(Reservation::getTrajet)
                .distinct()
                .filter(trajet -> !avisRepository.existsByVoyageurIdAndTrajetId(voyageurId, trajet.getId()))
                .map(trajet -> Map.<String, Object>of(
                        "trajetId", trajet.getId(),
                        "villeDepart", trajet.getLigne().getVilleDepart(),
                        "villeArrivee", trajet.getLigne().getVilleArrivee(),
                        "dateDepart", trajet.getDateDepart() != null ? trajet.getDateDepart().toString() : null,
                        "compagnieNom", trajet.getBus().getCompagnie().getNom(),
                        "busMatricule", trajet.getBus().getMatricule()
                ))
                .toList();
    }

    @Transactional
    public void recalculerNoteCompagnie(Long compagnieId) {
        Compagnie compagnie = compagnieRepository.findById(compagnieId)
                .orElseThrow(() -> new RuntimeException("Compagnie non trouvée"));
        Double moyenne = avisRepository.avgNoteByCompagnieId(compagnieId);
        Long nbAvis = avisRepository.countByCompagnieId(compagnieId);
        compagnie.setNoteMoyenne(moyenne != null ? Math.round(moyenne * 10.0) / 10.0 : 0.0);
        compagnie.setNbAvis(nbAvis != null ? nbAvis.intValue() : 0);
        compagnieRepository.save(compagnie);
    }

    private AvisResponseDTO toDto(Avis avis) {
        AvisResponseDTO dto = new AvisResponseDTO();
        dto.setId(avis.getId());
        dto.setVoyageurId(avis.getVoyageur().getId());
        dto.setVoyageurNom(avis.getVoyageur().getNom());
        dto.setVoyageurPrenom(avis.getVoyageur().getPrenom());
        dto.setTrajetId(avis.getTrajet().getId());
        dto.setNotePonctualite(avis.getNotePonctualite());
        dto.setNoteConfort(avis.getNoteConfort());
        dto.setNoteChauffeur(avis.getNoteChauffeur());
        dto.setCommentaire(avis.getCommentaire());
        dto.setDateAvis(avis.getDateAvis());
        dto.setCompagnieId(avis.getTrajet().getBus().getCompagnie().getId());
        dto.setCompagnieNom(avis.getTrajet().getBus().getCompagnie().getNom());
        dto.setVilleDepart(avis.getTrajet().getLigne().getVilleDepart());
        dto.setVilleArrivee(avis.getTrajet().getLigne().getVilleArrivee());
        dto.setDateDepart(avis.getTrajet().getDateDepart() != null ? avis.getTrajet().getDateDepart().toString() : null);
        return dto;
    }
}
