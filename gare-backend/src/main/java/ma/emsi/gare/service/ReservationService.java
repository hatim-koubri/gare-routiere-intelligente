package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.MembreGroupeRequest;
import ma.emsi.gare.dto.request.ReservationRequest;
import ma.emsi.gare.dto.request.VerrouillageSiegeRequest;
import ma.emsi.gare.dto.response.ReservationResponseDTO;
import ma.emsi.gare.dto.response.SiegeResponseDTO;
import ma.emsi.gare.entity.*;
import ma.emsi.gare.enums.CategorieTarifaire;
import ma.emsi.gare.enums.StatutReservation;
import ma.emsi.gare.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

        if (enfantSurGenoux) {
            return 0.0;
        }

        double prix = prixBase != null ? prixBase : 0.0;

        if (categorie == CategorieTarifaire.ETUDIANT) {
            prix *= 0.75;
        } else if (categorie == CategorieTarifaire.ENFANT) {
            prix *= 0.50;
        } else if (categorie == CategorieTarifaire.MILITAIRE) {
            prix *= 0.70;
        } else if (categorie == CategorieTarifaire.SENIOR) {
            prix *= 0.80;
        }

        return prix;
    }

    private ReservationResponseDTO toResponse(
            Reservation reservation,
            GroupeVoyage groupe,
            List<String> nomsMembres
    ) {
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

    public List<SiegeResponseDTO> getPlanBus(Long trajetId) {

        var sieges = siegeRepository.findByTrajetId(trajetId);

        return sieges.stream().map(s -> {
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

    public List<String> proposerSiegesGroupe(Long trajetId, int nombrePlaces) {

        var sieges = siegeRepository.findSiegesLibresOrdonnes(trajetId);

        for (int i = 0; i < sieges.size(); i++) {

            List<Siege> bloc = new ArrayList<>();
            bloc.add(sieges.get(i));

            for (int j = i + 1; j < sieges.size(); j++) {

                Siege precedent = sieges.get(j - 1);
                Siege courant = sieges.get(j);

                // même rangée + positions consécutives
                if (courant.getNumeroRangee().equals(precedent.getNumeroRangee())) {
                    bloc.add(courant);
                } else {
                    break;
                }

                if (bloc.size() == nombrePlaces) {
                    return bloc.stream()
                            .map(Siege::getNumeroSiege)
                            .toList();
                }
            }
        }

        return new ArrayList<>();
    }

    @Transactional
    public void verrouillerSieges(VerrouillageSiegeRequest request) {

        // 1. Libérer sièges expirés (10 minutes)
        LocalDateTime expiration = LocalDateTime.now().minusMinutes(10);
        siegeRepository.libererSiegesExpires(expiration);

        // 2. Vérification limite anti-hacker (max 5 sièges)
        if (request.getNumerosSieges().size() > 5) {
            throw new RuntimeException("Maximum 5 sièges par réservation");
        }

        for (String numero : request.getNumerosSieges()) {

            Siege siege = siegeRepository
                    .findByTrajetIdAndNumeroSiege(request.getTrajetId(), numero)
                    .orElseThrow(() -> new RuntimeException("Siège introuvable"));

            // 3. Vérifier disponibilité
            if (siege.isOccupe()) {
                throw new RuntimeException("Siège déjà occupé : " + numero);
            }

            if (siege.isVerrouilleTemporaire()) {

                // Vérifier expiration
                if (siege.getVerrouilleAt() != null &&
                        siege.getVerrouilleAt().isAfter(expiration)) {
                    throw new RuntimeException("Siège déjà réservé temporairement : " + numero);
                }
            }

            // 4. Verrouiller
            siege.setVerrouilleTemporaire(true);
            siege.setVerrouilleParReservationId(request.getReservationId());
            siege.setVerrouilleAt(LocalDateTime.now());

            siegeRepository.save(siege);
        }
    }
}