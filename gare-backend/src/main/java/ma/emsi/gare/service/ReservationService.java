package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.BagageRequest;
import ma.emsi.gare.dto.request.MembreGroupeRequest;
import ma.emsi.gare.dto.request.ReservationRequest;
import ma.emsi.gare.dto.request.VerrouillageSiegeRequest;
import ma.emsi.gare.dto.response.BagageResponseDTO;
import ma.emsi.gare.dto.response.ReservationResponseDTO;
import ma.emsi.gare.dto.response.SiegeResponseDTO;
import ma.emsi.gare.entity.*;
import ma.emsi.gare.enums.CategorieTarifaire;
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

import ma.emsi.gare.dto.request.ModificationReservationRequest;
import ma.emsi.gare.enums.StatutTicket;
import java.time.Duration;
import java.util.UUID;

import ma.emsi.gare.enums.StatutTicket;
import java.time.Duration;

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

        List<String> nomsMembres = new ArrayList<>();
        double total = 0.0;

        for (MembreGroupeRequest membreRequest : request.getMembres()) {

            MembreGroupe membre = new MembreGroupe();
            membre.setGroupe(savedGroupe);

            if (membreRequest.getVoyageurId() != null) {
                Voyageur membreVoyageur = voyageurRepository.findById(membreRequest.getVoyageurId())
                        .orElseThrow(() -> new RuntimeException("Voyageur membre non trouvé"));
                membre.setVoyageur(membreVoyageur);
            }

            membre.setNomManuel(membreRequest.getNomManuel());
            membre.setPrenomManuel(membreRequest.getPrenomManuel());
            membre.setSexe(membreRequest.getSexe());
            membre.setAge(membreRequest.getAge());
            membre.setLienOrganisateur(membreRequest.getLienOrganisateur());
            membre.setEnfantSurGenoux(membreRequest.isEnfantSurGenoux());

            CategorieTarifaire categorie = membreRequest.getCategorieTarifaire() != null
                    ? membreRequest.getCategorieTarifaire()
                    : CategorieTarifaire.NORMAL;

            membre.setCategorieTarifaire(categorie);

            double prixMembre = calculPrixSimple(trajet.getLigne().getPrixBase(), categorie, membreRequest.isEnfantSurGenoux());
            membre.setPrixMembre(prixMembre);
            total += prixMembre;

            MembreGroupe savedMembre = membreGroupeRepository.save(membre);

            if (membreRequest.getPreferenceVoisinage() != null) {
                PreferenceVoisinage preference = new PreferenceVoisinage();
                preference.setMembre(savedMembre);
                preference.setAccepteSexeOppose(membreRequest.getPreferenceVoisinage().isAccepteSexeOppose());
                preference.setPreferencePosition(membreRequest.getPreferenceVoisinage().getPreferencePosition());
                preference.setPrefereCoteMembreId(membreRequest.getPreferenceVoisinage().getPrefereCoteMembreId());
                preferenceVoisinageRepository.save(preference);
            }

            nomsMembres.add(
                    (membreRequest.getPrenomManuel() != null ? membreRequest.getPrenomManuel() : "")
                            + " "
                            + (membreRequest.getNomManuel() != null ? membreRequest.getNomManuel() : "")
            );
        }

        savedReservation.setPrixTotal(total);
        savedReservation = reservationRepository.save(savedReservation);

        return toResponse(savedReservation, savedGroupe, nomsMembres);
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

    private ReservationResponseDTO toResponse(Reservation reservation, GroupeVoyage groupe, List<String> nomsMembres) {
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
        dto.setMembres(nomsMembres);
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
    public double annulerReservation(Long reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Réservation introuvable"));

        if (reservation.getStatut() != StatutReservation.CONFIRMEE) {
            throw new IllegalStateException("Seules les réservations confirmées peuvent être annulées");
        }

        double tauxRemboursement = calculTauxRemboursement(reservation.getTrajet().getDateDepart());
        double montantRembourse = reservation.getPrixTotal() * tauxRemboursement;

        reservation.setStatut(StatutReservation.ANNULEE);
        reservationRepository.save(reservation);

        List<Ticket> tickets = ticketRepository.findByReservationId(reservationId);
        for (Ticket ticket : tickets) {
            ticket.setStatut(StatutTicket.ANNULE);
        }
        ticketRepository.saveAll(tickets);

        libererSiegesReservation(reservation, tickets);

        notificationProducer.envoyerNotification(
                "Réservation annulée ID=" + reservation.getId()
                        + ", montant remboursé=" + montantRembourse
        );

        return montantRembourse;
    }

    private double calculTauxRemboursement(LocalDateTime dateDepart) {
        long heuresAvantDepart = Duration.between(LocalDateTime.now(), dateDepart).toHours();

        if (heuresAvantDepart > 48) {
            return 0.75;
        }

        if (heuresAvantDepart > 0) {
            return 0.50;
        }

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

        GroupeVoyage groupe = groupeVoyageRepository.findByReservationId(savedReservation.getId())
                .orElseThrow(() -> new IllegalStateException("Groupe voyage introuvable"));

        List<String> nomsMembres = membreGroupeRepository.findByGroupeId(groupe.getId())
                .stream()
                .map(membre -> membre.getPrenomManuel() + " " + membre.getNomManuel())
                .toList();

        notificationProducer.envoyerNotification(
                "Réservation modifiée ID=" + savedReservation.getId()
                        + ", nbModif=" + savedReservation.getNbModif()
        );


        return toResponse(savedReservation, groupe, nomsMembres);
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
            List<String> nouveauxSieges
    ) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Réservation introuvable"));

        if (reservation.getStatut() != StatutReservation.CONFIRMEE) {
            throw new IllegalStateException("Seules les réservations confirmées peuvent changer de siège");
        }

        if (LocalDateTime.now().isAfter(reservation.getTrajet().getDateDepart())) {
            throw new IllegalStateException("Impossible de changer de siège après le départ");
        }

        List<Ticket> tickets = ticketRepository.findByReservationId(reservationId);

        long nbSiegesAttendus = tickets.stream()
                .filter(t -> !t.isEnfantSurGenoux())
                .count();

        if (nouveauxSieges == null || nouveauxSieges.size() != nbSiegesAttendus) {
            throw new IllegalArgumentException("Nombre de sièges invalide");
        }

        // 🔥 libérer anciens sièges
        libererSiegesReservation(reservation, tickets);

        // 🔥 occuper nouveaux sièges
        occuperNouveauxSieges(reservation.getTrajet(), nouveauxSieges);

        // 🔥 update tickets + QR
        int index = 0;
        for (Ticket ticket : tickets) {
            ticket.setQrCode(UUID.randomUUID().toString());

            if (!ticket.isEnfantSurGenoux()) {
                ticket.setNumeroSiege(nouveauxSieges.get(index));
                index++;
            }
        }

        ticketRepository.saveAll(tickets);

        GroupeVoyage groupe = groupeVoyageRepository.findByReservationId(reservation.getId())
                .orElseThrow(() -> new IllegalStateException("Groupe introuvable"));

        List<String> noms = membreGroupeRepository.findByGroupeId(groupe.getId())
                .stream()
                .map(m -> m.getPrenomManuel() + " " + m.getNomManuel())
                .toList();

        notificationProducer.envoyerNotification(
                "Changement de sièges réservation ID=" + reservation.getId()
        );

        return toResponse(reservation, groupe, noms);
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
        List<Reservation> reservations = reservationRepository.findByVoyageurId(voyageurId);
        // Force l'initialisation des collections pour éviter le LazyInitializationException
        reservations.forEach(r -> {
            if (r.getTickets() != null) r.getTickets().size();
            if (r.getBagages() != null) r.getBagages().size();
        });
        return reservations;
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