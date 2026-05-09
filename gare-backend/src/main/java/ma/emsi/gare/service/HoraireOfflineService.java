package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.response.HoraireOfflineResponse;
import ma.emsi.gare.dto.response.HoraireOfflineResponse.ArretOfflineDTO;
import ma.emsi.gare.dto.response.HoraireOfflineResponse.TrajetOfflineDTO;
import ma.emsi.gare.entity.Arret;
import ma.emsi.gare.entity.Trajet;
import ma.emsi.gare.enums.StatutTrajet;
import ma.emsi.gare.repository.TrajetRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HoraireOfflineService {

    private final TrajetRepository trajetRepository;

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    // ===== Génère les horaires pour les 7 prochains jours =====
    public HoraireOfflineResponse genererHoraires7Jours() {
        return genererHoraires(7);
    }

    // ===== Génère les horaires pour N jours (période personnalisable) =====
    public HoraireOfflineResponse genererHoraires(int nombreJours) {
        LocalDateTime debut = LocalDateTime.now();
        LocalDateTime fin = debut.plusDays(nombreJours);

        List<StatutTrajet> statutsActifs = List.of(
                StatutTrajet.PLANIFIE,
                StatutTrajet.EN_COURS
        );

        List<Trajet> trajets = trajetRepository
                .findByDateDepartBetweenAndStatutIn(debut, fin, statutsActifs);

        List<TrajetOfflineDTO> trajetsDTO = trajets.stream()
                .map(this::convertirTrajet)
                .toList();

        return HoraireOfflineResponse.builder()
                .dateGeneration(LocalDateTime.now().format(FORMATTER))
                .periodeDebut(debut.format(FORMATTER))
                .periodeFin(fin.format(FORMATTER))
                .nombreTrajets(trajetsDTO.size())
                .trajets(trajetsDTO)
                .build();
    }

    // ===== Conversion Trajet → DTO =====
    private TrajetOfflineDTO convertirTrajet(Trajet trajet) {

        // Calcul sièges disponibles avec null safety
        int siegesDisponibles = 0;
        if (trajet.getBus() != null) {
            long siegesOccupes = trajet.getSieges() != null
                    ? trajet.getSieges().stream()
                        .filter(s -> s.isOccupe() || s.isBloque())
                        .count()
                    : 0;
            siegesDisponibles = trajet.getBus().getNbSieges() - (int) siegesOccupes;
        }

        // Conversion arrêts avec null safety
        List<ArretOfflineDTO> arretsDTO = List.of();
        if (trajet.getLigne() != null && trajet.getLigne().getArrets() != null) {
            arretsDTO = trajet.getLigne().getArrets().stream()
                    .map(arret -> convertirArret(arret, trajet))
                    .toList();
        }

        String villeDepart = trajet.getLigne() != null ? trajet.getLigne().getVilleDepart() : "N/A";
        String villeArrivee = trajet.getLigne() != null ? trajet.getLigne().getVilleArrivee() : "N/A";
        String compagnie = trajet.getLigne() != null && trajet.getLigne().getCompagnie() != null
                ? trajet.getLigne().getCompagnie().getNom() : "N/A";
        Double prixBase = trajet.getLigne() != null ? trajet.getLigne().getPrixBase() : 0.0;

        return TrajetOfflineDTO.builder()
                .trajetId(trajet.getId())
                .villeDepart(villeDepart)
                .villeArrivee(villeArrivee)
                .compagnie(compagnie)
                .prixBase(prixBase)
                .dateDepart(trajet.getDateDepart().format(FORMATTER))
                .dateArriveePrevue(
                        trajet.getDateArriveePrevue() != null
                                ? trajet.getDateArriveePrevue().format(FORMATTER)
                                : "N/A"
                )
                .prixBase(prixBase)
                .nbSiegesDisponibles(siegesDisponibles)
                .statut(trajet.getStatut().name())
                .arrets(arretsDTO)
                .build();
    }

    // ===== Conversion Arret → DTO =====
    private ArretOfflineDTO convertirArret(Arret arret, Trajet trajet) {
        // Calcul heure de passage = heure départ + offset
        LocalDateTime heurePassage = trajet.getDateDepart();
        if (arret.getHeurePrevueOffsetMinutes() != null) {
            heurePassage = heurePassage.plusMinutes(arret.getHeurePrevueOffsetMinutes());
        }

        return ArretOfflineDTO.builder()
                .ville(arret.getVille())
                .ordre(arret.getOrdre())
                .heurePassage(heurePassage.format(FORMATTER))
                .dureePauseMinutes(arret.getDureePauseMinutes())
                .build();
    }
}