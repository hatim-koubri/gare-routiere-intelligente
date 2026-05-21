package ma.emsi.gare.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.emsi.gare.enums.TypeNotification;
import ma.emsi.gare.repository.ResponsableCompagnieRepository;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResponsableNotificationHelper {

    private final ResponsableCompagnieRepository responsableCompagnieRepository;
    private final WebSocketNotificationService wsNotifService;
    private final NotificationOfflineService notifOfflineService;
    private final ObjectMapper objectMapper;

    public void notifierResponsables(Long compagnieId, String wsType, TypeNotification offlineType, String message, Map<String, Object> data) {
        // WebSocket temps réel
        wsNotifService.notifierResponsables(compagnieId, wsType, data);

        // Notification offline pour chaque responsable
        String payloadJson = serialiserPayload(data);
        var responsables = responsableCompagnieRepository.findByCompagnieId(compagnieId);
        responsables.forEach(resp -> {
            if (resp.getEmail() != null) {
                notifOfflineService.creerNotification(resp.getEmail(), offlineType, message, payloadJson);
            }
        });

        log.info("{} responsable(s) notifié(s) pour compagnie {}", responsables.size(), wsType);
    }

    private String serialiserPayload(Map<String, Object> data) {
        try {
            return objectMapper.writeValueAsString(data);
        } catch (Exception e) {
            return "{}";
        }
    }
}
