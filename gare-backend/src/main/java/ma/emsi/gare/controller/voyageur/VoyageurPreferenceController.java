package ma.emsi.gare.controller.voyageur;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.PreferenceVoisinageRequest;
import ma.emsi.gare.entity.MembreGroupe;
import ma.emsi.gare.entity.PreferenceVoisinage;
import ma.emsi.gare.entity.User;
import ma.emsi.gare.enums.Role;
import ma.emsi.gare.repository.MembreGroupeRepository;
import ma.emsi.gare.repository.PreferenceVoisinageRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/voyageur/preferences")
@RequiredArgsConstructor
public class VoyageurPreferenceController {

    private final MembreGroupeRepository membreGroupeRepository;
    private final PreferenceVoisinageRepository preferenceVoisinageRepository;

    @PostMapping("/voisinage/{membreId}")
    public ResponseEntity<?> setPreferenceVoisinage(
            @PathVariable Long membreId,
            @RequestBody PreferenceVoisinageRequest request,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        if (user.getRole() != Role.VOYAGEUR) return ResponseEntity.status(403).build();

        MembreGroupe membre = membreGroupeRepository.findById(membreId)
                .orElseThrow(() -> new RuntimeException("Membre non trouvé"));

        PreferenceVoisinage pref = preferenceVoisinageRepository.findTopByMembreId(membreId)
                .orElseGet(() -> {
                    PreferenceVoisinage p = new PreferenceVoisinage();
                    p.setMembre(membre);
                    return p;
                });

        pref.setAccepteSexeOppose(request.isAccepteSexeOppose());
        if (request.getPreferencePosition() != null) {
            pref.setPreferencePosition(request.getPreferencePosition());
        }
        if (request.getPrefereCoteMembreId() != null) {
            pref.setPrefereCoteMembreId(request.getPrefereCoteMembreId());
        }
        preferenceVoisinageRepository.save(pref);

        return ResponseEntity.ok(Map.of("message", "Préférence enregistrée"));
    }

    @GetMapping("/voisinage/{membreId}")
    public ResponseEntity<?> getPreferenceVoisinage(
            @PathVariable Long membreId) {
        return ResponseEntity.ok(
                preferenceVoisinageRepository.findTopByMembreId(membreId)
                        .orElse(null)
        );
    }
}
