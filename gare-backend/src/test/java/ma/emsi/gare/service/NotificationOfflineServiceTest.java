package ma.emsi.gare.service;

import ma.emsi.gare.entity.NotificationOffline;
import ma.emsi.gare.enums.TypeNotification;
import ma.emsi.gare.repository.NotificationOfflineRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationOfflineService — Tests unitaires")
class NotificationOfflineServiceTest {

    @Mock
    private NotificationOfflineRepository notifOfflineRepo;

    @InjectMocks
    private NotificationOfflineService notificationOfflineService;

    private NotificationOffline notifRetard;
    private NotificationOffline notifAnnulation;

    @BeforeEach
    void setUp() {
        notifRetard = new NotificationOffline();
        notifRetard.setId(1L);
        notifRetard.setUserEmail("hatim@emsi.ma");
        notifRetard.setType(TypeNotification.RETARD);
        notifRetard.setMessage("Bus en retard de 15 min");
        notifRetard.setPayload("{\"trajetId\": 1}");
        notifRetard.setLivree(false);
        notifRetard.setDateCreation(LocalDateTime.now());

        notifAnnulation = new NotificationOffline();
        notifAnnulation.setId(2L);
        notifAnnulation.setUserEmail("hatim@emsi.ma");
        notifAnnulation.setType(TypeNotification.ANNULATION);
        notifAnnulation.setMessage("Trajet annulé");
        notifAnnulation.setPayload("{\"trajetId\": 2}");
        notifAnnulation.setLivree(false);
        notifAnnulation.setDateCreation(LocalDateTime.now());
    }

    // ============= creerNotification =============

    @Test
    @DisplayName("creerNotification — sauvegarde et retourne la notif")
    void creerNotification_SavesAndReturns() {
        when(notifOfflineRepo.save(any())).thenReturn(notifRetard);

        NotificationOffline result = notificationOfflineService.creerNotification(
                "hatim@emsi.ma",
                TypeNotification.RETARD,
                "Bus en retard de 15 min",
                "{\"trajetId\": 1}"
        );

        assertThat(result).isNotNull();
        assertThat(result.getUserEmail()).isEqualTo("hatim@emsi.ma");
        assertThat(result.getType()).isEqualTo(TypeNotification.RETARD);
        assertThat(result.isLivree()).isFalse();
        verify(notifOfflineRepo, times(1)).save(any());
    }

    @Test
    @DisplayName("creerNotification — livree=false par défaut")
    void creerNotification_LivreeFalseByDefault() {
        when(notifOfflineRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        NotificationOffline result = notificationOfflineService.creerNotification(
                "hatim@emsi.ma",
                TypeNotification.RETARD,
                "Test",
                null
        );

        assertThat(result.isLivree()).isFalse();
        assertThat(result.getDateLivraison()).isNull();
    }

    // ============= synchroniserApresReconnexion =============

    @Test
    @DisplayName("sync — retourne les notifs en attente")
    void synchroniser_ReturnsNotifsEnAttente() {
        when(notifOfflineRepo
                .findByUserEmailAndLivreeFalseOrderByDateCreationAsc("hatim@emsi.ma"))
                .thenReturn(List.of(notifRetard, notifAnnulation));
        when(notifOfflineRepo.marquerToutesCommeLivrees("hatim@emsi.ma"))
                .thenReturn(2);

        var response = notificationOfflineService
                .synchroniserApresReconnexion("hatim@emsi.ma");

        assertThat(response.getNombreNotifications()).isEqualTo(2);
        assertThat(response.getNotifications()).hasSize(2);
        assertThat(response.getUserEmail()).isEqualTo("hatim@emsi.ma");
    }

    @Test
    @DisplayName("sync — marque toutes les notifs comme livrées")
    void synchroniser_MarqueToutesLivrees() {
        when(notifOfflineRepo
                .findByUserEmailAndLivreeFalseOrderByDateCreationAsc(any()))
                .thenReturn(List.of(notifRetard));
        when(notifOfflineRepo.marquerToutesCommeLivrees(any())).thenReturn(1);

        notificationOfflineService.synchroniserApresReconnexion("hatim@emsi.ma");

        // Vérifier que marquerToutesCommeLivrees est bien appelé
        verify(notifOfflineRepo, times(1))
                .marquerToutesCommeLivrees("hatim@emsi.ma");
    }

    @Test
    @DisplayName("sync — aucune notif en attente → réponse vide")
    void synchroniser_AucuneNotif_ReponseVide() {
        when(notifOfflineRepo
                .findByUserEmailAndLivreeFalseOrderByDateCreationAsc(any()))
                .thenReturn(List.of());
        when(notifOfflineRepo.marquerToutesCommeLivrees(any())).thenReturn(0);

        var response = notificationOfflineService
                .synchroniserApresReconnexion("hatim@emsi.ma");

        assertThat(response.getNombreNotifications()).isEqualTo(0);
        assertThat(response.getNotifications()).isEmpty();
    }

    // ============= compterNotifsEnAttente =============

    @Test
    @DisplayName("compterNotifsEnAttente — retourne le bon count")
    void compterNotifs_ReturnsCorrectCount() {
        when(notifOfflineRepo.countByUserEmailAndLivreeFalse("hatim@emsi.ma"))
                .thenReturn(3L);

        long count = notificationOfflineService
                .compterNotifsEnAttente("hatim@emsi.ma");

        assertThat(count).isEqualTo(3L);
    }

    @Test
    @DisplayName("compterNotifsEnAttente — aucune notif → 0")
    void compterNotifs_AucuneNotif_ReturnsZero() {
        when(notifOfflineRepo.countByUserEmailAndLivreeFalse(any()))
                .thenReturn(0L);

        long count = notificationOfflineService
                .compterNotifsEnAttente("inconnu@emsi.ma");

        assertThat(count).isEqualTo(0L);
    }
}