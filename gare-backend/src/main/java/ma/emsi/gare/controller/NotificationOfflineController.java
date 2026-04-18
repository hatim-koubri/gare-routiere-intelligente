package ma.emsi.gare.controller;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.response.NotificationOfflineResponse;
import ma.emsi.gare.entity.NotificationOffline;
import ma.emsi.gare.enums.TypeNotification;
import ma.emsi.gare.service.NotificationOfflineService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications-offline")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NotificationOfflineController {

    private final NotificationOfflineService notifOfflineService;

    // ===== Synchronisation après reconnexion (authentifié) =====
    @PostMapping("/sync")
    public ResponseEntity<NotificationOfflineResponse> synchroniser(
            Authentication authentication) {

        String email = authentication.getName();
        NotificationOfflineResponse response =
                notifOfflineService.synchroniserApresReconnexion(email);
        return ResponseEntity.ok(response);
    }

    // ===== Compter les notifs en attente =====
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> compterNotifsEnAttente(
            Authentication authentication) {

        String email = authentication.getName();
        long count = notifOfflineService.compterNotifsEnAttente(email);
        return ResponseEntity.ok(Map.of("notificationsEnAttente", count));
    }

    // ===== Historique complet =====
    @GetMapping("/historique")
    public ResponseEntity<List<NotificationOffline>> getHistorique(
            Authentication authentication) {

        String email = authentication.getName();
        return ResponseEntity.ok(notifOfflineService.getHistorique(email));
    }

    // ===== [ADMIN/TEST] Créer une notif manuellement =====
    @PostMapping("/test")
    public ResponseEntity<NotificationOffline> creerNotifTest(
            @RequestParam String userEmail,
            @RequestParam String message) {

        NotificationOffline notif = notifOfflineService.creerNotification(
                userEmail,
                TypeNotification.RETARD,
                message,
                "{\"trajetId\": 1}"
        );
        return ResponseEntity.ok(notif);
    }
}