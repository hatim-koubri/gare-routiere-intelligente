package ma.emsi.gare.controller.responsable;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.TraitementRemboursementRequest;
import ma.emsi.gare.dto.response.RemboursementResponseDTO;
import ma.emsi.gare.entity.Remboursement;
import ma.emsi.gare.service.ResponsableRemboursementService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/responsable/remboursements")
@RequiredArgsConstructor
public class ResponsableRemboursementController {

    private final ResponsableRemboursementService service;

    @GetMapping
    public ResponseEntity<List<RemboursementResponseDTO>>
    getDemandes(Authentication authentication) {

        List<RemboursementResponseDTO> remboursements =
                service.getDemandes(authentication)
                        .stream()
                        .map(this::toDto)
                        .toList();

        return ResponseEntity.ok(remboursements);
    }

    @PatchMapping("/{id}/traiter")
    public ResponseEntity<RemboursementResponseDTO>
    traiter(
            @PathVariable Long id,
            @Valid
            @RequestBody TraitementRemboursementRequest request,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                toDto(
                        service.traiter(
                                id,
                                request,
                                authentication
                        )
                )
        );
    }

    private RemboursementResponseDTO toDto(
            Remboursement remboursement
    ) {

        RemboursementResponseDTO dto =
                new RemboursementResponseDTO();

        dto.setId(remboursement.getId());

        dto.setMontant(remboursement.getMontant());

        dto.setMotif(remboursement.getMotif());

        dto.setStatut(remboursement.getStatut());

        dto.setDateDemande(
                remboursement.getDateDemande()
        );

        dto.setDateTraitement(
                remboursement.getDateTraitement()
        );

        if (remboursement.getReservation() != null) {

            dto.setReservationId(
                    remboursement.getReservation().getId()
            );

            if (remboursement.getReservation()
                    .getVoyageur() != null) {

                dto.setVoyageurId(
                        remboursement.getReservation()
                                .getVoyageur()
                                .getId()
                );

                dto.setVoyageurNom(
                        remboursement.getReservation()
                                .getVoyageur()
                                .getNom()
                );
            }
        }

        return dto;
    }
}