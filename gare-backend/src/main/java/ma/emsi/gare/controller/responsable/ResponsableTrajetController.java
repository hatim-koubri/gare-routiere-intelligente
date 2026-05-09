package ma.emsi.gare.controller.responsable;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.TrajetRequest;
import ma.emsi.gare.dto.response.ResponsableTrajetResponseDTO;
import ma.emsi.gare.entity.Chauffeur;
import ma.emsi.gare.entity.Quai;
import ma.emsi.gare.entity.Trajet;
import ma.emsi.gare.service.ResponsableTrajetService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/responsable/trajets")
@RequiredArgsConstructor
public class ResponsableTrajetController {

    private final ResponsableTrajetService responsableTrajetService;

    @PostMapping
    public ResponseEntity<ResponsableTrajetResponseDTO> creer(
            @Valid @RequestBody TrajetRequest request,
            Authentication authentication
    ) {
        Trajet trajet = responsableTrajetService.creerTrajet(request, authentication);
        return ResponseEntity.ok(toDto(trajet));
    }

    @GetMapping
    public ResponseEntity<List<ResponsableTrajetResponseDTO>> getMesTrajets(
            Authentication authentication
    ) {
        List<ResponsableTrajetResponseDTO> trajets = responsableTrajetService
                .getMesTrajets(authentication)
                .stream()
                .map(this::toDto)
                .toList();

        return ResponseEntity.ok(trajets);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResponsableTrajetResponseDTO> getTrajetById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        Trajet trajet = responsableTrajetService.getTrajetById(id, authentication);
        return ResponseEntity.ok(toDto(trajet));
    }

    @PatchMapping("/{id}/annuler")
    public ResponseEntity<ResponsableTrajetResponseDTO> annulerTrajet(
            @PathVariable Long id,
            Authentication authentication
    ) {
        Trajet trajet = responsableTrajetService.annulerTrajet(id, authentication);
        return ResponseEntity.ok(toDto(trajet));
    }

    private ResponsableTrajetResponseDTO toDto(Trajet trajet) {
        ResponsableTrajetResponseDTO dto = new ResponsableTrajetResponseDTO();

        dto.setId(trajet.getId());

        dto.setLigneId(trajet.getLigne().getId());
        dto.setVilleDepart(trajet.getLigne().getVilleDepart());
        dto.setVilleArrivee(trajet.getLigne().getVilleArrivee());

        dto.setBusId(trajet.getBus().getId());
        dto.setBusMatricule(trajet.getBus().getMatricule());

        Chauffeur chauffeur = trajet.getChauffeur();
        if (chauffeur != null) {
            dto.setChauffeurId(chauffeur.getId());
            dto.setChauffeurNom(chauffeur.getNom());
            dto.setChauffeurPrenom(chauffeur.getPrenom());
        }

        Quai quai = trajet.getQuai();
        if (quai != null) {
            dto.setQuaiId(quai.getId());
            dto.setQuaiNumero(quai.getNumero());
        }

        dto.setDateDepart(trajet.getDateDepart());
        dto.setDateArriveePrevue(trajet.getDateArriveePrevue());
        dto.setDateArriveeReelle(trajet.getDateArriveeReelle());
        dto.setStatut(trajet.getStatut().name());
        dto.setRetardMinutes(trajet.getRetardMinutes());
        dto.setNbReservations(trajet.getNbReservations());

        return dto;
    }
}