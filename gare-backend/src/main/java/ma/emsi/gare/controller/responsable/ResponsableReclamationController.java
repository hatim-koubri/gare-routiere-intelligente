package ma.emsi.gare.controller.responsable;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.ReponseReclamationRequest;
import ma.emsi.gare.dto.response.ReclamationResponseDTO;
import ma.emsi.gare.entity.Reclamation;
import ma.emsi.gare.service.ResponsableReclamationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/responsable/reclamations")
@RequiredArgsConstructor
public class ResponsableReclamationController {

    private final ResponsableReclamationService
            responsableReclamationService;

    @GetMapping
    public ResponseEntity<List<ReclamationResponseDTO>>
    getMesReclamations(Authentication authentication) {

        List<ReclamationResponseDTO> reclamations =
                responsableReclamationService
                        .getMesReclamations(authentication)
                        .stream()
                        .map(this::toDto)
                        .toList();

        return ResponseEntity.ok(reclamations);
    }

    @PatchMapping("/{id}/reponse")
    public ResponseEntity<ReclamationResponseDTO>
    repondre(
            @PathVariable Long id,
            @Valid @RequestBody ReponseReclamationRequest request,
            Authentication authentication
    ) {

        Reclamation reclamation =
                responsableReclamationService
                        .repondre(id, request, authentication);

        return ResponseEntity.ok(toDto(reclamation));
    }

    private ReclamationResponseDTO toDto(
            Reclamation reclamation
    ) {

        ReclamationResponseDTO dto =
                new ReclamationResponseDTO();

        dto.setId(reclamation.getId());

        dto.setSujet(reclamation.getSujet());

        dto.setDescription(reclamation.getDescription());

        dto.setStatut(reclamation.getStatut());

        dto.setReponseResponsable(
                reclamation.getReponseResponsable()
        );

        dto.setDateCreation(
                reclamation.getDateCreation()
        );

        if (reclamation.getVoyageur() != null) {

            dto.setVoyageurId(
                    reclamation.getVoyageur().getId()
            );

            dto.setVoyageurNom(
                    reclamation.getVoyageur().getNom()
            );
        }

        if (reclamation.getReservation() != null) {

            dto.setReservationId(
                    reclamation.getReservation().getId()
            );
        }

        return dto;
    }
}