package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.PaiementRequest;
import ma.emsi.gare.dto.response.PaiementResponseDTO;
import ma.emsi.gare.entity.*;
import ma.emsi.gare.enums.StatutReservation;
import ma.emsi.gare.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

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

    @Transactional
    public PaiementResponseDTO simulerPaiement(PaiementRequest request) {

        Reservation reservation = reservationRepository.findById(request.getReservationId())
                .orElseThrow(() -> new RuntimeException("Reservation introuvable"));

        if (reservation.getStatut() == StatutReservation.CONFIRMEE) {
            throw new RuntimeException("Reservation déjà payée");
        }

        var sieges = siegeRepository.findByTrajetId(reservation.getTrajet().getId());

        var siegesReservation = sieges.stream()
                .filter(s -> s.isVerrouilleTemporaire()
                        && request.getReservationId().equals(s.getVerrouilleParReservationId()))
                .toList();

        if (siegesReservation.isEmpty()) {
            throw new RuntimeException("Aucun siège verrouillé pour cette réservation");
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

        for (Siege s : siegesReservation) {
            s.setOccupe(true);
            s.setVerrouilleTemporaire(false);
            s.setVerrouilleParReservationId(null);
            s.setVerrouilleAt(null);
            siegeRepository.save(s);
        }

        GroupeVoyage groupe = groupeVoyageRepository.findByReservationId(reservation.getId())
                .orElseThrow(() -> new RuntimeException("Groupe voyage introuvable"));

        var membres = membreGroupeRepository.findByGroupeId(groupe.getId());

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
}