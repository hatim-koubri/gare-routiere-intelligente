package ma.emsi.gare.controller.voyageur;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.emsi.gare.dto.request.ReservationRequest;
import ma.emsi.gare.dto.request.VerrouillageSiegeRequest;
import ma.emsi.gare.dto.request.BagageRequest;
import ma.emsi.gare.dto.request.MembreGroupeRequest;
import ma.emsi.gare.dto.response.BagageResponseDTO;
import ma.emsi.gare.dto.response.MembreGroupeDTO;
import ma.emsi.gare.dto.response.RemboursementResponseDTO;
import ma.emsi.gare.dto.response.ReservationResponseDTO;
import ma.emsi.gare.dto.response.SiegeResponseDTO;
import ma.emsi.gare.dto.response.TrajetResponseDTO;
import ma.emsi.gare.dto.response.TicketDTO;
import ma.emsi.gare.entity.Bagage;
import ma.emsi.gare.entity.Reservation;
import ma.emsi.gare.entity.Ticket;
import ma.emsi.gare.entity.Voyageur;
import ma.emsi.gare.entity.GroupeVoyage;
import ma.emsi.gare.entity.MembreGroupe;
import ma.emsi.gare.entity.Remboursement;
import ma.emsi.gare.enums.TypeReclamation;
import ma.emsi.gare.dto.request.CreerReclamationRequest;
import ma.emsi.gare.service.VoyageurReclamationService;
import ma.emsi.gare.repository.BagageRepository;
import ma.emsi.gare.repository.SiegeRepository;
import ma.emsi.gare.enums.StatutTicket;
import ma.emsi.gare.enums.StatutRemboursement;
import ma.emsi.gare.repository.GroupeVoyageRepository;
import ma.emsi.gare.repository.MembreGroupeRepository;
import ma.emsi.gare.repository.RemboursementRepository;
import ma.emsi.gare.repository.ReservationRepository;
import ma.emsi.gare.repository.TicketRepository;
import ma.emsi.gare.repository.VoyageurRepository;
import ma.emsi.gare.service.EmailService;
import ma.emsi.gare.service.PdfService;
import ma.emsi.gare.service.ReservationService;
import ma.emsi.gare.service.WebSocketNotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ma.emsi.gare.dto.request.ModificationReservationRequest;
import ma.emsi.gare.dto.request.ChangementSiegeRequest;
import ma.emsi.gare.dto.request.DeclarationBagageRequest;


import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


@RestController
@RequestMapping("/api/voyageur/reservations")
@RequiredArgsConstructor
@Slf4j
public class VoyageurReservationController {

    private final ReservationService reservationService;
    private final ReservationRepository reservationRepository;
    private final GroupeVoyageRepository groupeVoyageRepository;
    private final MembreGroupeRepository membreGroupeRepository;
    private final RemboursementRepository remboursementRepository;
    private final VoyageurRepository voyageurRepository;
    private final TicketRepository ticketRepository;
    private final PdfService pdfService;

    private final EmailService emailService;
    private final VoyageurReclamationService reclamationService;
    private final BagageRepository bagageRepository;
    private final SiegeRepository siegeRepository;
    private final WebSocketNotificationService webSocketNotificationService;

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
                .map(r -> {
                    try {
                        return convertToDTO(r);
                    } catch (Exception e) {
                        log.error("Erreur conversion réservation {}: {}", r.getId(), e.getMessage(), e);
                        return null;
                    }
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
    }

    @PostMapping("/valider-promo")
    public ResponseEntity<Map<String, Object>> validerPromo(
            @RequestBody Map<String, Object> request
    ) {
        String code = (String) request.get("code");
        Long trajetId = ((Number) request.get("trajetId")).longValue();
        try {
            Map<String, Object> result = reservationService.validerPromo(code, trajetId);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.ok(Map.of(
                    "valid", false,
                    "message", e.getMessage()
            ));
        }
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

    @PostMapping("/proposition-groupe")
    public ResponseEntity<?> proposerSiegesIntelligents(
            @RequestBody Map<String, Object> body
    ) {
        try {
            Long reservationId = ((Number) body.get("reservationId")).longValue();
            var result = reservationService.proposerSiegesIntelligents(reservationId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erreur proposition intelligente: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/verrouiller")
    public void verrouillerSieges(@RequestBody VerrouillageSiegeRequest request) {
        reservationService.verrouillerSieges(request);
    }

    @DeleteMapping("/{id}/annuler")
    public ResponseEntity<RemboursementResponseDTO> annulerReservation(
            @PathVariable Long id,
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

        Remboursement remb = reservationService.annulerReservation(id);
        RemboursementResponseDTO dto = new RemboursementResponseDTO();
        dto.setId(remb.getId());
        dto.setReservationId(remb.getReservation().getId());
        dto.setMontant(remb.getMontant());
        dto.setMotif(remb.getMotif());
        dto.setStatut(remb.getStatut());
        dto.setDateDemande(remb.getDateDemande());
        dto.setDateTraitement(remb.getDateTraitement());
        return ResponseEntity.ok(dto);
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
        return reservationService.changerSieges(id, request);
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

    @DeleteMapping("/{id}/bagages/{bagageId}")
    public ResponseEntity<BagageResponseDTO> supprimerBagage(
            @PathVariable Long id,
            @PathVariable Long bagageId,
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

        BagageResponseDTO bagage = reservationService.supprimerBagage(id, bagageId);
        return ResponseEntity.ok(bagage);
    }

    @PostMapping("/bagage/declarer")
    public void declarerBagage(
            @RequestBody DeclarationBagageRequest request,
            Authentication authentication
    ) {
        String email = authentication.getName();
        Voyageur voyageur = voyageurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Voyageur non trouvé"));

        reservationService.declarerBagage(
                request.getQrCodeBagage(),
                request.getType()
        );

        // Notifier les admins via WebSocket
        webSocketNotificationService.notifierAdmins("BAGAGE_DECLARE", Map.of(
                "type", request.getType(),
                "qrCode", request.getQrCodeBagage(),
                "voyageurEmail", email,
                "voyageurNom", voyageur.getNom() + " " + voyageur.getPrenom()
        ));

        Bagage bagage = bagageRepository.findByQrCodeBagage(request.getQrCodeBagage())
                .orElse(null);
        if (bagage != null && bagage.getReservation() != null) {
            TypeReclamation typeReclamation = "PERDU".equalsIgnoreCase(request.getType())
                    ? TypeReclamation.BAGAGE_PERDU
                    : TypeReclamation.BAGAGE_ENDOMMAGE;
            String sujet = "Bagage " + ("PERDU".equalsIgnoreCase(request.getType()) ? "perdu" : "endommagé")
                    + " - " + bagage.getQrCodeBagage();
            CreerReclamationRequest reclamationReq = new CreerReclamationRequest();
            reclamationReq.setType(typeReclamation);
            reclamationReq.setSujet(sujet);
            reclamationReq.setDescription("Déclaration de bagage " +
                    ("PERDU".equalsIgnoreCase(request.getType()) ? "perdu" : "endommagé") +
                    " (QR: " + bagage.getQrCodeBagage() + ")");
            reclamationReq.setReservationId(bagage.getReservation().getId());
            reclamationService.creer(voyageur.getId(), reclamationReq);
        }
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

    // ── Member management ──────────────────────────────────────

    @PostMapping("/{id}/membres")
    public ResponseEntity<MembreGroupeDTO> ajouterMembre(
            @PathVariable Long id,
            @RequestBody MembreGroupeRequest request,
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

        MembreGroupeDTO dto = reservationService.ajouterMembre(id, request);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}/membres/{membreId}")
    public ResponseEntity<MembreGroupeDTO> modifierMembre(
            @PathVariable Long id,
            @PathVariable Long membreId,
            @RequestBody MembreGroupeRequest request,
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

        MembreGroupeDTO dto = reservationService.modifierMembre(id, membreId, request);
        return ResponseEntity.ok(dto);
    }

    @DeleteMapping("/{id}/membres/{membreId}")
    public ResponseEntity<RemboursementResponseDTO> supprimerMembre(
            @PathVariable Long id,
            @PathVariable Long membreId,
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

        Remboursement remb = reservationService.supprimerMembre(id, membreId);

        if (remb == null) {
            return ResponseEntity.noContent().build();
        }

        RemboursementResponseDTO dto = new RemboursementResponseDTO();
        dto.setId(remb.getId());
        dto.setReservationId(remb.getReservation().getId());
        dto.setMontant(remb.getMontant());
        dto.setMotif(remb.getMotif());
        dto.setStatut(remb.getStatut());
        dto.setDateDemande(remb.getDateDemande());
        dto.setDateTraitement(remb.getDateTraitement());
        return ResponseEntity.ok(dto);
    }

    // Méthode privée pour convertir Reservation -> ReservationResponseDTO
    private ReservationResponseDTO convertToDTO(Reservation reservation) {
        ReservationResponseDTO dto = new ReservationResponseDTO();
        dto.setId(reservation.getId());
        dto.setVoyageurId(reservation.getVoyageur().getId());
        dto.setTrajetId(reservation.getTrajet().getId());
        dto.setDateReservation(reservation.getDateReservation());
        dto.setPrixTotal(reservation.getPrixTotal());
        dto.setStatut(reservation.getStatut() != null ? reservation.getStatut().name() : null);
        dto.setCodePromoUtilise(reservation.getCodePromoUtilise());
        dto.setNbModif(reservation.getNbModif());

        // Ajouter les infos du groupe
        groupeVoyageRepository.findByReservationId(reservation.getId()).ifPresent(groupe -> {
            dto.setGroupeId(groupe.getId());
            dto.setTypeGroupe(groupe.getTypeGroupe());
            dto.setNombrePassagers(groupe.getNombrePassagers());
            dto.setMembres(membreGroupeRepository.findByGroupeId(groupe.getId()).stream()
                    .map(this::membreToDTO)
                    .collect(Collectors.toList()));
        });

        // Ajouter les infos du trajet
        try {
            var trajetProxy = reservation.getTrajet();
            if (trajetProxy != null) {
                TrajetResponseDTO trajetDTO = new TrajetResponseDTO();
                trajetDTO.setId(trajetProxy.getId());
                trajetDTO.setDateDepart(trajetProxy.getDateDepart());
                trajetDTO.setDateArriveePrevue(trajetProxy.getDateArriveePrevue());
                trajetDTO.setStatut(trajetProxy.getStatut() != null ? trajetProxy.getStatut().name() : null);

                var ligne = trajetProxy.getLigne();
                if (ligne != null) {
                    trajetDTO.setVilleDepart(ligne.getVilleDepart());
                    trajetDTO.setVilleArrivee(ligne.getVilleArrivee());
                    trajetDTO.setPrixBase(ligne.getPrixBase());

                    var compagnie = ligne.getCompagnie();
                    if (compagnie != null) {
                        trajetDTO.setCompagnieNom(compagnie.getNom());
                        trajetDTO.setCompagnieId(compagnie.getId());
                    }
                }

                var bus = trajetProxy.getBus();
                if (bus != null) {
                    trajetDTO.setBusMatricule(bus.getMatricule());
                    trajetDTO.setBusMarque(bus.getMarque());
                    trajetDTO.setNbSieges(bus.getNbSieges());
                }

                var quai = trajetProxy.getQuai();
                if (quai != null) {
                    trajetDTO.setQuaiNumero(quai.getNumero());
                }

                dto.setTrajet(trajetDTO);
            }
        } catch (Exception ignored) {
            // Si le trajet lié n'existe plus en base, on ignore
        }

        // Ajouter les tickets (uniquement actifs)
        if (reservation.getTickets() != null && !reservation.getTickets().isEmpty()) {
            List<TicketDTO> tickets = reservation.getTickets().stream()
                    .filter(ticket -> ticket.getStatut() == StatutTicket.ACTIF)
                    .map(ticket -> {
                        TicketDTO ticketDTO = new TicketDTO();
                        ticketDTO.setId(ticket.getId());
                        ticketDTO.setNumeroSiege(ticket.getNumeroSiege());
                        ticketDTO.setNomPassager(ticket.getNomPassager());
                        ticketDTO.setPrenomPassager(ticket.getPrenomPassager());
                        ticketDTO.setPrix(ticket.getPrix());
                        ticketDTO.setQrCode(ticket.getQrCode());
                        ticketDTO.setStatut(ticket.getStatut() != null ? ticket.getStatut().name() : null);
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

    private MembreGroupeDTO membreToDTO(MembreGroupe m) {
        MembreGroupeDTO dto = new MembreGroupeDTO();
        dto.setId(m.getId());
        dto.setNom(m.getNomManuel());
        dto.setPrenom(m.getPrenomManuel());
        dto.setSexe(m.getSexe());
        dto.setAge(m.getAge());
        dto.setCategorieTarifaire(m.getCategorieTarifaire() != null ? m.getCategorieTarifaire().name() : null);
        dto.setLienOrganisateur(m.getLienOrganisateur() != null ? m.getLienOrganisateur().name() : null);
        dto.setEnfantSurGenoux(m.isEnfantSurGenoux());
        dto.setAccepteSexeOppose(m.isAccepteSexeOppose());
        dto.setPreferencePosition(m.getPreferencePosition());
        dto.setPrefereCoteMembreId(m.getPrefereCoteMembreId());
        dto.setPrixTicket(m.getPrixMembre());
        if (m.getTicket() != null) {
            dto.setNumeroSiege(m.getTicket().getNumeroSiege());
            dto.setQrCode(m.getTicket().getQrCode());
            dto.setTicketId(m.getTicket().getId());
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

    @PostMapping("/{reservationId}/tickets/{ticketId}/annuler")
    public ResponseEntity<RemboursementResponseDTO> annulerTicket(
            @PathVariable Long reservationId,
            @PathVariable Long ticketId,
            Authentication authentication
    ) {
        String email = authentication.getName();
        Voyageur voyageur = voyageurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Voyageur non trouvé"));

        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Réservation non trouvée"));

        if (!reservation.getVoyageur().getId().equals(voyageur.getId())) {
            throw new RuntimeException("Accès non autorisé à cette réservation");
        }

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket non trouvé"));

        if (!ticket.getReservation().getId().equals(reservationId)) {
            throw new RuntimeException("Ticket non associé à cette réservation");
        }

        if (ticket.getStatut() != StatutTicket.ACTIF) {
            throw new RuntimeException("Ce ticket n'est pas actif");
        }

        double taux = ReservationService.calculTauxRemboursement(reservation.getTrajet().getDateDepart());
        double montantRembourse = Math.round(ticket.getPrix() * taux * 100.0) / 100.0;

        ticket.setStatut(StatutTicket.ANNULE);
        ticketRepository.save(ticket);

        if (ticket.getNumeroSiege() != null) {
            var siegeOpt = siegeRepository.findByTrajetIdAndNumeroSiege(
                    reservation.getTrajet().getId(),
                    ticket.getNumeroSiege()
            );
            siegeOpt.ifPresent(siege -> {
                siege.setOccupe(false);
                siegeRepository.save(siege);
            });
        }

        reservation.setPrixTotal(reservation.getPrixTotal() - ticket.getPrix() + montantRembourse);
        reservationRepository.save(reservation);

        String motif = "Annulation ticket #" + ticketId + " (" + ticket.getPrenomPassager() + " " + ticket.getNomPassager()
                + ", remboursement " + Math.round(taux * 100) + "% de " + ticket.getPrix() + " MAD)";

        Remboursement remb = new Remboursement();
        remb.setReservation(reservation);
        remb.setMontant(montantRembourse);
        remb.setMotif(motif);
        remb.setStatut(StatutRemboursement.EN_ATTENTE);
        remb.setPartiel(true);
        remb.setDateDemande(LocalDateTime.now());
        remb = remboursementRepository.save(remb);

        RemboursementResponseDTO dto = new RemboursementResponseDTO();
        dto.setId(remb.getId());
        dto.setReservationId(remb.getReservation().getId());
        dto.setMontant(remb.getMontant());
        dto.setMotif(remb.getMotif());
        dto.setStatut(remb.getStatut());
        dto.setDateDemande(remb.getDateDemande());
        dto.setDateTraitement(remb.getDateTraitement());
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/remboursements")
    public ResponseEntity<List<RemboursementResponseDTO>> getMesRemboursements(
            Authentication authentication
    ) {
        String email = authentication.getName();
        Voyageur voyageur = voyageurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Voyageur non trouvé"));

        List<Remboursement> remboursements = remboursementRepository
                .findByReservationVoyageurIdOrderByDateDemandeDesc(voyageur.getId());

        List<RemboursementResponseDTO> dtos = remboursements.stream()
                .map(r -> {
                    RemboursementResponseDTO dto = new RemboursementResponseDTO();
                    dto.setId(r.getId());
                    dto.setReservationId(r.getReservation().getId());
                    dto.setMontant(r.getMontant());
                    dto.setMotif(r.getMotif());
                    dto.setStatut(r.getStatut());
                    dto.setDateDemande(r.getDateDemande());
                    dto.setDateTraitement(r.getDateTraitement());
                    dto.setVoyageurId(voyageur.getId());
                    dto.setVoyageurNom(voyageur.getNom());
                    dto.setVoyageurPrenom(voyageur.getPrenom());
                    return dto;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }
}