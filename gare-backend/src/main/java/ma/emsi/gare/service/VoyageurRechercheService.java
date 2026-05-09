package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.RechercheTrajetRequest;
import ma.emsi.gare.dto.response.ComparaisonCompagnieDTO;
import ma.emsi.gare.dto.response.TrajetResponseDTO;
import ma.emsi.gare.enums.StatutTrajet;
import ma.emsi.gare.mapper.GareMapper;
import ma.emsi.gare.repository.AvisRepository;
import ma.emsi.gare.repository.TrajetRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VoyageurRechercheService {

    private final TrajetRepository trajetRepository;
    private final GareMapper gareMapper;
    private final AvisRepository avisRepository;

    public List<TrajetResponseDTO> rechercherTrajetsDirects(RechercheTrajetRequest request) {

        if (request.getVilleDepart() == null || request.getVilleArrivee() == null || request.getDate() == null) {
            throw new RuntimeException("Ville de départ, ville d'arrivée et date sont obligatoires");
        }

        LocalDateTime debut = request.getDate().atStartOfDay();
        LocalDateTime fin = request.getDate().atTime(23, 59, 59);

        var dtos = gareMapper.toTrajetDTOList(
                trajetRepository.findByVillePeriodeEtCompagnie(
                        request.getVilleDepart(),
                        request.getVilleArrivee(),
                        debut,
                        fin,
                        List.of(StatutTrajet.PLANIFIE),
                        request.getCompagnieId()
                )
        );
        enrichirAvecNoteCompagnie(dtos);
        return dtos;
    }

    public List<List<TrajetResponseDTO>> rechercherAvecCorrespondances(RechercheTrajetRequest request) {

        if (request.getVilleDepart() == null || request.getVilleArrivee() == null || request.getDate() == null) {
            throw new RuntimeException("Ville de départ, ville d'arrivée et date sont obligatoires");
        }

        LocalDateTime debut = request.getDate().atStartOfDay();
        LocalDateTime fin = request.getDate().atTime(23, 59, 59);

        List<StatutTrajet> statuts = List.of(StatutTrajet.PLANIFIE);

        var tousLesTrajetsDuJour = trajetRepository.findByDateDepartBetweenAndStatutIn(
                debut,
                fin,
                statuts
        );

        List<List<TrajetResponseDTO>> resultats = new java.util.ArrayList<>();

        for (var trajet1 : tousLesTrajetsDuJour) {

            if (!trajet1.getLigne().getVilleDepart().equalsIgnoreCase(request.getVilleDepart())) {
                continue;
            }

            String villeCorrespondance = trajet1.getLigne().getVilleArrivee();

            if (villeCorrespondance.equalsIgnoreCase(request.getVilleArrivee())) {
                continue;
            }

            for (var trajet2 : tousLesTrajetsDuJour) {

                if (!trajet2.getLigne().getVilleDepart().equalsIgnoreCase(villeCorrespondance)) {
                    continue;
                }

                if (!trajet2.getLigne().getVilleArrivee().equalsIgnoreCase(request.getVilleArrivee())) {
                    continue;
                }

                if (!trajet2.getDateDepart().isAfter(trajet1.getDateDepart().plusMinutes(30))) {
                    continue;
                }

                var dto1 = gareMapper.toTrajetDTO(trajet1);
                var dto2 = gareMapper.toTrajetDTO(trajet2);
                enrichirAvecNoteCompagnie(List.of(dto1, dto2));
                resultats.add(List.of(dto1, dto2));
            }
        }

        return resultats;
    }

    public List<TrajetResponseDTO> rechercherAvecFiltres(RechercheTrajetRequest request) {
        if (request.getVilleDepart() == null || request.getVilleArrivee() == null) {
            throw new RuntimeException("Ville de départ et ville d'arrivée sont obligatoires");
        }

        LocalDateTime debut;
        LocalDateTime fin;

        if (request.getDateDebut() != null && request.getDateFin() != null) {
            debut = request.getDateDebut().atStartOfDay();
            fin = request.getDateFin().atTime(23, 59, 59);
        } else if (request.getDate() != null) {
            debut = request.getDate().atStartOfDay();
            fin = request.getDate().atTime(23, 59, 59);
        } else {
            debut = LocalDateTime.now();
            fin = debut.plusMonths(1);
        }

        var trajets = trajetRepository.findByVillePeriodeEtCompagnie(
                request.getVilleDepart(),
                request.getVilleArrivee(),
                debut,
                fin,
                List.of(StatutTrajet.PLANIFIE),
                request.getCompagnieId()
        );

        var filtres = trajets.stream()
                .filter(t -> request.getPrixMin() == null || t.getLigne().getPrixBase() >= request.getPrixMin())
                .filter(t -> request.getPrixMax() == null || t.getLigne().getPrixBase() <= request.getPrixMax())
                .filter(t -> request.getHeureDepartMin() == null || t.getDateDepart().getHour() >= request.getHeureDepartMin())
                .filter(t -> request.getHeureDepartMax() == null || t.getDateDepart().getHour() <= request.getHeureDepartMax())
                .filter(t -> request.getNbArretsMax() == null || t.getLigne().getArrets().size() <= request.getNbArretsMax())
                .toList();

        var dtos = gareMapper.toTrajetDTOList(filtres);
        enrichirAvecNoteCompagnie(dtos);

        if (request.getNoteMin() != null) {
            dtos = dtos.stream()
                    .filter(dto -> dto.getCompagnieNoteMoyenne() >= request.getNoteMin())
                    .toList();
        }

        return dtos;
    }

    public List<TrajetResponseDTO> recommanderTrajets(Long voyageurId) {

        // 1. récupérer historique
        var trajetsHistoriques = trajetRepository.findByVoyageurId(voyageurId);

        if (trajetsHistoriques.isEmpty()) {
            return List.of();
        }

        // 2. prendre le trajet le plus fréquent (simplifié = dernier)
        var dernierTrajet = trajetsHistoriques.get(0);

        String villeDepart = dernierTrajet.getLigne().getVilleDepart();
        String villeArrivee = dernierTrajet.getLigne().getVilleArrivee();

        // 3. chercher trajets futurs similaires
        var maintenant = LocalDateTime.now();

        var trajets = trajetRepository.findByVillePeriodeEtCompagnie(
                villeDepart,
                villeArrivee,
                maintenant,
                maintenant.plusDays(30),
                List.of(StatutTrajet.PLANIFIE),
                null
        );

        var dtos = gareMapper.toTrajetDTOList(trajets);
        enrichirAvecNoteCompagnie(dtos);
        return dtos;
    }

    private void enrichirAvecNoteCompagnie(List<TrajetResponseDTO> dtos) {
        for (TrajetResponseDTO dto : dtos) {
            if (dto.getCompagnieId() != null) {
                Double avg = avisRepository.avgNoteByCompagnieId(dto.getCompagnieId());
                Long count = avisRepository.countByCompagnieId(dto.getCompagnieId());
                dto.setCompagnieNoteMoyenne(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
                dto.setCompagnieNbAvis(count != null ? count.intValue() : 0);
            }
        }
    }

    public List<ComparaisonCompagnieDTO> comparerCompagnies(String villeDepart, String villeArrivee) {

        var maintenant = LocalDateTime.now();

        var trajets = trajetRepository.findByVillePeriodeEtCompagnie(
                villeDepart,
                villeArrivee,
                maintenant,
                maintenant.plusDays(30),
                List.of(StatutTrajet.PLANIFIE),
                null
        );

        return trajets.stream()
                .collect(
                        java.util.stream.Collectors.toMap(
                                t -> t.getLigne().getCompagnie().getId(), // clé = compagnie unique
                                t -> {

                                    String compagnie = t.getLigne().getCompagnie().getNom();
                                    double prix = t.getLigne().getPrixBase();

                                    long duree = java.time.Duration.between(
                                            t.getDateDepart(),
                                            t.getDateArriveePrevue()
                                    ).toMinutes();

                                    double note = t.getLigne().getCompagnie().getNoteMoyenne();

                                    return new ComparaisonCompagnieDTO(
                                            compagnie,
                                            prix,
                                            duree,
                                            note
                                    );
                                },
                                (existing, replacement) -> existing // éviter doublons
                        )
                )
                .values()
                .stream()
                .toList();
    }

}