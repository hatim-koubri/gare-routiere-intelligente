package ma.emsi.gare.service;

import ma.emsi.gare.dto.request.PaiementRequest;
import ma.emsi.gare.dto.response.PaiementResponseDTO;
import ma.emsi.gare.entity.*;
import ma.emsi.gare.enums.CategorieTarifaire;
import ma.emsi.gare.enums.StatutReservation;
import ma.emsi.gare.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaiementServiceTest {

    @Mock private PaiementRepository paiementRepository;
    @Mock private ReservationRepository reservationRepository;
    @Mock private SiegeRepository siegeRepository;
    @Mock private TicketRepository ticketRepository;
    @Mock private PdfService pdfService;
    @Mock private EmailService emailService;
    @Mock private MembreGroupeRepository membreGroupeRepository;
    @Mock private GroupeVoyageRepository groupeVoyageRepository;

    @InjectMocks
    private PaiementService paiementService;

    @Test
    void simulerPaiement_shouldConfirmReservationAndCreateTickets() {
        Voyageur voyageur = new Voyageur();
        voyageur.setId(6L);
        voyageur.setEmail("test@gmail.com");

        Ligne ligne = new Ligne();
        ligne.setVilleDepart("Casablanca");
        ligne.setVilleArrivee("Marrakech");

        Trajet trajet = new Trajet();
        trajet.setId(2L);
        trajet.setLigne(ligne);

        Reservation reservation = new Reservation();
        reservation.setId(1L);
        reservation.setVoyageur(voyageur);
        reservation.setTrajet(trajet);
        reservation.setPrixTotal(210.0);
        reservation.setStatut(StatutReservation.EN_ATTENTE);

        Siege siege1 = new Siege();
        siege1.setNumeroSiege("2A");
        siege1.setVerrouilleTemporaire(true);
        siege1.setVerrouilleParReservationId(1L);

        Siege siege2 = new Siege();
        siege2.setNumeroSiege("2B");
        siege2.setVerrouilleTemporaire(true);
        siege2.setVerrouilleParReservationId(1L);

        GroupeVoyage groupe = new GroupeVoyage();
        groupe.setId(1L);
        groupe.setReservation(reservation);

        MembreGroupe membre1 = new MembreGroupe();
        membre1.setNomManuel("Test");
        membre1.setPrenomManuel("A");
        membre1.setCategorieTarifaire(CategorieTarifaire.ETUDIANT);
        membre1.setPrixMembre(90.0);

        MembreGroupe membre2 = new MembreGroupe();
        membre2.setNomManuel("Test");
        membre2.setPrenomManuel("B");
        membre2.setCategorieTarifaire(CategorieTarifaire.NORMAL);
        membre2.setPrixMembre(120.0);

        Paiement paiement = new Paiement();
        paiement.setId(1L);
        paiement.setReservation(reservation);
        paiement.setMontant(210.0);
        paiement.setMethodePaiement("CARTE");
        paiement.setConfirme(true);

        PaiementRequest request = new PaiementRequest();
        request.setReservationId(1L);
        request.setMethodePaiement("CARTE");

        when(reservationRepository.findById(1L))
                .thenReturn(Optional.of(reservation));

        when(siegeRepository.findByTrajetId(2L))
                .thenReturn(List.of(siege1, siege2));

        when(paiementRepository.save(any(Paiement.class)))
                .thenAnswer(invocation -> {
                    Paiement p = invocation.getArgument(0);
                    p.setId(1L);
                    return p;
                });

        when(groupeVoyageRepository.findByReservationId(1L))
                .thenReturn(Optional.of(groupe));

        when(membreGroupeRepository.findByGroupeId(1L))
                .thenReturn(List.of(membre1, membre2));

        when(ticketRepository.save(any(Ticket.class)))
                .thenAnswer(invocation -> {
                    Ticket t = invocation.getArgument(0);
                    t.setId(1L);
                    return t;
                });

        when(pdfService.genererTicket(anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(new byte[]{1, 2, 3});

        PaiementResponseDTO response = paiementService.simulerPaiement(request);

        assertNotNull(response);
        assertEquals(1L, response.getPaiementId());
        assertEquals(1L, response.getReservationId());
        assertEquals(210.0, response.getMontant());
        assertTrue(response.isConfirme());
        assertEquals("CONFIRMEE", response.getStatutReservation());

        assertEquals(StatutReservation.CONFIRMEE, reservation.getStatut());
        assertTrue(siege1.isOccupe());
        assertTrue(siege2.isOccupe());
        assertFalse(siege1.isVerrouilleTemporaire());
        assertFalse(siege2.isVerrouilleTemporaire());

        verify(ticketRepository, times(2)).save(any(Ticket.class));
        verify(emailService, times(2)).envoyerTicket(eq("test@gmail.com"), any());
    }
}