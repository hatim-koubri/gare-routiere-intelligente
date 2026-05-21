package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.CreerReclamationRequest;
import ma.emsi.gare.dto.response.ReclamationResponseDTO;
import ma.emsi.gare.entity.Bagage;
import ma.emsi.gare.entity.Compagnie;
import ma.emsi.gare.entity.Reclamation;
import ma.emsi.gare.entity.Reservation;
import ma.emsi.gare.entity.Voyageur;
import ma.emsi.gare.enums.StatutTicket;
import ma.emsi.gare.enums.TypeReclamation;
import ma.emsi.gare.repository.BagageRepository;
import ma.emsi.gare.repository.CompagnieRepository;
import ma.emsi.gare.repository.ReclamationRepository;
import ma.emsi.gare.repository.ReservationRepository;
import ma.emsi.gare.repository.TicketRepository;
import ma.emsi.gare.repository.VoyageurRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class VoyageurReclamationService {

    private final ReclamationRepository reclamationRepository;
    private final VoyageurRepository voyageurRepository;
    private final ReservationRepository reservationRepository;
    private final TicketRepository ticketRepository;
    private final BagageRepository bagageRepository;
    private final CompagnieRepository compagnieRepository;
    private final WebSocketNotificationService webSocketNotificationService;
    private final ResponsableNotificationHelper responsableNotificationHelper;

    @Transactional
    public ReclamationResponseDTO creer(Long voyageurId, CreerReclamationRequest request) {
        Voyageur voyageur = voyageurRepository.findById(voyageurId)
                .orElseThrow(() -> new IllegalArgumentException("Voyageur introuvable"));

        boolean isServiceOuAutre = request.getType() == TypeReclamation.SERVICE_CLIENT
                || request.getType() == TypeReclamation.AUTRE;

        Reservation reservation = null;
        if (request.getReservationId() != null) {
            reservation = reservationRepository.findById(request.getReservationId())
                    .orElseThrow(() -> new IllegalArgumentException("Réservation introuvable"));

            boolean isBagageClaim = request.getType() == TypeReclamation.BAGAGE_PERDU
                    || request.getType() == TypeReclamation.BAGAGE_ENDOMMAGE;

            if (!isBagageClaim && !isServiceOuAutre) {
                boolean aTicketUtilise = ticketRepository.findByReservationId(reservation.getId())
                        .stream().anyMatch(t -> t.getStatut() == StatutTicket.UTILISE);
                if (!aTicketUtilise) {
                    throw new IllegalStateException(
                            "Vous devez avoir voyagé pour faire une réclamation (ticket scanné par le chauffeur)");
                }
            }
        }

        Compagnie compagnie = null;
        if (isServiceOuAutre && request.getCompagnieId() != null) {
            compagnie = compagnieRepository.findById(request.getCompagnieId())
                    .orElseThrow(() -> new IllegalArgumentException("Compagnie introuvable"));
        }

        if (request.getCodeBagage() != null && !request.getCodeBagage().isBlank()) {
            Bagage bagage = bagageRepository.findByQrCodeBagage(request.getCodeBagage())
                    .orElseThrow(() -> new IllegalArgumentException("Bagage introuvable avec ce code QR"));

            boolean estPerdu = request.getType() == TypeReclamation.BAGAGE_PERDU;
            bagage.setPerdu(estPerdu);
            bagage.setEndommage(!estPerdu);
            bagageRepository.save(bagage);

            if (reservation == null && bagage.getReservation() != null) {
                reservation = bagage.getReservation();
            }
        }

        Reclamation reclamation = new Reclamation();
        reclamation.setType(request.getType());
        reclamation.setSujet(request.getSujet());
        reclamation.setDescription(request.getDescription());
        reclamation.setVoyageur(voyageur);
        reclamation.setReservation(reservation);
        reclamation.setCompagnie(compagnie);

        reclamation = reclamationRepository.save(reclamation);

        // Notifier les admins via WebSocket
        webSocketNotificationService.notifierAdmins("NOUVELLE_RECLAMATION", Map.of(
                "id", reclamation.getId(),
                "type", reclamation.getType(),
                "sujet", reclamation.getSujet(),
                "voyageurNom", voyageur.getNom() + " " + voyageur.getPrenom(),
                "dateCreation", reclamation.getDateCreation().toString()
        ));

        // Notifier les responsables de la compagnie
        if (compagnie != null) {
            Map<String, Object> notifData = new java.util.HashMap<>();
            notifData.put("id", reclamation.getId());
            notifData.put("type", reclamation.getType().name());
            notifData.put("sujet", reclamation.getSujet());
            notifData.put("voyageurNom", voyageur.getNom() + " " + voyageur.getPrenom());
            notifData.put("dateCreation", reclamation.getDateCreation().toString());
            if (reservation != null) {
                notifData.put("trajetInfo", reservation.getTrajet().getLigne().getVilleDepart()
                        + " → " + reservation.getTrajet().getLigne().getVilleArrivee());
            }
            responsableNotificationHelper.notifierResponsables(
                    compagnie.getId(), "NOUVELLE_RECLAMATION", ma.emsi.gare.enums.TypeNotification.NOUVELLE_RECLAMATION,
                    "📝 Nouvelle réclamation — " + reclamation.getSujet() + " par " + voyageur.getPrenom() + " " + voyageur.getNom(),
                    notifData
            );
        }

        return toDTO(reclamation);
    }

    public List<ReclamationResponseDTO> mesReclamations(Long voyageurId) {
        return reclamationRepository.findByVoyageurIdOrderByDateCreationDesc(voyageurId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public ReclamationResponseDTO getById(Long id, Long voyageurId) {
        Reclamation reclamation = reclamationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Réclamation introuvable"));
        if (!reclamation.getVoyageur().getId().equals(voyageurId)) {
            throw new IllegalStateException("Accès non autorisé à cette réclamation");
        }
        return toDTO(reclamation);
    }

    private ReclamationResponseDTO toDTO(Reclamation r) {
        ReclamationResponseDTO dto = new ReclamationResponseDTO();
        dto.setId(r.getId());
        dto.setType(r.getType());
        dto.setSujet(r.getSujet());
        dto.setDescription(r.getDescription());
        dto.setStatut(r.getStatut());
        dto.setReponseResponsable(r.getReponseResponsable());
        dto.setDateCreation(r.getDateCreation());
        dto.setVoyageurId(r.getVoyageur().getId());
        dto.setVoyageurNom(r.getVoyageur().getNom());
        dto.setVoyageurPrenom(r.getVoyageur().getPrenom());
        if (r.getReservation() != null) {
            dto.setReservationId(r.getReservation().getId());
            dto.setTrajetInfo(r.getReservation().getTrajet().getLigne().getVilleDepart()
                    + " → " + r.getReservation().getTrajet().getLigne().getVilleArrivee());
        }
        if (r.getCompagnie() != null) {
            dto.setCompagnieId(r.getCompagnie().getId());
            dto.setCompagnieNom(r.getCompagnie().getNom());
        }
        return dto;
    }
}
