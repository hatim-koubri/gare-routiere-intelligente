package ma.emsi.gare.controller.voyageur;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.PreferenceVoisinageRequest;
import ma.emsi.gare.entity.User;
import ma.emsi.gare.entity.Voyageur;
import ma.emsi.gare.enums.Role;
import ma.emsi.gare.repository.VoyageurRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/voyageur/profil")
@RequiredArgsConstructor
public class VoyageurProfilController {

    private final VoyageurRepository voyageurRepository;

    @GetMapping
    public ResponseEntity<?> getProfil(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        if (user.getRole() != Role.VOYAGEUR) return ResponseEntity.status(403).build();

        Voyageur voyageur = voyageurRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Voyageur non trouvé"));

        Map<String, Object> data = new HashMap<>();
        data.put("id", voyageur.getId());
        data.put("nom", voyageur.getNom());
        data.put("prenom", voyageur.getPrenom());
        data.put("email", voyageur.getEmail());
        data.put("telephone", voyageur.getTelephone());
        data.put("sexe", voyageur.getSexe());
        data.put("accepteSexeOppose", voyageur.isAccepteSexeOppose());
        data.put("preferencePosition", voyageur.getPreferencePosition());
        return ResponseEntity.ok(data);
    }

    @PutMapping("/sexe")
    public ResponseEntity<?> updateSexe(@RequestBody Map<String, String> body, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        if (user.getRole() != Role.VOYAGEUR) return ResponseEntity.status(403).build();

        Voyageur voyageur = voyageurRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Voyageur non trouvé"));

        String sexe = body.get("sexe");
        if (sexe == null || (!sexe.equals("HOMME") && !sexe.equals("FEMME"))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Sexe invalide. Utilisez HOMME ou FEMME"));
        }

        voyageur.setSexe(sexe);
        voyageurRepository.save(voyageur);

        Map<String, Object> sexeResp = new HashMap<>();
        sexeResp.put("message", "Sexe mis à jour");
        sexeResp.put("sexe", sexe);
        return ResponseEntity.ok(sexeResp);
    }

    @PutMapping("/preference-voisinage")
    public ResponseEntity<?> updatePreferenceVoisinage(@RequestBody PreferenceVoisinageRequest request, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        if (user.getRole() != Role.VOYAGEUR) return ResponseEntity.status(403).build();

        Voyageur voyageur = voyageurRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Voyageur non trouvé"));

        voyageur.setAccepteSexeOppose(request.isAccepteSexeOppose());
        if (request.getPreferencePosition() != null) {
            voyageur.setPreferencePosition(request.getPreferencePosition());
        }
        voyageurRepository.save(voyageur);

        Map<String, Object> prefResp = new HashMap<>();
        prefResp.put("message", "Préférence de voisinage mise à jour");
        prefResp.put("accepteSexeOppose", voyageur.isAccepteSexeOppose());
        prefResp.put("preferencePosition", voyageur.getPreferencePosition());
        return ResponseEntity.ok(prefResp);
    }

    @GetMapping("/preference-voisinage")
    public ResponseEntity<?> getPreferenceVoisinage(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        if (user.getRole() != Role.VOYAGEUR) return ResponseEntity.status(403).build();

        Voyageur voyageur = voyageurRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Voyageur non trouvé"));

        Map<String, Object> getResp = new HashMap<>();
        getResp.put("accepteSexeOppose", voyageur.isAccepteSexeOppose());
        getResp.put("preferencePosition", voyageur.getPreferencePosition());
        return ResponseEntity.ok(getResp);
    }
}
