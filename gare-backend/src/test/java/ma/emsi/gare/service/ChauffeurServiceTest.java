package ma.emsi.gare.service;

import ma.emsi.gare.dto.request.IncidentRequest;
import ma.emsi.gare.dto.request.JalonRequest;
import ma.emsi.gare.entity.*;
import ma.emsi.gare.enums.*;
import ma.emsi.gare.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import com.fasterxml.jackson.core.JsonProcessingException;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ChauffeurService — Tests unitaires")
class ChauffeurServiceTest {

    @Mock private TrajetRepository trajetRepository;
    @Mock private TicketRepository ticketRepository;
    @Mock private BagageRepository bagageRepository;
    @Mock private IncidentRepository incidentRepository;
    @Mock private StationnementOCRRepository stationnementRepo;
    @Mock private QuaiRepository quaiRepository;
    @Mock private ChauffeurRepository chauffeurRepository;
    @Mock private WebSocketNotificationService wsNotifService;
    @Mock private NotificationOfflineService notifOfflineService;
    @Mock private PdfService pdfService;
    @Mock private JalonValideRepository jalonValideRepository;
    @Mock private com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @InjectMocks private ChauffeurService chauffeurService;

    private Ticket ticket;
    private Trajet trajet;
    private Ligne ligne;
    private Compagnie ctm;
    private Bus bus;
    private Bagage bagage;
    private Voyageur voyageur;
    private Reservation reservation;

    @BeforeEach
    void setUp() {
        ctm = new Compagnie();
        ctm.setId(1L);
        ctm.setNom("CTM");

        bus = new Bus();
        bus.setId(1L);
        bus.setMatricule("12345-A-1");
        bus.setCompagnie(ctm);

        Arret arret = new Arret();
        arret.setId(1L);
        arret.setVille("Settat");
        arret.setOrdre(2);
        arret.setHeurePrevueOffsetMinutes(60);

        ligne = new Ligne();
        ligne.setId(1L);
        ligne.setVilleDepart("Casablanca");
        ligne.setVilleArrivee("Marrakech");
        ligne.setCompagnie(ctm);
        ligne.setArrets(List.of(arret));

        trajet = new Trajet();
        trajet.setId(1L);
        trajet.setLigne(ligne);
        trajet.setBus(bus);
        trajet.setDateDepart(LocalDateTime.now().minusHours(1));
        trajet.setStatut(StatutTrajet.EN_COURS);
        trajet.setReservations(new ArrayList<>());

        voyageur = new Voyageur();
        voyageur.setId(1L);
        voyageur.setNom("ALAMI");
        voyageur.setPrenom("Ahmed");
        voyageur.setEmail("ahmed@test.ma");

        reservation = new Reservation();
        reservation.setId(1L);
        reservation.setVoyageur(voyageur);
        reservation.setTrajet(trajet);
        reservation.setTickets(new ArrayList<>());

        ticket = new Ticket();
        ticket.setId(1L);
        ticket.setQrCode("QR-TEST-001");
        ticket.setNomPassager("ALAMI");
        ticket.setPrenomPassager("Ahmed");
        ticket.setStatut(StatutTicket.ACTIF);
        ticket.setCategorieTarifaire(CategorieTarifaire.NORMAL);
        ticket.setEnfantSurGenoux(false);
        ticket.setReservation(reservation);

        bagage = new Bagage();
        bagage.setId(1L);
        bagage.setPoidsKg(15.0);
        bagage.setSurplusPrix(0.0);
        bagage.setReservation(reservation);
    }

    // ===== Tests validation QR Code =====

    @Test
    @DisplayName("Valider ticket QR — ticket actif → validé avec succès")
    void validerTicketQR_TicketActif_Success() {
        when(ticketRepository.findByQrCode("QR-TEST-001"))
                .thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any())).thenReturn(ticket);

        Map<String, Object> result =
                chauffeurService.validerTicketQR("QR-TEST-001");

        assertThat(result.get("valide")).isEqualTo(true);
        assertThat(result.get("nomPassager")).isEqualTo("ALAMI");
        assertThat(ticket.getStatut()).isEqualTo(StatutTicket.UTILISE);
        verify(ticketRepository, times(1)).save(ticket);
    }

    @Test
    @DisplayName("Valider ticket QR — ticket déjà utilisé → exception")
    void validerTicketQR_DejaUtilise_ThrowsException() {
        ticket.setStatut(StatutTicket.UTILISE);
        when(ticketRepository.findByQrCode("QR-TEST-001"))
                .thenReturn(Optional.of(ticket));

        assertThatThrownBy(() ->
                chauffeurService.validerTicketQR("QR-TEST-001"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Ticket déjà utilisé !");

        verify(ticketRepository, never()).save(any());
    }

    @Test
    @DisplayName("Valider ticket QR — ticket annulé → exception")
    void validerTicketQR_Annule_ThrowsException() {
        ticket.setStatut(StatutTicket.ANNULE);
        when(ticketRepository.findByQrCode("QR-TEST-001"))
                .thenReturn(Optional.of(ticket));

        assertThatThrownBy(() ->
                chauffeurService.validerTicketQR("QR-TEST-001"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Ticket annulé !");
    }

    @Test
    @DisplayName("Valider ticket QR — QR Code inexistant → exception")
    void validerTicketQR_Inexistant_ThrowsException() {
        when(ticketRepository.findByQrCode("QR-FAUX"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                chauffeurService.validerTicketQR("QR-FAUX"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Ticket invalide");
    }

    // ===== Tests scan bagage =====

    @Test
    @DisplayName("Scanner bagage — génère QR code si absent")
    void scannerBagage_GenerateQRCode() {
        when(bagageRepository.findById(1L))
                .thenReturn(Optional.of(bagage));
        when(bagageRepository.save(any())).thenReturn(bagage);

        Map<String, Object> result = chauffeurService.scannerBagage(1L);

        assertThat(result.get("bagageId")).isEqualTo(1L);
        assertThat(result.get("nomVoyageur")).isEqualTo("ALAMI Ahmed");
        assertThat(bagage.getQrCodeBagage()).isNotNull()
                .startsWith("BAG-1-");
    }

    @Test
    @DisplayName("Scanner bagage — QR code existant non régénéré")
    void scannerBagage_QRCodeExistant_NonRegenere() {
        bagage.setQrCodeBagage("BAG-1-EXISTANT");
        when(bagageRepository.findById(1L))
                .thenReturn(Optional.of(bagage));

        chauffeurService.scannerBagage(1L);

        // Save ne doit pas être appelé si QR déjà présent
        verify(bagageRepository, never()).save(any());
        assertThat(bagage.getQrCodeBagage()).isEqualTo("BAG-1-EXISTANT");
    }

    @Test
    @DisplayName("Scanner bagage — bagage non trouvé → exception")
    void scannerBagage_NonTrouve_ThrowsException() {
        when(bagageRepository.findById(99L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> chauffeurService.scannerBagage(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Bagage non trouvé");
    }

    // ===== Tests validation jalon =====

    @Test
    @DisplayName("Arriver à un arrêt — sans retard → statut EN_COURS")
    void arriverArret_SansRetard_EnCours() {
        trajet.setDateDepart(LocalDateTime.now().minusMinutes(30));
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(trajetRepository.save(any())).thenReturn(trajet);
        when(jalonValideRepository.existsByTrajetIdAndArretId(1L, 1L)).thenReturn(false);
        when(jalonValideRepository.findByTrajetIdAndArretId(1L, 1L)).thenReturn(Optional.empty());
        when(jalonValideRepository.save(any())).thenReturn(null);

        Map<String, Object> result = chauffeurService.arriverArret(1L, 1L, 1L);

        assertThat(result.get("ville")).isEqualTo("Settat");
        assertThat(result.containsKey("arriveeLe")).isTrue();
        assertThat(result.containsKey("retardArriveeMinutes")).isTrue();
    }

    @Test
    @DisplayName("Arriver à un arrêt — trajet non trouvé → exception")
    void arriverArret_TrajetNonTrouve_Exception() {
        when(trajetRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> chauffeurService.arriverArret(99L, 1L, 1L))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Trajet non trouvé");
    }

    @Test
    @DisplayName("Arriver → Départ d'un arrêt → calcule durée stationnement")
    void arriverPuisDepartirArret_CalculeDuree() {
        trajet.setDateDepart(LocalDateTime.now().minusMinutes(30));
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(trajetRepository.save(any())).thenReturn(trajet);

        JalonValide jalon = JalonValide.builder()
                .id(1L).trajetId(1L).arretId(1L)
                .ville("Settat").ordre(2)
                .arriveeLe(LocalDateTime.now().minusMinutes(10))
                .retardArriveeMinutes(0)
                .build();

        when(jalonValideRepository.existsByTrajetIdAndArretId(1L, 1L)).thenReturn(false);
        when(jalonValideRepository.findByTrajetIdAndArretId(1L, 1L))
                .thenReturn(Optional.empty())   // first call: arrival
                .thenReturn(Optional.of(jalon)); // second call: departure
        when(jalonValideRepository.save(any())).thenReturn(null);

        // Arrivée
        chauffeurService.arriverArret(1L, 1L, 1L);

        // Départ
        Map<String, Object> result = chauffeurService.departirArret(1L, 1L, 1L);

        assertThat(result.get("ville")).isEqualTo("Settat");
        assertThat(result.containsKey("arriveeLe")).isTrue();
        assertThat(result.containsKey("departLe")).isTrue();
        assertThat((Integer) result.get("dureeStationnementMinutes")).isGreaterThanOrEqualTo(9);
    }

    @Test
    @DisplayName("Départ sans arrivée → exception")
    void departirSansArrivee_Exception() {
        when(trajetRepository.findById(1L)).thenReturn(Optional.of(trajet));
        when(jalonValideRepository.findByTrajetIdAndArretId(1L, 1L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> chauffeurService.departirArret(1L, 1L, 1L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("arrivée");
    }

    // ===== Tests signalement incident =====

    @Test
    @DisplayName("Signaler incident RETARD → statut trajet mis à jour")
    void signalerIncident_Retard_StatutMisAJour() {
        Incident incident = new Incident();
        incident.setId(1L);
        incident.setType("RETARD");
        incident.setDescription("Embouteillage sur A1");
        incident.setTrajet(trajet);

        when(trajetRepository.findById(1L))
                .thenReturn(Optional.of(trajet));
        when(chauffeurRepository.findById(1L))
                .thenReturn(Optional.of(new Chauffeur()));
        when(incidentRepository.save(any())).thenReturn(incident);
        when(trajetRepository.save(any())).thenReturn(trajet);
        doNothing().when(wsNotifService).notifierAdmins(any(), any());

        IncidentRequest request = new IncidentRequest();
        request.setTrajetId(1L);
        request.setType("RETARD");
        request.setDescription("Embouteillage sur A1");

        Incident result = chauffeurService.signalerIncident(request, 1L);

        assertThat(result.getType()).isEqualTo("RETARD");
        assertThat(trajet.getStatut()).isEqualTo(StatutTrajet.RETARDE);
        verify(wsNotifService, times(1))
                .notifierAdmins(eq("INCIDENT_SIGNALE"), any());
    }

    @Test
    @DisplayName("Signaler incident PANNE → statut trajet non modifié")
    void signalerIncident_Panne_StatutInchange() {
        Incident incident = new Incident();
        incident.setId(1L);
        incident.setType("PANNE");
        incident.setTrajet(trajet);

        when(trajetRepository.findById(1L))
                .thenReturn(Optional.of(trajet));
        when(chauffeurRepository.findById(1L))
                .thenReturn(Optional.of(new Chauffeur()));
        when(incidentRepository.save(any())).thenReturn(incident);
        doNothing().when(wsNotifService).notifierAdmins(any(), any());

        IncidentRequest request = new IncidentRequest();
        request.setTrajetId(1L);
        request.setType("PANNE");
        request.setDescription("Crevaison");

        chauffeurService.signalerIncident(request, 1L);

        // Statut est changé en ANNULE pour une panne
        assertThat(trajet.getStatut()).isEqualTo(StatutTrajet.ANNULE);
        verify(trajetRepository, times(1)).save(trajet);
    }

    // ===== Tests déclenchement départ =====

    @Test
    @DisplayName("Déclencher départ → quai libéré + admin notifié + voyageurs notifiés")
    void declencherDepart_Success() throws JsonProcessingException {
        Quai quai = new Quai();
        quai.setId(1L);
        quai.setNumero(1);
        quai.setDisponible(false);
        trajet.setQuai(quai);
        trajet.getReservations().add(reservation);

        when(trajetRepository.findById(1L))
                .thenReturn(Optional.of(trajet));
        when(trajetRepository.save(any())).thenReturn(trajet);
        when(quaiRepository.save(any())).thenReturn(quai);
        when(stationnementRepo.findByMatriculeAndStatut(any(), any()))
                .thenReturn(Optional.empty());
        doNothing().when(wsNotifService).notifierAdmins(any(), any());
        doNothing().when(wsNotifService).notifierVoyageur(any(), any(), any());
        when(notifOfflineService.creerNotification(any(), any(), any(), any()))
                .thenReturn(null);
        when(objectMapper.writeValueAsString(any())).thenReturn("{}");

        Map<String, Object> result =
                chauffeurService.declencherDepart(1L, 1L);

        assertThat(result.get("statut")).isEqualTo("EN_COURS");
        assertThat(quai.isDisponible()).isTrue();
        verify(wsNotifService, times(1))
                .notifierAdmins(eq("TRAJET_DEPART"), any());
        verify(wsNotifService, times(1))
                .notifierVoyageur(eq("ahmed@test.ma"), eq("TRAJET_DEMARRE"), any());
        verify(notifOfflineService, times(1))
                .creerNotification(eq("ahmed@test.ma"), eq(TypeNotification.TRAJET_DEMARRE), any(), any());
    }
}