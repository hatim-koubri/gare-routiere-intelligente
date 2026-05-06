package ma.emsi.gare.controller.voyageur;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.ReservationRequest;
import ma.emsi.gare.dto.request.VerrouillageSiegeRequest;
import ma.emsi.gare.dto.request.BagageRequest;
import ma.emsi.gare.dto.response.BagageResponseDTO;
import ma.emsi.gare.dto.response.ReservationResponseDTO;
import ma.emsi.gare.dto.response.SiegeResponseDTO;
import ma.emsi.gare.dto.response.TrajetResponseDTO;
import ma.emsi.gare.dto.response.TicketDTO;
import ma.emsi.gare.entity.Reservation;
import ma.emsi.gare.entity.Ticket;
import ma.emsi.gare.entity.Voyageur;
import ma.emsi.gare.repository.ReservationRepository;
import ma.emsi.gare.repository.TicketRepository;
import ma.emsi.gare.repository.VoyageurRepository;
import ma.emsi.gare.service.EmailService;
import ma.emsi.gare.service.PdfService;
import ma.emsi.gare.service.ReservationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ma.emsi.gare.dto.request.ModificationReservationRequest;
import ma.emsi.gare.dto.request.ChangementSiegeRequest;
import ma.emsi.gare.dto.request.DeclarationBagageRequest;


import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;


@RestController
@RequestMapping("/api/voyageur/reservations")
@RequiredArgsConstructor
public class VoyageurReservationController {

    private final ReservationService reservationService;
    private final ReservationRepository reservationRepository;
    private final VoyageurRepository voyageurRepository;
    private final TicketRepository ticketRepository;
    private final PdfService pdfService;

    private final EmailService emailService;

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @PostMapping
    public ReservationResponseDTO creerReservation(
            @RequestBody ReservationRequest request,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return reservationService.creerReservationParEmail(email, request);
    }

    @GetMapping
    public List<ReservationResponseDTO> getMesReservations(Authentication authentication) {
        String email = authentication.getName();
        Voyageur voyageur = voyageurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Voyageur non trouvé"));

        List<Reservation> reservations = reservationService.getReservationsForVoyageur(voyageur.getId());

        return reservations.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/trajets/{trajetId}/plan-bus")
    public List<SiegeResponseDTO> getPlanBus(@PathVariable Long trajetId) {
        return reservationService.getPlanBus(trajetId);
    }

    @GetMapping("/trajets/{trajetId}/proposition")
    public List<String> proposerSieges(
            @PathVariable Long trajetId,
            @RequestParam int nombrePlaces
    ) {
        return reservationService.proposerSiegesGroupe(trajetId, nombrePlaces);
    }

    @PostMapping("/verrouiller")
    public void verrouillerSieges(@RequestBody VerrouillageSiegeRequest request) {
        reservationService.verrouillerSieges(request);
    }

    @DeleteMapping("/{id}/annuler")
    public double annulerReservation(@PathVariable Long id) {
        return reservationService.annulerReservation(id);
    }

    @PutMapping("/{id}/modifier")
    public ReservationResponseDTO modifierReservation(
            @PathVariable Long id,
            @RequestBody ModificationReservationRequest request
    ) {
        return reservationService.modifierReservation(id, request);
    }

    @PutMapping("/{id}/changer-sieges")
    public ReservationResponseDTO changerSieges(
            @PathVariable Long id,
            @RequestBody ChangementSiegeRequest request
    ) {
        return reservationService.changerSieges(id, request.getNouveauxSieges());
    }

    /**
     * Ajoute des bagages à une réservation existante.
     * Le surplus est calculé automatiquement selon poids + dimensions (volume).
     * POST /api/voyageur/reservations/{id}/bagages
     */
    @PostMapping("/{id}/bagages")
    public ResponseEntity<List<BagageResponseDTO>> ajouterBagages(
            @PathVariable Long id,
            @RequestBody List<BagageRequest> bagageRequests,
            Authentication authentication
    ) {
        String email = authentication.getName();
        Voyageur voyageur = voyageurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Voyageur non trouvé"));

        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réservation non trouvée"));

        if (!reservation.getVoyageur().getId().equals(voyageur.getId())) {
            throw new RuntimeException("Accès non autorisé à cette réservation");
        }

        List<BagageResponseDTO> bagages = reservationService.ajouterBagages(id, bagageRequests);
        return ResponseEntity.ok(bagages);
    }

    @PostMapping("/bagage/declarer")
    public void declarerBagage(@RequestBody DeclarationBagageRequest request) {
        reservationService.declarerBagage(
                request.getQrCodeBagage(),
                request.getType()
        );
    }


    @GetMapping("/test-email")
    public String testEmail() {
        byte[] fakePdf = new byte[0];

        emailService.envoyerTicket("test@mail.com", fakePdf);

        return "Email envoyé (ou tentative)";
    }


    // ✅ Endpoint pour télécharger un ticket en PDF (version mise à jour)
    @GetMapping("/{reservationId}/ticket/{ticketId}")
    public ResponseEntity<byte[]> telechargerTicket(
            @PathVariable Long reservationId,
            @PathVariable Long ticketId,
            Authentication authentication
    ) {
        String email = authentication.getName();

        // Vérifier que le voyageur existe
        Voyageur voyageur = voyageurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Voyageur non trouvé"));

        // Récupérer la réservation
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Réservation non trouvée"));

        // Vérifier que la réservation appartient bien au voyageur
        if (!reservation.getVoyageur().getId().equals(voyageur.getId())) {
            throw new RuntimeException("Accès non autorisé à cette réservation");
        }

        // Récupérer le ticket
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket non trouvé"));

        // Vérifier que le ticket appartient bien à la réservation
        if (!ticket.getReservation().getId().equals(reservationId)) {
            throw new RuntimeException("Ticket non associé à cette réservation");
        }

        // Récupérer les informations supplémentaires pour le ticket stylisé
        String compagnieNom = reservation.getTrajet().getLigne().getCompagnie().getNom();
        String busMatricule = reservation.getTrajet().getBus().getMatricule();
        String heureDepart = reservation.getTrajet().getDateDepart().format(TIME_FORMATTER);
        String dateDepart = reservation.getTrajet().getDateDepart().format(DATE_FORMATTER);
        String villeDepart = reservation.getTrajet().getLigne().getVilleDepart();
        String villeArrivee = reservation.getTrajet().getLigne().getVilleArrivee();
        String trajet = villeDepart + " → " + villeArrivee;

        // Générer le PDF du ticket avec tous les paramètres
        byte[] pdf = pdfService.genererTicket(
                ticket.getNomPassager(),
                ticket.getPrenomPassager(),
                trajet,
                ticket.getNumeroSiege(),
                ticket.getQrCode(),
                compagnieNom,
                busMatricule,
                heureDepart,
                dateDepart,
                villeDepart,
                villeArrivee,
                reservation.getBagages()
        );

        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "attachment; filename=ticket_" + ticketId + ".pdf")
                .body(pdf);
    }

    // Méthode privée pour convertir Reservation -> ReservationResponseDTO
    private ReservationResponseDTO convertToDTO(Reservation reservation) {
        ReservationResponseDTO dto = new ReservationResponseDTO();
        dto.setId(reservation.getId());
        dto.setVoyageurId(reservation.getVoyageur().getId());
        dto.setTrajetId(reservation.getTrajet().getId());
        dto.setDateReservation(reservation.getDateReservation());
        dto.setPrixTotal(reservation.getPrixTotal());
        dto.setStatut(reservation.getStatut().name());
        dto.setCodePromoUtilise(reservation.getCodePromoUtilise());
        dto.setNbModif(reservation.getNbModif());

        // Ajouter les infos du trajet
        if (reservation.getTrajet() != null) {
            TrajetResponseDTO trajetDTO = new TrajetResponseDTO();
            trajetDTO.setId(reservation.getTrajet().getId());
            trajetDTO.setDateDepart(reservation.getTrajet().getDateDepart());
            trajetDTO.setDateArriveePrevue(reservation.getTrajet().getDateArriveePrevue());
            trajetDTO.setStatut(reservation.getTrajet().getStatut().name());

            if (reservation.getTrajet().getLigne() != null) {
                trajetDTO.setVilleDepart(reservation.getTrajet().getLigne().getVilleDepart());
                trajetDTO.setVilleArrivee(reservation.getTrajet().getLigne().getVilleArrivee());
                trajetDTO.setPrixBase(reservation.getTrajet().getLigne().getPrixBase());

                if (reservation.getTrajet().getLigne().getCompagnie() != null) {
                    trajetDTO.setCompagnieNom(reservation.getTrajet().getLigne().getCompagnie().getNom());
                    trajetDTO.setCompagnieId(reservation.getTrajet().getLigne().getCompagnie().getId());
                }
            }

            if (reservation.getTrajet().getBus() != null) {
                trajetDTO.setBusMatricule(reservation.getTrajet().getBus().getMatricule());
                trajetDTO.setBusMarque(reservation.getTrajet().getBus().getMarque());
                trajetDTO.setNbSieges(reservation.getTrajet().getBus().getNbSieges());
            }

            if (reservation.getTrajet().getQuai() != null) {
                trajetDTO.setQuaiNumero(reservation.getTrajet().getQuai().getNumero());
            }

            dto.setTrajet(trajetDTO);
        }

        // Ajouter les tickets
        if (reservation.getTickets() != null && !reservation.getTickets().isEmpty()) {
            List<TicketDTO> tickets = reservation.getTickets().stream()
                    .map(ticket -> {
                        TicketDTO ticketDTO = new TicketDTO();
                        ticketDTO.setId(ticket.getId());
                        ticketDTO.setNumeroSiege(ticket.getNumeroSiege());
                        ticketDTO.setNomPassager(ticket.getNomPassager());
                        ticketDTO.setPrenomPassager(ticket.getPrenomPassager());
                        ticketDTO.setPrix(ticket.getPrix());
                        ticketDTO.setQrCode(ticket.getQrCode());
                        ticketDTO.setStatut(ticket.getStatut().name());
                        return ticketDTO;
                    })
                    .collect(Collectors.toList());
            dto.setTickets(tickets);
            dto.setNombrePassagers(tickets.size());
        }

        // Ajouter les bagages
        if (reservation.getBagages() != null && !reservation.getBagages().isEmpty()) {
            List<BagageResponseDTO> bagages = reservation.getBagages().stream()
                    .map(b -> {
                        BagageResponseDTO bDTO = new BagageResponseDTO();
                        bDTO.setId(b.getId());
                        bDTO.setPoidsKg(b.getPoidsKg());
                        bDTO.setDimensionCm(b.getDimensionCm());
                        bDTO.setTypeBagage(b.getTypeBagage());
                        bDTO.setSurplusPrix(b.getSurplusPrix());
                        bDTO.setQrCodeBagage(b.getQrCodeBagage());
                        return bDTO;
                    })
                    .collect(Collectors.toList());
            dto.setBagages(bagages);
        }

        return dto;
    }
    // Ajoutez cette méthode après getMesReservations() ou avant la fin de la classe

    @GetMapping("/{id}")
    public ResponseEntity<ReservationResponseDTO> getReservationById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String email = authentication.getName();

        // Vérifier que le voyageur existe
        Voyageur voyageur = voyageurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Voyageur non trouvé"));

        // Récupérer la réservation
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réservation non trouvée"));

        // Vérifier que la réservation appartient bien au voyageur
        if (!reservation.getVoyageur().getId().equals(voyageur.getId())) {
            throw new RuntimeException("Accès non autorisé à cette réservation");
        }

        return ResponseEntity.ok(convertToDTO(reservation));
    }

}