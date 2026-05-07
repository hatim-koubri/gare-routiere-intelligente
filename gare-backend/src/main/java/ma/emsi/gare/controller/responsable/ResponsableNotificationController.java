package ma.emsi.gare.controller.responsable;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.NotificationTrajetRequest;
import ma.emsi.gare.service.ResponsableNotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/responsable/notifications")
@RequiredArgsConstructor
public class ResponsableNotificationController {

    private final ResponsableNotificationService service;

    @PostMapping
    public ResponseEntity<String> notifier(
            @Valid @RequestBody NotificationTrajetRequest request,
            Authentication authentication
    ) {

        service.notifierVoyageurs(
                request,
                authentication
        );

        return ResponseEntity.ok(
                "Notifications envoyées"
        );
    }
}