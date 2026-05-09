package ma.emsi.gare.controller.responsable;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.response.PreferenceNonSatisfaiteDTO;
import ma.emsi.gare.service.ResponsablePreferenceVoisinageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/responsable/preferences")
@RequiredArgsConstructor
public class ResponsablePreferenceVoisinageController {

    private final ResponsablePreferenceVoisinageService service;

    @GetMapping("/non-satisfaites")
    public ResponseEntity<List<PreferenceNonSatisfaiteDTO>>
    getNonSatisfaites(
            @RequestParam(required = false) Long trajetId,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                service.getAllPreferencesNonSatisfaites(
                        trajetId,
                        authentication
                )
        );
    }

    @GetMapping("/non-satisfaites/{trajetId}")
    public ResponseEntity<List<PreferenceNonSatisfaiteDTO>>
    getNonSatisfaitesByTrajet(
            @PathVariable Long trajetId,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                service.getPreferencesNonSatisfaites(
                        trajetId,
                        authentication
                )
        );
    }
}