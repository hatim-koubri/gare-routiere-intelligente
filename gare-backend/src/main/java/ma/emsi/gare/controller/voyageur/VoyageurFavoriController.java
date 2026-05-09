package ma.emsi.gare.controller.voyageur;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.entity.User;
import ma.emsi.gare.enums.Role;
import ma.emsi.gare.service.FavoriService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/voyageur/favoris")
@RequiredArgsConstructor
public class VoyageurFavoriController {

    private final FavoriService favoriService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getFavoris(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        if (user.getRole() != Role.VOYAGEUR) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(favoriService.getFavoris(user.getId()));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> ajouterFavori(
            @RequestBody Map<String, Long> body,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        if (user.getRole() != Role.VOYAGEUR) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(favoriService.ajouterFavori(user.getId(), body.get("ligneId")));
    }

    @DeleteMapping("/{ligneId}")
    public ResponseEntity<Void> supprimerFavori(
            @PathVariable Long ligneId,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        if (user.getRole() != Role.VOYAGEUR) return ResponseEntity.status(403).build();
        favoriService.supprimerFavori(user.getId(), ligneId);
        return ResponseEntity.noContent().build();
    }
}
