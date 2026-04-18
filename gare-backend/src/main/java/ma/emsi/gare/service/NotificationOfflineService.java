package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.emsi.gare.dto.response.NotificationOfflineResponse;
import ma.emsi.gare.entity.NotificationOffline;
import ma.emsi.gare.enums.TypeNotification;
import ma.emsi.gare.repository.NotificationOfflineRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationOfflineService {

    private final NotificationOfflineRepository notifOfflineRepo;

    // ===== Créer une notification offline pour un user =====
    public NotificationOffline creerNotification(String userEmail,
                                                 TypeNotification type,
                                                 String message,
                                                 String payload) {
        NotificationOffline notif = new NotificationOffline();
        notif.setUserEmail(userEmail);
        notif.setType(type);
        notif.setMessage(message);
        notif.setPayload(payload);
        notif.setLivree(false);

        NotificationOffline saved = notifOfflineRepo.save(notif);
        log.info("Notification offline créée pour {} : {}", userEmail, type);
        return saved;
    }

    // ===== Synchronisation après reconnexion =====
    // Appelé quand le user se reconnecte → retourne ses notifs en attente
    @Transactional
    public NotificationOfflineResponse synchroniserApresReconnexion(String userEmail) {

        // 1. Récupérer toutes les notifs non livrées
        List<NotificationOffline> notifsEnAttente = notifOfflineRepo
                .findByUserEmailAndLivreeFalseOrderByDateCreationAsc(userEmail);

        // 2. Les marquer comme livrées
        int nbMarquees = notifOfflineRepo.marquerToutesCommeLivrees(userEmail);

        log.info("Synchronisation pour {} : {} notifications livrées",
                userEmail, nbMarquees);

        // 3. Construire la réponse
        List<NotificationOfflineResponse.NotifDTO> notifsDTO = notifsEnAttente
                .stream()
                .map(n -> NotificationOfflineResponse.NotifDTO.builder()
                        .id(n.getId())
                        .type(n.getType().name())
                        .message(n.getMessage())
                        .payload(n.getPayload())
                        .dateCreation(n.getDateCreation().toString())
                        .build())
                .toList();

        return NotificationOfflineResponse.builder()
                .userEmail(userEmail)
                .nombreNotifications(notifsDTO.size())
                .notifications(notifsDTO)
                .build();
    }

    // ===== Compter les notifs en attente =====
    public long compterNotifsEnAttente(String userEmail) {
        return notifOfflineRepo.countByUserEmailAndLivreeFalse(userEmail);
    }

    // ===== Historique complet =====
    public List<NotificationOffline> getHistorique(String userEmail) {
        return notifOfflineRepo.findByUserEmailOrderByDateCreationDesc(userEmail);
    }
}