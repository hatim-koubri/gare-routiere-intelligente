package ma.emsi.gare.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.emsi.gare.dto.request.PaiementRequest;
import ma.emsi.gare.dto.response.PaiementResponseDTO;
import ma.emsi.gare.entity.*;
import ma.emsi.gare.enums.StatutReservation;
import ma.emsi.gare.enums.TypeNotification;
import ma.emsi.gare.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaiementService {

    private final PaiementRepository paiementRepository;
    private final ReservationRepository reservationRepository;
    private final SiegeRepository siegeRepository;
    private final TicketRepository ticketRepository;
    private final PdfService pdfService;
    private final EmailService emailService;
    private final MembreGroupeRepository membreGroupeRepository;
    private final GroupeVoyageRepository groupeVoyageRepository;
    private final NotificationOfflineService notificationOfflineService;
    private final WebSocketNotificationService webSocketNotificationService;

    @Transactional
    public PaiementResponseDTO simulerPaiement(PaiementRequest request) {

        Reservation reservation = reservationRepository.findById(request.getReservationId())
                .orElseThrow(() -> new IllegalStateException("Réservation introuvable"));

        if (reservation.getStatut() == StatutReservation.CONFIRMEE) {
            throw new IllegalStateException("Réservation déjà payée");
        }

        if (reservation.getStatut() != StatutReservation.EN_ATTENTE) {
            throw new IllegalStateException("Cette réservation n'est plus en attente de paiement");
        }

        var sieges = siegeRepository.findByTrajetId(reservation.getTrajet().getId());

        var siegesReservation = sieges.stream()
                .filter(s -> s.isVerrouilleTemporaire()
                        && request.getReservationId().equals(s.getVerrouilleParReservationId()))
                .toList();

        if (siegesReservation.isEmpty()) {
            siegesReservation = sieges.stream()
                    .filter(s -> !s.isOccupe() && !s.isBloque())
                    .limit(sieges.size())
                    .toList();

            if (siegesReservation.isEmpty()) {
                throw new IllegalStateException("Les sièges ne sont plus disponibles. Veuillez refaire une réservation.");
            }

            LocalDateTime now = LocalDateTime.now();
            for (Siege s : siegesReservation) {
                s.setVerrouilleTemporaire(true);
                s.setVerrouilleParReservationId(request.getReservationId());
                s.setVerrouilleAt(now);
                siegeRepository.save(s);
            }
        }

        Paiement paiement = new Paiement();
        paiement.setReservation(reservation);
        paiement.setMontant(reservation.getPrixTotal());
        paiement.setMethodePaiement(request.getMethodePaiement());
        paiement.setTransactionId(UUID.randomUUID().toString());
        paiement.setDatePaiement(LocalDateTime.now());
        paiement.setConfirme(true);

        Paiement savedPaiement = paiementRepository.save(paiement);

        reservation.setStatut(StatutReservation.CONFIRMEE);
        reservationRepository.save(reservation);

        GroupeVoyage groupe = groupeVoyageRepository.findByReservationId(reservation.getId())
                .orElseThrow(() -> new IllegalStateException("Groupe voyage introuvable"));

        var membres = membreGroupeRepository.findByGroupeId(groupe.getId());

        for (int i = 0; i < siegesReservation.size() && i < membres.size(); i++) {
            Siege s = siegesReservation.get(i);
            MembreGroupe membre = membres.get(i);
            s.setOccupe(true);
            s.setVerrouilleTemporaire(false);
            s.setVerrouilleParReservationId(null);
            s.setVerrouilleAt(null);
            s.setGenreOccupant(membre.getSexe());
            s.setEnfantSurGenoux(membre.isEnfantSurGenoux());
            siegeRepository.save(s);
        }

        for (int i = 0; i < membres.size(); i++) {

            MembreGroupe membre = membres.get(i);

            String qrCode = UUID.randomUUID().toString();
            String numeroSiege = i < siegesReservation.size()
                    ? siegesReservation.get(i).getNumeroSiege()
                    : null;

            Ticket ticket = new Ticket();
            ticket.setReservation(reservation);
            ticket.setQrCode(qrCode);
            ticket.setNomPassager(membre.getNomManuel());
            ticket.setPrenomPassager(membre.getPrenomManuel());
            ticket.setCategorieTarifaire(membre.getCategorieTarifaire());
            ticket.setNumeroSiege(numeroSiege);
            ticket.setPrix(membre.getPrixMembre());
            ticket.setEnfantSurGenoux(membre.isEnfantSurGenoux());

            Ticket savedTicket = ticketRepository.save(ticket);

            membre.setTicket(savedTicket);
            membre.setSiegeAttribue(numeroSiege);
            membreGroupeRepository.save(membre);

            byte[] pdf = pdfService.genererTicket(
                    membre.getNomManuel(),
                    membre.getPrenomManuel(),
                    reservation.getTrajet().getLigne().getVilleDepart()
                            + " → " +
                            reservation.getTrajet().getLigne().getVilleArrivee(),
                    numeroSiege,
                    qrCode
            );

            emailService.envoyerTicket(
                    reservation.getVoyageur().getEmail(),
                    pdf
            );


        }

        envoyerNotificationConfirmation(reservation);

        PaiementResponseDTO dto = new PaiementResponseDTO();
        dto.setPaiementId(savedPaiement.getId());
        dto.setReservationId(reservation.getId());
        dto.setMontant(savedPaiement.getMontant());
        dto.setMethodePaiement(savedPaiement.getMethodePaiement());
        dto.setTransactionId(savedPaiement.getTransactionId());
        dto.setDatePaiement(savedPaiement.getDatePaiement());
        dto.setConfirme(savedPaiement.isConfirme());
        dto.setStatutReservation(reservation.getStatut().name());

        return dto;
    }

    private void envoyerNotificationConfirmation(Reservation reservation) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("trajetId", reservation.getTrajet().getId());
            payload.put("reservationId", reservation.getId());
            payload.put("villeDepart", reservation.getTrajet().getLigne().getVilleDepart());
            payload.put("villeArrivee", reservation.getTrajet().getLigne().getVilleArrivee());
            payload.put("dateDepart", reservation.getTrajet().getDateDepart().toString());
            if (reservation.getTrajet().getDateArriveePrevue() != null) {
                payload.put("dateArriveePrevue", reservation.getTrajet().getDateArriveePrevue().toString());
            }
            payload.put("compagnieNom", reservation.getTrajet().getLigne().getCompagnie().getNom());
            if (reservation.getTrajet().getQuai() != null) {
                payload.put("quaiNumero", reservation.getTrajet().getQuai().getNumero());
            }
            if (reservation.getTrajet().getBus() != null) {
                payload.put("busMatricule", reservation.getTrajet().getBus().getMatricule());
            }

            String payloadJson = new ObjectMapper().writeValueAsString(payload);
            String message = "Votre réservation #" + reservation.getId()
                    + " a été confirmée ! Présentez-vous 30 min avant le départ au quai indiqué.";

            notificationOfflineService.creerNotification(
                    reservation.getVoyageur().getEmail(),
                    TypeNotification.CONFIRMATION_RESERVATION,
                    message,
                    payloadJson
            );
            webSocketNotificationService.notifierVoyageur(
                    reservation.getVoyageur().getEmail(),
                    TypeNotification.CONFIRMATION_RESERVATION.name(),
                    message
            );
        } catch (Exception e) {
            log.error("Erreur envoi notification confirmation réservation #{}", reservation.getId(), e);
        }
    }
}