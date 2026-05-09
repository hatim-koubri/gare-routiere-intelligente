package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.BagageRequest;
import ma.emsi.gare.dto.request.MembreGroupeRequest;
import ma.emsi.gare.dto.request.ReservationRequest;
import ma.emsi.gare.dto.request.VerrouillageSiegeRequest;
import ma.emsi.gare.dto.request.ChangementSiegeRequest;
import ma.emsi.gare.dto.response.BagageResponseDTO;
import ma.emsi.gare.dto.response.MembreGroupeDTO;
import ma.emsi.gare.dto.response.ReservationResponseDTO;
import ma.emsi.gare.dto.response.SiegeResponseDTO;
import ma.emsi.gare.entity.*;
import ma.emsi.gare.enums.CategorieTarifaire;
import ma.emsi.gare.enums.LienOrganisateur;
import ma.emsi.gare.enums.StatutRemboursement;
import ma.emsi.gare.enums.StatutReservation;
import ma.emsi.gare.enums.TypeBagage;
import ma.emsi.gare.repository.*;
import org.springframework.stereotype.Service;
import ma.emsi.gare.messaging.NotificationProducer;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import ma.emsi.gare.dto.request.ModificationReservationRequest;
import ma.emsi.gare.enums.StatutTicket;
import java.time.Duration;
import java.util.UUID;

import org.springframework.transaction.annotation.Transactional;


@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final GroupeVoyageRepository groupeVoyageRepository;
    private final MembreGroupeRepository membreGroupeRepository;
    private final PreferenceVoisinageRepository preferenceVoisinageRepository;

    private final VoyageurRepository voyageurRepository;
    private final TrajetRepository trajetRepository;
    private final SiegeRepository siegeRepository;
    private final TicketRepository ticketRepository;
    private final NotificationProducer notificationProducer;

    private final BagageRepository bagageRepository;
    private final CodePromoRepository codePromoRepository;
    private final RemboursementRepository remboursementRepository;
    private final PaiementRepository paiementRepository;
    private final WebSocketNotificationService webSocketNotificationService;

    public ReservationResponseDTO creerReservation(Long voyageurId, ReservationRequest request) {

        Voyageur voyageur = voyageurRepository.findById(voyageurId)
                .orElseThrow(() -> new RuntimeException("Voyageur non trouvé"));

        Trajet trajet = trajetRepository.findById(request.getTrajetId())
                .orElseThrow(() -> new RuntimeException("Trajet non trouvé"));

        if (request.getMembres() == null || request.getMembres().isEmpty()) {
            throw new RuntimeException("La réservation doit contenir au moins un passager");
        }

        Reservation reservation = new Reservation();
        reservation.setVoyageur(voyageur);
        reservation.setTrajet(trajet);
        reservation.setDateReservation(LocalDateTime.now());
        reservation.setStatut(StatutReservation.EN_ATTENTE);
        reservation.setPrixTotal(0.0);

        Reservation savedReservation = reservationRepository.save(reservation);

        GroupeVoyage groupe = new GroupeVoyage();
        groupe.setOrganisateur(voyageur);
        groupe.setReservation(savedReservation);
        groupe.setTypeGroupe(request.getTypeGroupe());
        groupe.setNombrePassagers(request.getMembres().size());
        groupe.setPlacementEffectue(false);

        GroupeVoyage savedGroupe = groupeVoyageRepository.save(groupe);

        double total = 0.0;

        for (MembreGroupeRequest membreRequest : request.getMembres()) {

            if (membreRequest.isEnfantSurGenoux() && membreRequest.getAge() != null && membreRequest.getAge() >= 5) {
                throw new RuntimeException("L'option 'enfant sur genoux' est réservée aux enfants de moins de 5 ans");
            }

            MembreGroupe membre = new MembreGroupe();
            membre.setGroupe(savedGroupe);
            membre.setNomManuel(membreRequest.getNomManuel());
            membre.setPrenomManuel(membreRequest.getPrenomManuel());
            membre.setSexe(membreRequest.getSexe());
            membre.setAge(membreRequest.getAge());
            if (membreRequest.getLienOrganisateur() != null) {
                membre.setLienOrganisateur(LienOrganisateur.valueOf(membreRequest.getLienOrganisateur()));
            }
            membre.setEnfantSurGenoux(membreRequest.isEnfantSurGenoux());
            membre.setAccepteSexeOppose(membreRequest.isAccepteSexeOppose());
            membre.setPreferencePosition(membreRequest.getPreferencePosition());
            membre.setPrefereCoteMembreId(membreRequest.getPrefereCoteMembreId());

            CategorieTarifaire categorie = membreRequest.getCategorieTarifaire() != null
                    ? CategorieTarifaire.valueOf(membreRequest.getCategorieTarifaire())
                    : CategorieTarifaire.NORMAL;

            if (membreRequest.isEnfantSurGenoux()) {
                categorie = CategorieTarifaire.ENFANT;
            }

            membre.setCategorieTarifaire(categorie);

            double prixMembre = calculPrixSimple(trajet.getLigne().getPrixBase(), categorie, membreRequest.isEnfantSurGenoux());
            membre.setPrixMembre(prixMembre);
            total += prixMembre;

            membreGroupeRepository.save(membre);
        }

        // Appliquer le code promo si fourni
        String codePromoStr = request.getCodePromo();
        if (codePromoStr != null && !codePromoStr.isBlank()) {
            CodePromo promo = codePromoRepository.findByCode(codePromoStr.toUpperCase())
                    .orElseThrow(() -> new RuntimeException("Code promo invalide"));

            if (!promo.isActif()) {
                throw new RuntimeException("Ce code promo a été désactivé");
            }
            if (promo.getDateExpiration().isBefore(LocalDateTime.now())) {
                throw new RuntimeException("Ce code promo a expiré");
            }
            if (promo.getNbUtilisationsMax() != null &&
                    promo.getNbUtilisationsActuel() >= promo.getNbUtilisationsMax()) {
                throw new RuntimeException("Ce code promo a atteint sa limite d'utilisations");
            }

            Long trajetCompagnieId = trajet.getLigne().getCompagnie().getId();
            if (promo.getCompagnie() == null || !promo.getCompagnie().getId().equals(trajetCompagnieId)) {
                throw new RuntimeException("Ce code promo n'est pas valide pour cette compagnie");
            }

            double reduction = total * promo.getPourcentageReduction() / 100.0;
            total -= reduction;
            savedReservation.setCodePromoUtilise(promo.getCode());

            promo.setNbUtilisationsActuel(promo.getNbUtilisationsActuel() + 1);
            codePromoRepository.save(promo);
        }

        savedReservation.setPrixTotal(total);
        savedReservation = reservationRepository.save(savedReservation);

        return toResponse(savedReservation, savedGroupe);
    }

    private double calculPrixSimple(Double prixBase, CategorieTarifaire categorie, boolean enfantSurGenoux) {
        if (enfantSurGenoux) return 0.0;
        double prix = prixBase != null ? prixBase : 0.0;
        if (categorie == CategorieTarifaire.ETUDIANT) prix *= 0.75;
        else if (categorie == CategorieTarifaire.ENFANT) prix *= 0.50;
        else if (categorie == CategorieTarifaire.MILITAIRE) prix *= 0.70;
        else if (categorie == CategorieTarifaire.SENIOR) prix *= 0.80;
        return prix;
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

    private List<MembreGroupeDTO> membresToDTOs(List<MembreGroupe> membres) {
        return membres.stream().map(this::membreToDTO).toList();
    }

    // ── Member CRUD ────────────────────────────────────────────

    @Transactional
    public MembreGroupeDTO ajouterMembre(Long reservationId, MembreGroupeRequest request) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Réservation introuvable"));

        GroupeVoyage groupe = trouverOuCreerGroupe(reservation);

        verifierModificationMembre(reservation);

        if (request.isEnfantSurGenoux() && request.getAge() != null && request.getAge() >= 5) {
            throw new RuntimeException("L'option 'enfant sur genoux' est réservée aux enfants de moins de 5 ans");
        }

        MembreGroupe membre = new MembreGroupe();
        membre.setGroupe(groupe);
        membre.setNomManuel(request.getNomManuel());
        membre.setPrenomManuel(request.getPrenomManuel());
        membre.setSexe(request.getSexe());
        membre.setAge(request.getAge());
        if (request.getLienOrganisateur() != null) {
            membre.setLienOrganisateur(LienOrganisateur.valueOf(request.getLienOrganisateur()));
        }
        membre.setEnfantSurGenoux(request.isEnfantSurGenoux());
        membre.setAccepteSexeOppose(request.isAccepteSexeOppose());
        membre.setPreferencePosition(request.getPreferencePosition());
        membre.setPrefereCoteMembreId(request.getPrefereCoteMembreId());

        CategorieTarifaire categorie = request.getCategorieTarifaire() != null
                ? CategorieTarifaire.valueOf(request.getCategorieTarifaire())
                : CategorieTarifaire.NORMAL;

        if (request.isEnfantSurGenoux()) {
            categorie = CategorieTarifaire.ENFANT;
        }
        membre.setCategorieTarifaire(categorie);

        double prixMembre = calculPrixSimple(
                reservation.getTrajet().getLigne().getPrixBase(),
                categorie,
                request.isEnfantSurGenoux()
        );
        membre.setPrixMembre(prixMembre);

        MembreGroupe saved = membreGroupeRepository.save(membre);

        String numeroSiege = request.getNumeroSiege();
        String siegeNumero = numeroSiege;
        if (numeroSiege != null && !numeroSiege.isBlank()) {
            Siege siege = siegeRepository
                    .findByTrajetIdAndNumeroSiege(reservation.getTrajet().getId(), siegeNumero)
                    .orElseThrow(() -> new IllegalArgumentException("Siège introuvable : " + siegeNumero));
            if (siege.isOccupe() || siege.isBloque()) {
                throw new IllegalStateException("Ce siège n'est pas disponible : " + numeroSiege);
            }
            siege.setOccupe(true);
            siege.setVerrouilleTemporaire(false);
            siege.setVerrouilleParReservationId(null);
            siege.setVerrouilleAt(null);
            siegeRepository.save(siege);
        } else {
            List<Siege> siegesLibres = siegeRepository.findByTrajetIdAndOccupeFalseAndBloqueFalse(
                    reservation.getTrajet().getId());
            if (!siegesLibres.isEmpty()) {
                Siege siege = siegesLibres.get(0);
                siege.setOccupe(true);
                siegeRepository.save(siege);
                numeroSiege = siege.getNumeroSiege();
            }
        }

        Ticket ticket = new Ticket();
        ticket.setReservation(reservation);
        ticket.setQrCode(UUID.randomUUID().toString());
        ticket.setNomPassager(membre.getNomManuel());
        ticket.setPrenomPassager(membre.getPrenomManuel());
        ticket.setCategorieTarifaire(membre.getCategorieTarifaire());
        ticket.setNumeroSiege(numeroSiege);
        ticket.setPrix(prixMembre);
        ticket.setEnfantSurGenoux(membre.isEnfantSurGenoux());
        Ticket savedTicket = ticketRepository.save(ticket);

        saved.setTicket(savedTicket);
        saved.setSiegeAttribue(numeroSiege);
        membreGroupeRepository.save(saved);

        groupe.setNombrePassagers(groupe.getNombrePassagers() + 1);
        groupeVoyageRepository.save(groupe);

        reservation.setPrixTotal(reservation.getPrixTotal() + prixMembre);
        reservationRepository.save(reservation);

        traiterPaiementMembre(reservation, prixMembre, request.getNumeroCarte(), request.getDateExpiration(), request.getCvv());

        return membreToDTO(saved);
    }

    @Transactional
    public MembreGroupeDTO modifierMembre(Long reservationId, Long membreId, MembreGroupeRequest request) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Réservation introuvable"));

        verifierModificationMembre(reservation);

        if (request.isEnfantSurGenoux() && request.getAge() != null && request.getAge() >= 5) {
            throw new RuntimeException("L'option 'enfant sur genoux' est réservée aux enfants de moins de 5 ans");
        }

        MembreGroupe membre = membreGroupeRepository.findById(membreId)
                .orElseThrow(() -> new IllegalArgumentException("Membre introuvable"));

        if (!membre.getGroupe().getReservation().getId().equals(reservationId)) {
            throw new IllegalArgumentException("Ce membre n'appartient pas à cette réservation");
        }

        double ancienPrix = membre.getPrixMembre();

        membre.setNomManuel(request.getNomManuel());
        membre.setPrenomManuel(request.getPrenomManuel());
        membre.setSexe(request.getSexe());
        membre.setAge(request.getAge());
        if (request.getLienOrganisateur() != null) {
            membre.setLienOrganisateur(LienOrganisateur.valueOf(request.getLienOrganisateur()));
        }
        membre.setEnfantSurGenoux(request.isEnfantSurGenoux());
        membre.setAccepteSexeOppose(request.isAccepteSexeOppose());
        membre.setPreferencePosition(request.getPreferencePosition());
        membre.setPrefereCoteMembreId(request.getPrefereCoteMembreId());

        CategorieTarifaire categorie = request.getCategorieTarifaire() != null
                ? CategorieTarifaire.valueOf(request.getCategorieTarifaire())
                : CategorieTarifaire.NORMAL;

        if (request.isEnfantSurGenoux()) {
            categorie = CategorieTarifaire.ENFANT;
        }
        membre.setCategorieTarifaire(categorie);

        double nouveauPrix = calculPrixSimple(
                reservation.getTrajet().getLigne().getPrixBase(),
                categorie,
                request.isEnfantSurGenoux()
        );
        membre.setPrixMembre(nouveauPrix);

        MembreGroupe saved = membreGroupeRepository.save(membre);

        reservation.setPrixTotal(reservation.getPrixTotal() - ancienPrix + nouveauPrix);
        reservationRepository.save(reservation);

        if (nouveauPrix > ancienPrix) {
            traiterPaiementMembre(reservation, nouveauPrix - ancienPrix, request.getNumeroCarte(), request.getDateExpiration(), request.getCvv());
        }

        return membreToDTO(saved);
    }

    @Transactional
    public Remboursement supprimerMembre(Long reservationId, Long membreId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Réservation introuvable"));

        verifierModificationMembre(reservation);

        MembreGroupe membre = membreGroupeRepository.findById(membreId)
                .orElseThrow(() -> new IllegalArgumentException("Membre introuvable"));

        if (!membre.getGroupe().getReservation().getId().equals(reservationId)) {
            throw new IllegalArgumentException("Ce membre n'appartient pas à cette réservation");
        }

        GroupeVoyage groupe = membre.getGroupe();

        if (groupe.getMembres().size() <= 1) {
            throw new IllegalStateException("Impossible de supprimer le dernier membre du groupe");
        }

        double prixMembre = membre.getPrixMembre();

        // Cancel associated ticket and free seat
        Ticket ticketMembre = membre.getTicket();
        if (ticketMembre != null) {
            if (ticketMembre.getNumeroSiege() != null) {
                siegeRepository.findByTrajetIdAndNumeroSiege(
                        reservation.getTrajet().getId(),
                        ticketMembre.getNumeroSiege()
                ).ifPresent(this::libererSiege);
            }
            ticketMembre.setStatut(StatutTicket.ANNULE);
            ticketRepository.save(ticketMembre);
        }

        groupe.getMembres().remove(membre);
        groupe.setNombrePassagers(groupe.getNombrePassagers() - 1);
        membreGroupeRepository.delete(membre);
        membreGroupeRepository.flush();
        groupeVoyageRepository.save(groupe);

        double taux = calculTauxRemboursement(reservation.getTrajet().getDateDepart());
        double montantRembourse = Math.round(prixMembre * taux * 100.0) / 100.0;

        if (reservation.getStatut() == StatutReservation.EN_ATTENTE) {
            reservation.setPrixTotal(reservation.getPrixTotal() - prixMembre);
            reservationRepository.save(reservation);
            return null;
        }

        reservation.setPrixTotal(reservation.getPrixTotal() - prixMembre);
        reservationRepository.save(reservation);

        String motif = "Suppression de " + membre.getPrenomManuel() + " " + membre.getNomManuel()
                + " (" + Math.round(taux * 100) + "% remboursement de " + prixMembre + " MAD)";

        Remboursement remb = new Remboursement();
        remb.setReservation(reservation);
        remb.setMontant(montantRembourse);
        remb.setMotif(motif);
        remb.setStatut(StatutRemboursement.EN_ATTENTE);
        remb.setPartiel(true);
        remb.setDateDemande(LocalDateTime.now());
        remb = remboursementRepository.save(remb);

        notificationProducer.envoyerNotification(
                "Demande de remboursement pour suppression de membre ID=" + membreId
                        + ", réservation ID=" + reservationId
                        + ", montant=" + montantRembourse
        );

        webSocketNotificationService.notifierAdmins("NOUVEAU_REMBOURSEMENT", Map.of(
                "id", remb.getId(),
                "reservationId", reservationId,
                "montant", montantRembourse,
                "motif", motif,
                "type", "SUPPRESSION_MEMBRE"
        ));

        Long compagnieId = reservation.getTrajet().getLigne().getCompagnie().getId();
        webSocketNotificationService.notifierResponsables(compagnieId, "NOUVEAU_REMBOURSEMENT", Map.of(
                "id", remb.getId(),
                "reservationId", reservationId,
                "montant", montantRembourse,
                "motif", motif,
                "voyageurEmail", reservation.getVoyageur().getEmail(),
                "type", "SUPPRESSION_MEMBRE"
        ));

        return remb;
    }

    private void verifierModificationMembre(Reservation reservation) {
        if (reservation.getStatut() == StatutReservation.ANNULEE
                || reservation.getStatut() == StatutReservation.REMBOURSEE) {
            throw new IllegalStateException("Impossible de modifier une réservation annulée ou remboursée");
        }

        LocalDateTime dateDepart = reservation.getTrajet().getDateDepart();
        if (LocalDateTime.now().isAfter(dateDepart)) {
            throw new IllegalStateException("Impossible de modifier après le départ");
        }

        long heuresAvantDepart = Duration.between(LocalDateTime.now(), dateDepart).toHours();
        if (heuresAvantDepart < 24) {
            throw new IllegalStateException("Modification des membres autorisée seulement jusqu'à 24h avant le départ");
        }
    }

    private ReservationResponseDTO toResponse(Reservation reservation, GroupeVoyage groupe) {
        ReservationResponseDTO dto = new ReservationResponseDTO();
        dto.setId(reservation.getId());
        dto.setVoyageurId(reservation.getVoyageur().getId());
        dto.setTrajetId(reservation.getTrajet().getId());
        dto.setDateReservation(reservation.getDateReservation());
        dto.setPrixTotal(reservation.getPrixTotal());
        dto.setStatut(reservation.getStatut().toString());
        dto.setCodePromoUtilise(reservation.getCodePromoUtilise());
        dto.setNbModif(reservation.getNbModif());
        dto.setGroupeId(groupe.getId());
        dto.setTypeGroupe(groupe.getTypeGroupe());
        dto.setNombrePassagers(groupe.getNombrePassagers());
        dto.setMembres(membresToDTOs(groupe.getMembres()));
        return dto;
    }

    public ReservationResponseDTO creerReservationParEmail(String email, ReservationRequest request) {
        Voyageur voyageur = voyageurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Voyageur non trouvé"));
        return creerReservation(voyageur.getId(), request);
    }

    // ── Plan Bus avec génération automatique ──────────────────
    @Transactional
    public List<SiegeResponseDTO> getPlanBus(Long trajetId) {

        Trajet trajet = trajetRepository.findById(trajetId)
                .orElseThrow(() -> new RuntimeException("Trajet non trouvé"));

        // Libérer les verrous expirés avant d'afficher le plan
        LocalDateTime expiration = LocalDateTime.now().minusMinutes(10);
        siegeRepository.libererSiegesExpires(expiration);

        // Générer les sièges automatiquement si pas encore fait
        var siegesExistants = siegeRepository.findByTrajetId(trajetId);
        if (siegesExistants.isEmpty()) {
            genererSieges(trajet);
            siegesExistants = siegeRepository.findByTrajetId(trajetId);
        }

        return siegesExistants.stream().map(s -> {
            SiegeResponseDTO dto = new SiegeResponseDTO();
            dto.setNumeroSiege(s.getNumeroSiege());
            dto.setNumeroRangee(s.getNumeroRangee());
            dto.setPositionRangee(s.getPositionRangee());
            dto.setOccupe(s.isOccupe());
            dto.setBloque(s.isBloque());
            dto.setVerrouilleTemporaire(s.isVerrouilleTemporaire());
            dto.setGenreOccupant(s.getGenreOccupant());
            dto.setEnfantSurGenoux(s.isEnfantSurGenoux());
            return dto;
        }).collect(java.util.stream.Collectors.toList());
    }

    private void genererSieges(Trajet trajet) {
        int nbSieges = trajet.getBus().getNbSieges();
        String[] colonnes = {"A", "B", "C", "D"};
        int nbRangees = (int) Math.ceil(nbSieges / 4.0);

        List<Siege> sieges = new ArrayList<>();
        int compteur = 0;

        for (int rangee = 1; rangee <= nbRangees && compteur < nbSieges; rangee++) {
            for (String colonne : colonnes) {
                if (compteur >= nbSieges) break;

                Siege siege = new Siege();
                siege.setTrajet(trajet);
                siege.setNumeroSiege(rangee + colonne);
                siege.setNumeroRangee(rangee);
                siege.setPositionRangee(colonne);
                siege.setOccupe(false);
                siege.setBloque(false);
                siege.setVerrouilleTemporaire(false);
                siege.setEnfantSurGenoux(false);

                sieges.add(siege);
                compteur++;
            }
        }

        siegeRepository.saveAll(sieges);
    }

    // ── Proposer sièges groupés ────────────────────────────────
    public List<String> proposerSiegesGroupe(Long trajetId, int nombrePlaces) {

        var sieges = siegeRepository.findSiegesLibresOrdonnes(trajetId);

        for (int i = 0; i < sieges.size(); i++) {
            List<Siege> bloc = new ArrayList<>();
            bloc.add(sieges.get(i));

            for (int j = i + 1; j < sieges.size(); j++) {
                Siege precedent = sieges.get(j - 1);
                Siege courant = sieges.get(j);

                if (courant.getNumeroRangee().equals(precedent.getNumeroRangee())) {
                    bloc.add(courant);
                } else {
                    break;
                }

                if (bloc.size() == nombrePlaces) {
                    return bloc.stream().map(Siege::getNumeroSiege).toList();
                }
            }
        }

        return new ArrayList<>();
    }

    // ── Verrouillage temporaire ────────────────────────────────
    @Transactional
    public void verrouillerSieges(VerrouillageSiegeRequest request) {

        LocalDateTime expiration = LocalDateTime.now().minusMinutes(10);
        siegeRepository.libererSiegesExpires(expiration);

        if (request.getNumerosSieges().size() > 5) {
            throw new RuntimeException("Maximum 5 sièges par réservation");
        }

        for (String numero : request.getNumerosSieges()) {

            Siege siege = siegeRepository
                    .findByTrajetIdAndNumeroSiege(request.getTrajetId(), numero)
                    .orElseThrow(() -> new RuntimeException("Siège introuvable"));

            if (siege.isOccupe()) {
                throw new RuntimeException("Siège déjà occupé : " + numero);
            }

            if (siege.isVerrouilleTemporaire()) {
                if (siege.getVerrouilleAt() != null &&
                        siege.getVerrouilleAt().isAfter(expiration)) {
                    throw new RuntimeException("Siège déjà réservé temporairement : " + numero);
                }
            }

            siege.setVerrouilleTemporaire(true);
            siege.setVerrouilleParReservationId(request.getReservationId());
            siege.setVerrouilleAt(LocalDateTime.now());

            siegeRepository.save(siege);
        }


    }

    @Transactional
    public Remboursement annulerReservation(Long reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Réservation introuvable"));

        if (reservation.getStatut() != StatutReservation.CONFIRMEE) {
            throw new IllegalStateException("Seules les réservations confirmées peuvent être annulées");
        }

        double tauxRemboursement = calculTauxRemboursement(reservation.getTrajet().getDateDepart());
        double montantRembourse = Math.round(reservation.getPrixTotal() * tauxRemboursement * 100.0) / 100.0;

        reservation.setStatut(StatutReservation.ANNULEE);
        reservationRepository.save(reservation);

        List<Ticket> tickets = ticketRepository.findByReservationId(reservationId);
        for (Ticket ticket : tickets) {
            ticket.setStatut(StatutTicket.ANNULE);
        }
        ticketRepository.saveAll(tickets);

        libererSiegesReservation(reservation, tickets);

        double prixInitial = reservation.getPrixTotal();
        String motif = "Annulation réservation #" + reservation.getId()
                + " (" + Math.round(tauxRemboursement * 100) + "% de "
                + prixInitial + " MAD)";

        reservation.setPrixTotal(prixInitial - montantRembourse);
        reservationRepository.save(reservation);

        Remboursement remb = new Remboursement();
        remb.setReservation(reservation);
        remb.setMontant(montantRembourse);
        remb.setMotif(motif);
        remb.setStatut(StatutRemboursement.EN_ATTENTE);
        remb.setPartiel(false);
        remb.setDateDemande(LocalDateTime.now());
        remb = remboursementRepository.save(remb);

        notificationProducer.envoyerNotification(
                "Demande de remboursement pour annulation réservation ID=" + reservation.getId()
                        + ", montant=" + montantRembourse
        );

        webSocketNotificationService.notifierAdmins("NOUVEAU_REMBOURSEMENT", Map.of(
                "id", remb.getId(),
                "reservationId", reservation.getId(),
                "montant", montantRembourse,
                "motif", motif,
                "type", "ANNULATION_RESERVATION"
        ));

        // Notifier les responsables de la compagnie pour validation
        Long compagnieId = reservation.getTrajet().getLigne().getCompagnie().getId();
        webSocketNotificationService.notifierResponsables(compagnieId, "NOUVEAU_REMBOURSEMENT", Map.of(
                "id", remb.getId(),
                "reservationId", reservation.getId(),
                "montant", montantRembourse,
                "motif", motif,
                "voyageurEmail", reservation.getVoyageur().getEmail(),
                "type", "ANNULATION_RESERVATION"
        ));

        return remb;
    }

    public static double calculTauxRemboursement(LocalDateTime dateDepart) {
        long heuresAvantDepart = Duration.between(LocalDateTime.now(), dateDepart).toHours();

        if (heuresAvantDepart > 72) return 0.95;
        if (heuresAvantDepart > 48) return 0.80;
        if (heuresAvantDepart > 24) return 0.60;
        if (heuresAvantDepart > 6)  return 0.40;
        if (heuresAvantDepart > 0)  return 0.20;
        return 0.0;
    }

    private void libererSiegesReservation(Reservation reservation, List<Ticket> tickets) {
        for (Ticket ticket : tickets) {
            if (ticket.getNumeroSiege() != null) {
                siegeRepository.findByTrajetIdAndNumeroSiege(
                        reservation.getTrajet().getId(),
                        ticket.getNumeroSiege()
                ).ifPresent(this::libererSiege);
            }
        }
    }

    private void libererSiege(Siege siege) {
        siege.setOccupe(false);
        siege.setBloque(false);
        siege.setGenreOccupant(null);
        siege.setEnfantSurGenoux(false);
        siege.setVerrouilleTemporaire(false);
        siege.setVerrouilleParReservationId(null);
        siege.setVerrouilleAt(null);
        siegeRepository.save(siege);
    }

    private GroupeVoyage trouverOuCreerGroupe(Reservation reservation) {
        return groupeVoyageRepository.findByReservationId(reservation.getId())
                .orElseGet(() -> {
                    GroupeVoyage groupe = new GroupeVoyage();
                    groupe.setOrganisateur(reservation.getVoyageur());
                    groupe.setReservation(reservation);
                    groupe.setTypeGroupe("MOI_SEUL");
                    groupe.setNombrePassagers(1);
                    groupe.setPlacementEffectue(false);
                    return groupeVoyageRepository.save(groupe);
                });
    }

    private static final int HEURES_MIN_MODIFICATION_TRAJET = 24;
    private static final double FRAIS_DEUXIEME_MODIFICATION = 20.0;

    @Transactional
    public ReservationResponseDTO modifierReservation(
            Long reservationId,
            ModificationReservationRequest request
    ) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Réservation introuvable"));

        verifierReservationModifiable(reservation);

        int nbModif = reservation.getNbModif() == null ? 0 : reservation.getNbModif();
        if (nbModif >= 1) {
            traiterPaiementSupplement(reservation, FRAIS_DEUXIEME_MODIFICATION, request.getNumeroCarte(), request.getDateExpiration(), request.getCvv());
        }

        Trajet nouveauTrajet = trajetRepository.findById(request.getNouveauTrajetId())
                .orElseThrow(() -> new IllegalArgumentException("Nouveau trajet introuvable"));

        verifierMemeLigne(reservation.getTrajet(), nouveauTrajet);

        List<Ticket> tickets = ticketRepository.findByReservationId(reservationId);
        verifierSiegesModification(request, tickets);

        libererSiegesReservation(reservation, tickets);
        occuperNouveauxSieges(nouveauTrajet, request.getNouveauxSieges());

        appliquerModification(reservation, nouveauTrajet);
        mettreAJourTickets(tickets, request.getNouveauxSieges());

        ticketRepository.saveAll(tickets);
        Reservation savedReservation = reservationRepository.save(reservation);

        GroupeVoyage groupe = trouverOuCreerGroupe(savedReservation);

        notificationProducer.envoyerNotification(
                "Réservation modifiée ID=" + savedReservation.getId()
                        + ", nbModif=" + savedReservation.getNbModif()
        );

        webSocketNotificationService.notifierVoyageur(
                savedReservation.getVoyageur().getEmail(),
                "MODIFICATION_RESERVATION",
                Map.of("reservationId", savedReservation.getId(), "nbModif", savedReservation.getNbModif())
        );

        return toResponse(savedReservation, groupe);
    }

    private void verifierReservationModifiable(Reservation reservation) {
        if (reservation.getStatut() != StatutReservation.CONFIRMEE) {
            throw new IllegalStateException("Seules les réservations confirmées peuvent être modifiées");
        }

        long heuresAvantDepart = Duration
                .between(LocalDateTime.now(), reservation.getTrajet().getDateDepart())
                .toHours();

        if (heuresAvantDepart < HEURES_MIN_MODIFICATION_TRAJET) {
            throw new IllegalStateException("Modification autorisée seulement avant 24h du départ");
        }
    }

    private void verifierMemeLigne(Trajet ancienTrajet, Trajet nouveauTrajet) {
        if (ancienTrajet.getLigne().getId().equals(nouveauTrajet.getLigne().getId())) {
            return;
        }

        String ancienDepart = normaliserVille(ancienTrajet.getLigne().getVilleDepart());
        String nouveauDepart = normaliserVille(nouveauTrajet.getLigne().getVilleDepart());
        String ancienArrivee = normaliserVille(ancienTrajet.getLigne().getVilleArrivee());
        String nouveauArrivee = normaliserVille(nouveauTrajet.getLigne().getVilleArrivee());

        if (!ancienDepart.equals(nouveauDepart) || !ancienArrivee.equals(nouveauArrivee)) {
            throw new IllegalStateException("Le nouveau trajet doit avoir le même départ et la même arrivée");
        }
    }

    private String normaliserVille(String ville) {
        return ville == null ? "" : ville.trim().toLowerCase();
    }

    private void verifierSiegesModification(
            ModificationReservationRequest request,
            List<Ticket> tickets
    ) {
        long ticketsAvecSiege = tickets.stream()
                .filter(ticket -> !ticket.isEnfantSurGenoux())
                .count();

        if (request.getNouveauxSieges() == null || request.getNouveauxSieges().size() != ticketsAvecSiege) {
            throw new IllegalArgumentException("Nombre de sièges invalide pour cette réservation");
        }
    }

    private void occuperNouveauxSieges(Trajet nouveauTrajet, List<String> numerosSieges) {
        for (String numeroSiege : numerosSieges) {
            Siege siege = siegeRepository
                    .findByTrajetIdAndNumeroSiege(nouveauTrajet.getId(), numeroSiege)
                    .orElseThrow(() -> new IllegalArgumentException("Siège introuvable : " + numeroSiege));

            if (siege.isOccupe() || siege.isBloque() || siege.isVerrouilleTemporaire()) {
                throw new IllegalStateException("Siège non disponible : " + numeroSiege);
            }

            siege.setOccupe(true);
            siege.setVerrouilleTemporaire(false);
            siege.setVerrouilleParReservationId(null);
            siege.setVerrouilleAt(null);
            siegeRepository.save(siege);
        }
    }

    private void appliquerModification(Reservation reservation, Trajet nouveauTrajet) {
        int nbModif = reservation.getNbModif() == null ? 0 : reservation.getNbModif();

        reservation.setTrajet(nouveauTrajet);
        reservation.setNbModif(nbModif + 1);

        if (nbModif >= 1) {
            reservation.setPrixTotal(reservation.getPrixTotal() + FRAIS_DEUXIEME_MODIFICATION);
        }
    }

    private void mettreAJourTickets(List<Ticket> tickets, List<String> nouveauxSieges) {
        int indexSiege = 0;

        for (Ticket ticket : tickets) {
            ticket.setQrCode(UUID.randomUUID().toString());
            ticket.setStatut(StatutTicket.ACTIF);

            if (!ticket.isEnfantSurGenoux()) {
                ticket.setNumeroSiege(nouveauxSieges.get(indexSiege));
                indexSiege++;
            }
        }
    }

    @Transactional
    public ReservationResponseDTO changerSieges(
            Long reservationId,
            ChangementSiegeRequest request
    ) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Réservation introuvable"));

        if (reservation.getStatut() != StatutReservation.CONFIRMEE) {
            throw new IllegalStateException("Seules les réservations confirmées peuvent changer de siège");
        }

        if (LocalDateTime.now().isAfter(reservation.getTrajet().getDateDepart())) {
            throw new IllegalStateException("Impossible de changer de siège après le départ");
        }

        int nbModif = reservation.getNbModif() == null ? 0 : reservation.getNbModif();
        if (nbModif >= 1) {
            traiterPaiementSupplement(reservation, FRAIS_DEUXIEME_MODIFICATION, request.getNumeroCarte(), request.getDateExpiration(), request.getCvv());
        }

        List<Ticket> tickets = ticketRepository.findByReservationId(reservationId);

        long nbSiegesAttendus = tickets.stream()
                .filter(t -> !t.isEnfantSurGenoux())
                .count();

        if (request.getNouveauxSieges() == null || request.getNouveauxSieges().size() != nbSiegesAttendus) {
            throw new IllegalArgumentException("Nombre de sièges invalide");
        }

        libererSiegesReservation(reservation, tickets);
        occuperNouveauxSieges(reservation.getTrajet(), request.getNouveauxSieges());

        int index = 0;
        for (Ticket ticket : tickets) {
            ticket.setQrCode(UUID.randomUUID().toString());
            if (!ticket.isEnfantSurGenoux()) {
                ticket.setNumeroSiege(request.getNouveauxSieges().get(index));
                index++;
            }
        }

        ticketRepository.saveAll(tickets);

        reservation.setNbModif(nbModif + 1);
        if (nbModif >= 1) {
            reservation.setPrixTotal(reservation.getPrixTotal() + FRAIS_DEUXIEME_MODIFICATION);
        }
        reservationRepository.save(reservation);

        GroupeVoyage groupe = trouverOuCreerGroupe(reservation);

        notificationProducer.envoyerNotification(
                "Changement de sièges réservation ID=" + reservation.getId()
                        + ", nbModif=" + (nbModif + 1)
        );

        webSocketNotificationService.notifierVoyageur(
                reservation.getVoyageur().getEmail(),
                "CHANGEMENT_SIEGES",
                Map.of("reservationId", reservation.getId(), "nbModif", nbModif + 1)
        );

        return toResponse(reservation, groupe);
    }
    @Transactional
    public void declarerBagage(String qrCode, String type) {

        Bagage bagage = bagageRepository.findByQrCodeBagage(qrCode)
                .orElseThrow(() -> new IllegalArgumentException("Bagage introuvable"));

        if (type == null) {
            throw new IllegalArgumentException("Type de déclaration requis");
        }

        switch (type.toUpperCase()) {
            case "PERDU" -> {
                bagage.setPerdu(true);
                bagage.setEndommage(false);
            }
            case "ENDOMMAGE" -> {
                bagage.setEndommage(true);
                bagage.setPerdu(false);
            }
            default -> throw new IllegalArgumentException("Type invalide (PERDU / ENDOMMAGE)");
        }

        bagageRepository.save(bagage);
    }

    public Page<Reservation> getReservations(Pageable pageable) {
        return reservationRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public List<Reservation> getReservationsForVoyageur(Long voyageurId) {
        List<Reservation> reservations = reservationRepository.findHistoriqueVoyageur(voyageurId);
        reservations.forEach(r -> {
            if (r.getBagages() != null) r.getBagages().size();
        });
        return reservations;
    }

    // =========================================================
    // CODE PROMO — Validation avant réservation
    // =========================================================

    public Map<String, Object> validerPromo(String code, Long trajetId) {
        Trajet trajet = trajetRepository.findById(trajetId)
                .orElseThrow(() -> new RuntimeException("Trajet non trouvé"));

        CodePromo promo = codePromoRepository.findByCode(code.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Code promo invalide"));

        if (!promo.isActif()) {
            throw new RuntimeException("Ce code promo a été désactivé");
        }
        if (promo.getDateExpiration().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Ce code promo a expiré");
        }
        if (promo.getNbUtilisationsMax() != null &&
                promo.getNbUtilisationsActuel() >= promo.getNbUtilisationsMax()) {
            throw new RuntimeException("Ce code promo a atteint sa limite d'utilisations");
        }

        Long trajetCompagnieId = trajet.getLigne().getCompagnie().getId();
        if (promo.getCompagnie() == null || !promo.getCompagnie().getId().equals(trajetCompagnieId)) {
            throw new RuntimeException("Ce code promo n'est pas valide pour cette compagnie");
        }

        return Map.of(
                "valid", true,
                "pourcentageReduction", promo.getPourcentageReduction(),
                "code", promo.getCode(),
                "compagnieNom", promo.getCompagnie().getNom()
        );
    }

    // =========================================================
    // BAGAGES — Déclaration à la réservation
    // =========================================================

    /**
     * Ajoute des bagages à une réservation existante.
     * Calcule automatiquement le surplus selon poids et volume (L×W×H).
     * Met à jour le prixTotal de la réservation.
     */
    @Transactional
    public List<BagageResponseDTO> ajouterBagages(Long reservationId, List<BagageRequest> bagageRequests) {

        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Réservation introuvable : " + reservationId));

        if (bagageRequests == null || bagageRequests.isEmpty()) {
            throw new IllegalArgumentException("La liste de bagages ne peut pas être vide");
        }

        List<Bagage> bagagesSauvegardes = new ArrayList<>();
        double totalSurplus = 0.0;

        for (BagageRequest req : bagageRequests) {
            if (req.getPoidsKg() == null || req.getPoidsKg() <= 0) {
                throw new IllegalArgumentException("Le poids du bagage doit être positif");
            }

            double volume = calculerVolume(req.getDimensionCm());
            double surplus = calculerSurplus(req.getPoidsKg(), volume);
            TypeBagage type = req.getTypeBagage() != null
                    ? req.getTypeBagage()
                    : detecterType(req.getPoidsKg(), volume);

            Bagage bagage = new Bagage();
            bagage.setReservation(reservation);
            bagage.setPoidsKg(req.getPoidsKg());
            bagage.setDimensionCm(req.getDimensionCm());
            bagage.setTypeBagage(type);
            bagage.setSurplusPrix(surplus);
            bagage.setScannéArrivee(false);
            bagage.setPerdu(false);
            bagage.setEndommage(false);
            // qrCodeBagage = null → sera généré au scan du chauffeur

            bagagesSauvegardes.add(bagageRepository.save(bagage));
            totalSurplus += surplus;
        }

        // Mettre à jour le prix total de la réservation
        reservation.setPrixTotal(reservation.getPrixTotal() + totalSurplus);
        reservationRepository.save(reservation);

        return bagagesSauvegardes.stream()
                .map(this::toBagageDTO)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public BagageResponseDTO supprimerBagage(Long reservationId, Long bagageId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Réservation introuvable"));

        Bagage bagage = bagageRepository.findById(bagageId)
                .orElseThrow(() -> new IllegalArgumentException("Bagage introuvable"));

        if (!bagage.getReservation().getId().equals(reservationId)) {
            throw new IllegalArgumentException("Ce bagage n'appartient pas à cette réservation");
        }

        double remboursementBagage = bagage.getSurplusPrix();
        bagageRepository.delete(bagage);

        reservation.setPrixTotal(Math.max(0, reservation.getPrixTotal() - remboursementBagage));
        reservationRepository.save(reservation);

        if (remboursementBagage > 0 && reservation.getStatut() == StatutReservation.CONFIRMEE) {
            String motif = "Suppression bagage #" + bagage.getId()
                    + " (" + bagage.getTypeBagage() + ", " + bagage.getPoidsKg() + "kg"
                    + ", remboursement " + remboursementBagage + " MAD)";

            Remboursement remb = new Remboursement();
            remb.setReservation(reservation);
            remb.setMontant(remboursementBagage);
            remb.setMotif(motif);
            remb.setStatut(StatutRemboursement.EN_ATTENTE);
            remb.setPartiel(true);
            remb.setDateDemande(LocalDateTime.now());
            remboursementRepository.save(remb);
        }

        return toBagageDTO(bagage);
    }

    @Transactional
    protected void traiterPaiementSupplement(Reservation reservation, double montant, String numeroCarte, String dateExpiration, String cvv) {
        Paiement paiement = paiementRepository.findByReservationId(reservation.getId())
                .orElseGet(Paiement::new);
        paiement.setReservation(reservation);
        paiement.setMontant(paiement.getMontant() == null ? montant : paiement.getMontant() + montant);
        paiement.setMethodePaiement("CARTE");
        if (paiement.getTransactionId() == null) {
            paiement.setTransactionId(UUID.randomUUID().toString());
        }
        paiement.setDatePaiement(LocalDateTime.now());
        paiement.setConfirme(true);
        paiementRepository.save(paiement);
    }

    @Transactional
    protected void traiterPaiementMembre(Reservation reservation, double montant, String numeroCarte, String dateExpiration, String cvv) {
        Paiement paiement = paiementRepository.findByReservationId(reservation.getId())
                .orElseGet(Paiement::new);
        paiement.setReservation(reservation);
        paiement.setMontant(paiement.getMontant() == null ? montant : paiement.getMontant() + montant);
        paiement.setMethodePaiement("CARTE");
        if (paiement.getTransactionId() == null) {
            paiement.setTransactionId(UUID.randomUUID().toString());
        }
        paiement.setDatePaiement(LocalDateTime.now());
        paiement.setConfirme(true);
        paiementRepository.save(paiement);
    }

    // ── Formule de tarification ────────────────────────────────

    /**
     * Calcule le volume en cm³ à partir du format "LxWxH".
     * Retourne 0 si le format est invalide.
     */
    private double calculerVolume(String dimensionCm) {
        if (dimensionCm == null || dimensionCm.isBlank()) return 0;
        String[] parts = dimensionCm.split("x");
        if (parts.length != 3) return 0;
        try {
            double l = Double.parseDouble(parts[0].trim());
            double w = Double.parseDouble(parts[1].trim());
            double h = Double.parseDouble(parts[2].trim());
            return l * w * h;
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    /**
     * Calcule le surplus en DH selon le poids (kg) et le volume (cm³).
     * Prend le maximum des deux barèmes.
     *
     * Barème poids :
     *   ≤ 15 kg        → 0 DH
     *   15 < x ≤ 20 kg → 50 DH
     *   20 < x ≤ 30 kg → 75 DH
     *   30 < x ≤ 40 kg → 100 DH
     *   > 40 kg        → 150 DH
     *
     * Barème volume (cm³) :
     *   ≤ 60 000       → 0 DH   (ex: 45x35x38)
     *   60k – 120k     → 50 DH  (ex: 60x40x30)
     *   120k – 200k    → 75 DH  (ex: 70x50x40)
     *   200k – 300k    → 100 DH (ex: 80x60x50)
     *   > 300k         → 150 DH (ex: 90x70x50)
     */
    private double calculerSurplus(double poidsKg, double volume) {
        // Barème poids
        double surplusPoids;
        if      (poidsKg > 40) surplusPoids = 150;
        else if (poidsKg > 30) surplusPoids = 100;
        else if (poidsKg > 20) surplusPoids = 75;
        else if (poidsKg > 15) surplusPoids = 50;
        else                   surplusPoids = 0;

        // Barème volume
        double surplusVolume;
        if      (volume > 300_000) surplusVolume = 150;
        else if (volume > 200_000) surplusVolume = 100;
        else if (volume > 120_000) surplusVolume = 75;
        else if (volume > 60_000)  surplusVolume = 50;
        else                       surplusVolume = 0;

        return Math.max(surplusPoids, surplusVolume);
    }

    /**
     * Détecte automatiquement le type de bagage selon poids + volume :
     *   CABINE        : poids ≤ 15 kg ET volume ≤ 60 000 cm³
     *   SURDIMENSIONNE: poids > 30 kg OU volume > 200 000 cm³
     *   SOUTE         : tous les autres cas
     */
    private TypeBagage detecterType(double poidsKg, double volume) {
        if (poidsKg > 30 || volume > 200_000) return TypeBagage.SURDIMENSIONNE;
        if (poidsKg <= 15 && volume <= 60_000) return TypeBagage.CABINE;
        return TypeBagage.SOUTE;
    }

    private BagageResponseDTO toBagageDTO(Bagage bagage) {
        BagageResponseDTO dto = new BagageResponseDTO();
        dto.setId(bagage.getId());
        dto.setTypeBagage(bagage.getTypeBagage());
        dto.setPoidsKg(bagage.getPoidsKg());
        dto.setDimensionCm(bagage.getDimensionCm());
        dto.setSurplusPrix(bagage.getSurplusPrix());
        dto.setQrCodeBagage(bagage.getQrCodeBagage()); // null jusqu'au scan
        dto.setReservationId(bagage.getReservation().getId());
        return dto;
    }

}