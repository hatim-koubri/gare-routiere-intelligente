package ma.emsi.gare.service;

import ma.emsi.gare.dto.response.OCRDetectionResponse;
import ma.emsi.gare.entity.*;
import ma.emsi.gare.enums.StatutStationnement;
import ma.emsi.gare.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("OCRService — Tests unitaires")
class OCRServiceTest {

    @Mock private BusRepository busRepository;
    @Mock private QuaiRepository quaiRepository;
    @Mock private StationnementOCRRepository stationnementRepo;
    @Mock private WebSocketNotificationService wsNotifService;
    @Mock private NotificationOfflineService notifOfflineService;

    @InjectMocks private OCRService ocrService;

    private Bus bus;
    private Compagnie ctm;
    private Quai quai;
    private StationnementOCR stationnement;

    @BeforeEach
    void setUp() {
        ctm = new Compagnie();
        ctm.setId(1L);
        ctm.setNom("CTM");
        ctm.setCode("CTM001");

        bus = new Bus();
        bus.setId(1L);
        bus.setMatricule("12345-A-1");
        bus.setMarque("Mercedes");
        bus.setNbSieges(45);
        bus.setCompagnie(ctm);
        bus.setActif(true);

        quai = new Quai();
        quai.setId(1L);
        quai.setNumero(1);
        quai.setTarifHoraire(50.0);
        quai.setDisponible(true);
        quai.setCompagnie(ctm);

        stationnement = new StationnementOCR();
        stationnement.setId(1L);
        stationnement.setMatricule("12345-A-1");
        stationnement.setCompagnie(ctm);
        stationnement.setQuai(quai);
        stationnement.setHeureEntree(LocalDateTime.now().minusHours(2));
        stationnement.setStatut(StatutStationnement.EN_COURS);
    }

    // ===== Tests détection matricule =====

    @Test
    @DisplayName("Matricule connu → détection réussie + quai attribué")
    void traiterMatricule_BusConnu_Success() {
        when(busRepository.findByMatricule("12345-A-1"))
                .thenReturn(Optional.of(bus));
        when(quaiRepository.findByCompagnieId(1L))
                .thenReturn(List.of(quai));
        when(quaiRepository.save(any())).thenReturn(quai);
        when(stationnementRepo.save(any())).thenReturn(stationnement);
        doNothing().when(wsNotifService).broadcastOCRDetection(any(), any());
        doNothing().when(wsNotifService).notifierAdmins(any(), any());

        OCRDetectionResponse response =
                ocrService.traiterMatriculeExtrait("12345-A-1", null);

        assertThat(response.isSuccès()).isTrue();
        assertThat(response.getStatut()).isEqualTo("DETECTE");
        assertThat(response.getMatricule()).isEqualTo("12345-A-1");
        assertThat(response.getCompagnie()).isEqualTo("CTM");
        verify(stationnementRepo, times(1)).save(any());
        verify(wsNotifService, times(1))
                .broadcastOCRDetection("12345-A-1", "DETECTE");
    }

    @Test
    @DisplayName("Matricule inconnu → correction manuelle requise")
    void traiterMatricule_BusInconnu_CorrectionRequise() {
        when(busRepository.findByMatricule("INCONNU-99"))
                .thenReturn(Optional.empty());
        when(stationnementRepo.save(any())).thenReturn(stationnement);
        doNothing().when(wsNotifService).notifierAdmins(any(), any());

        OCRDetectionResponse response =
                ocrService.traiterMatriculeExtrait("INCONNU-99", null);

        assertThat(response.isSuccès()).isFalse();
        assertThat(response.getStatut()).isEqualTo("INCONNU");
        verify(wsNotifService, times(1))
                .notifierAdmins(eq("PLAQUE_INCONNUE"), any());
    }

    @Test
    @DisplayName("Aucun quai disponible → détection sans quai")
    void traiterMatricule_AucunQuai_SansQuai() {
        quai.setDisponible(false); // quai occupé
        when(busRepository.findByMatricule("12345-A-1"))
                .thenReturn(Optional.of(bus));
        when(quaiRepository.findByCompagnieId(1L))
                .thenReturn(List.of(quai));
        when(stationnementRepo.save(any())).thenReturn(stationnement);
        doNothing().when(wsNotifService).broadcastOCRDetection(any(), any());
        doNothing().when(wsNotifService).notifierAdmins(any(), any());

        OCRDetectionResponse response =
                ocrService.traiterMatriculeExtrait("12345-A-1", null);

        assertThat(response.isSuccès()).isTrue();
        assertThat(response.getQuaiAttribue()).isNull();
    }

    // ===== Tests correction OCR =====

    @Test
    @DisplayName("Correction OCR — matricule corrigé avec succès")
    void corrigerOCR_Success() {
        StationnementOCR statInconnu = new StationnementOCR();
        statInconnu.setId(1L);
        statInconnu.setMatricule("ILLISIBLE");
        statInconnu.setHeureEntree(LocalDateTime.now().minusHours(1));
        statInconnu.setStatut(StatutStationnement.CORRECTION_MANUELLE);

        when(stationnementRepo.findById(1L))
                .thenReturn(Optional.of(statInconnu));
        when(busRepository.findByMatricule("12345-A-1"))
                .thenReturn(Optional.of(bus));
        when(stationnementRepo.save(any())).thenReturn(statInconnu);

        ma.emsi.gare.dto.request.OCRCorrectionRequest request =
                new ma.emsi.gare.dto.request.OCRCorrectionRequest();
        request.setMatricule("12345-A-1");

        OCRDetectionResponse response = ocrService.corrigerOCR(1L, request);

        assertThat(response.isSuccès()).isTrue();
        assertThat(response.getStatut()).isEqualTo("CORRIGE");
        assertThat(statInconnu.isCorrectionManuelle()).isTrue();
        verify(stationnementRepo, atLeastOnce()).save(any());
    }

    @Test
    @DisplayName("Correction OCR — stationnement non trouvé → exception")
    void corrigerOCR_NonTrouve_ThrowsException() {
        when(stationnementRepo.findById(99L))
                .thenReturn(Optional.empty());

        ma.emsi.gare.dto.request.OCRCorrectionRequest request =
                new ma.emsi.gare.dto.request.OCRCorrectionRequest();
        request.setMatricule("12345-A-1");

        assertThatThrownBy(() -> ocrService.corrigerOCR(99L, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Stationnement non trouvé");
    }

    // ===== Tests terminer stationnement =====

    @Test
    @DisplayName("Terminer stationnement → montant calculé + quai libéré")
    void terminerStationnement_Success() {
        stationnement.setHeureEntree(
                LocalDateTime.now().minusHours(2)); // 2h de stationnement

        when(stationnementRepo.findById(1L))
                .thenReturn(Optional.of(stationnement));
        when(stationnementRepo.save(any())).thenReturn(stationnement);
        when(quaiRepository.save(any())).thenReturn(quai);
        doNothing().when(wsNotifService).notifierAdmins(any(), any());

        StationnementOCR result = ocrService.terminerStationnement(1L);

        assertThat(result.getStatut())
                .isEqualTo(StatutStationnement.TERMINE);
        assertThat(result.getMontantFacture()).isGreaterThan(0);
        assertThat(result.getHeureSortie()).isNotNull();
        // Quai libéré
        assertThat(quai.isDisponible()).isTrue();
    }

    @Test
    @DisplayName("Terminer stationnement — 2h × 50 MAD/h = 100 MAD")
    void terminerStationnement_MontantCorrect() {
        LocalDateTime entree = LocalDateTime.now().minusMinutes(120);
        stationnement.setHeureEntree(entree);

        when(stationnementRepo.findById(1L))
                .thenReturn(Optional.of(stationnement));
        when(stationnementRepo.save(any()))
                .thenAnswer(inv -> inv.getArgument(0));
        when(quaiRepository.save(any())).thenReturn(quai);
        doNothing().when(wsNotifService).notifierAdmins(any(), any());

        StationnementOCR result = ocrService.terminerStationnement(1L);

        // 2h × 50 MAD/h = 100 MAD (tolérance 5 MAD pour timing)
        assertThat(result.getMontantFacture())
                .isBetween(95.0, 105.0);
    }
}