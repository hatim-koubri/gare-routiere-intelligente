package ma.emsi.gare.controller.responsable;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.response.CompagnieStatsDTO;
import ma.emsi.gare.service.ResponsableStatsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/responsable/stats")
@RequiredArgsConstructor
public class ResponsableStatsController {

    private final ResponsableStatsService responsableStatsService;

    @GetMapping
    public ResponseEntity<CompagnieStatsDTO> dashboard(
            @RequestParam(required = false) String periode,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                responsableStatsService
                        .getDashboardStats(authentication, periode)
        );
    }
}