package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebSocketNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    // ===== Notifier un chauffeur spécifique =====
    public void notifierChauffeur(Long chauffeurId, String type, Object data) {
        String destination = "/queue/chauffeur/" + chauffeurId;
        Map<String, Object> message = Map.of(
                "type", type,
                "data", data
        );
        messagingTemplate.convertAndSend(destination, message);
        log.info("WebSocket → Chauffeur {}: {}", chauffeurId, type);
    }

    // ===== Notifier tous les admins =====
    public void notifierAdmins(String type, Object data) {
        Map<String, Object> message = Map.of(
                "type", type,
                "data", data
        );
        messagingTemplate.convertAndSend("/topic/admin", message);
        log.info("WebSocket → Admins: {}", type);
    }

    // ===== Notifier un voyageur =====
    public void notifierVoyageur(String email, String type, Object data) {
        Map<String, Object> message = Map.of(
                "type", type,
                "data", data
        );
        messagingTemplate.convertAndSend("/queue/voyageur/" + email, message);
        log.info("WebSocket → Voyageur {}: {}", email, type);
    }

    // ===== Broadcast OCR détection =====
    public void broadcastOCRDetection(String matricule, String statut) {
        Map<String, Object> message = Map.of(
                "matricule", matricule,
                "statut", statut
        );
        messagingTemplate.convertAndSend("/topic/ocr", message);
    }
}