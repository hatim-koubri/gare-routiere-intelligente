package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.RechercheTrajetRequest;
import ma.emsi.gare.dto.response.TrajetResponseDTO;
import ma.emsi.gare.enums.StatutTrajet;
import ma.emsi.gare.mapper.GareMapper;
import ma.emsi.gare.repository.TrajetRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VoyageurRechercheService {

    private final TrajetRepository trajetRepository;
    private final GareMapper gareMapper;

    public List<TrajetResponseDTO> rechercherTrajetsDirects(RechercheTrajetRequest request) {

        if (request.getVilleDepart() == null || request.getVilleArrivee() == null || request.getDate() == null) {
            throw new RuntimeException("Ville de départ, ville d'arrivée et date sont obligatoires");
        }

        LocalDateTime debut = request.getDate().atStartOfDay();
        LocalDateTime fin = request.getDate().atTime(23, 59, 59);

        return gareMapper.toTrajetDTOList(
                trajetRepository.findByVillePeriodeEtCompagnie(
                        request.getVilleDepart(),
                        request.getVilleArrivee(),
                        debut,
                        fin,
                        List.of(StatutTrajet.PLANIFIE),
                        request.getCompagnieId()
                )
        );
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

                resultats.add(List.of(
                        gareMapper.toTrajetDTO(trajet1),
                        gareMapper.toTrajetDTO(trajet2)
                ));
            }
        }

        return resultats;
    }

    public List<TrajetResponseDTO> rechercherAvecFiltres(RechercheTrajetRequest request) {
        if (request.getVilleDepart() == null || request.getVilleArrivee() == null || request.getDate() == null) {
            throw new RuntimeException("Ville de départ, ville d'arrivée et date sont obligatoires");
        }

        LocalDateTime debut = request.getDate().atStartOfDay();
        LocalDateTime fin = request.getDate().atTime(23, 59, 59);

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

        return gareMapper.toTrajetDTOList(filtres);
    }

}