package ma.emsi.gare.controller.voyageur;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.RechercheTrajetRequest;
import ma.emsi.gare.dto.response.ComparaisonCompagnieDTO;
import ma.emsi.gare.dto.response.TrajetResponseDTO;
import ma.emsi.gare.service.VoyageurRechercheService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/voyageur/recherche")
@RequiredArgsConstructor
public class VoyageurRechercheController {

    private final VoyageurRechercheService voyageurRechercheService;

    @PostMapping("/trajets-directs")
    public List<TrajetResponseDTO> rechercherTrajetsDirects(
            @RequestBody RechercheTrajetRequest request
    ) {
        return voyageurRechercheService.rechercherTrajetsDirects(request);
    }

    @PostMapping("/trajets-correspondances")
    public List<List<TrajetResponseDTO>> rechercherCorrespondances(
            @RequestBody RechercheTrajetRequest request
    ) {
        return voyageurRechercheService.rechercherAvecCorrespondances(request);
    }

    @PostMapping("/trajets-filtres")
    public List<TrajetResponseDTO> rechercherAvecFiltres(
            @RequestBody RechercheTrajetRequest request
    ) {
        return voyageurRechercheService.rechercherAvecFiltres(request);
    }

    @GetMapping("/recommandations")
    public List<TrajetResponseDTO> recommanderTrajets(
            @RequestParam Long voyageurId
    ) {
        return voyageurRechercheService.recommanderTrajets(voyageurId);
    }

    @GetMapping("/comparaison")
    public List<ComparaisonCompagnieDTO> comparerCompagnies(
            @RequestParam String villeDepart,
            @RequestParam String villeArrivee
    ) {
        return voyageurRechercheService.comparerCompagnies(villeDepart, villeArrivee);
    }
}