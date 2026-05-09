package ma.emsi.gare.controller.responsable;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.BlocageSiegeRequest;
import ma.emsi.gare.dto.response.SiegeBlocageResponseDTO;
import ma.emsi.gare.entity.Siege;
import ma.emsi.gare.service.ResponsableBlocageSiegeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/responsable/sieges")
@RequiredArgsConstructor
public class ResponsableBlocageSiegeController {

    private final ResponsableBlocageSiegeService service;

    @PostMapping("/bloquer")
    public ResponseEntity<SiegeBlocageResponseDTO> bloquer(
            @Valid @RequestBody BlocageSiegeRequest request,
            Authentication authentication
    ) {
        Siege siege = service.bloquer(request, authentication);
        return ResponseEntity.ok(toDto(siege));
    }

    @PatchMapping("/{id}/debloquer")
    public ResponseEntity<SiegeBlocageResponseDTO> debloquer(
            @PathVariable Long id,
            Authentication authentication
    ) {
        Siege siege = service.debloquer(id, authentication);
        return ResponseEntity.ok(toDto(siege));
    }

    @GetMapping("/{trajetId}")
    public ResponseEntity<List<SiegeBlocageResponseDTO>> getPlanBus(
            @PathVariable Long trajetId,
            Authentication authentication
    ) {
        List<SiegeBlocageResponseDTO> sieges = service
                .getSiegesByTrajet(trajetId, authentication)
                .stream()
                .map(this::toDto)
                .toList();

        return ResponseEntity.ok(sieges);
    }

    @GetMapping("/trajet/{trajetId}")
    public ResponseEntity<List<SiegeBlocageResponseDTO>> getBloques(
            @PathVariable Long trajetId,
            Authentication authentication
    ) {
        List<SiegeBlocageResponseDTO> sieges = service
                .getSiegesBloques(trajetId, authentication)
                .stream()
                .map(this::toDto)
                .toList();

        return ResponseEntity.ok(sieges);
    }

    private SiegeBlocageResponseDTO toDto(Siege siege) {
        SiegeBlocageResponseDTO dto = new SiegeBlocageResponseDTO();

        dto.setId(siege.getId());
        dto.setNumeroSiege(siege.getNumeroSiege());
        dto.setNumeroRangee(siege.getNumeroRangee());
        dto.setPositionRangee(siege.getPositionRangee());
        dto.setOccupe(siege.isOccupe());
        dto.setBloque(siege.isBloque());
        dto.setVerrouilleTemporaire(siege.isVerrouilleTemporaire());
        dto.setMotifBlocage(siege.getMotifBlocage());
        dto.setDateBlocage(siege.getDateBlocage());

        if (siege.getTrajet() != null) {
            dto.setTrajetId(siege.getTrajet().getId());
        }

        return dto;
    }
}