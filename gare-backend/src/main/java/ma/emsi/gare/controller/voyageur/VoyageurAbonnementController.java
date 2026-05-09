package ma.emsi.gare.controller.voyageur;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.response.AbonnementResponseDTO;
import ma.emsi.gare.dto.response.LigneAbonnementDisponibleDTO;
import ma.emsi.gare.dto.request.SouscrireAbonnementRequest;
import ma.emsi.gare.entity.User;
import ma.emsi.gare.enums.Role;
import ma.emsi.gare.service.AbonnementService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/voyageur/abonnements")
@RequiredArgsConstructor
public class VoyageurAbonnementController {

    private final AbonnementService abonnementService;

    @GetMapping("/disponibles")
    public ResponseEntity<List<LigneAbonnementDisponibleDTO>> getLignesDisponibles() {
        return ResponseEntity.ok(abonnementService.getLignesDisponibles());
    }

    @GetMapping
    public ResponseEntity<List<AbonnementResponseDTO>> getMesAbonnements(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        if (user.getRole() != Role.VOYAGEUR) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(abonnementService.mesAbonnements(user.getId()));
    }

    @PostMapping
    public ResponseEntity<?> souscrire(
            @RequestBody SouscrireAbonnementRequest request,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        if (user.getRole() != Role.VOYAGEUR) return ResponseEntity.status(403).build();
        try {
            return ResponseEntity.ok(abonnementService.souscrire(user.getId(), request.getLigneId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/resilier")
    public ResponseEntity<Void> resilier(
            @PathVariable Long id,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        if (user.getRole() != Role.VOYAGEUR) return ResponseEntity.status(403).build();
        abonnementService.resilier(id, user.getId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/renouvellement-auto")
    public ResponseEntity<Void> toggleRenouvellementAuto(
            @PathVariable Long id,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        if (user.getRole() != Role.VOYAGEUR) return ResponseEntity.status(403).build();
        abonnementService.toggleRenouvellementAuto(id, user.getId());
        return ResponseEntity.ok().build();
    }
}
