package ma.emsi.gare.service;

import ma.emsi.gare.dto.request.TraitementRemboursementRequest;
import ma.emsi.gare.dto.response.RemboursementResponseDTO;
import ma.emsi.gare.entity.*;
import ma.emsi.gare.enums.StatutRemboursement;
import ma.emsi.gare.enums.StatutReservation;
import ma.emsi.gare.repository.CompagnieRepository;
import ma.emsi.gare.repository.RemboursementRepository;
import ma.emsi.gare.repository.ReservationRepository;
import ma.emsi.gare.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResponsableRemboursementServiceTest {

    @Mock
    private RemboursementRepository repository;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private CompagnieRepository compagnieRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ResponsableRemboursementService service;

    private Authentication authentication;
    private Compagnie compagnie;
    private ResponsableCompagnie responsable;
    private Remboursement remboursement;
    private Reservation reservation;

    @BeforeEach
    void setup() {
        compagnie = new Compagnie();
        compagnie.setId(1L);

        responsable = new ResponsableCompagnie();
        responsable.setEmail("responsable@test.com");
        responsable.setCompagnie(compagnie);

        authentication = new UsernamePasswordAuthenticationToken(responsable, null);

        Ligne ligne = new Ligne();
        ligne.setCompagnie(compagnie);

        Trajet trajet = new Trajet();
        trajet.setLigne(ligne);

        reservation = new Reservation();
        reservation.setId(2L);
        reservation.setTrajet(trajet);
        reservation.setStatut(StatutReservation.CONFIRMEE);

        remboursement = new Remboursement();
        remboursement.setId(1L);
        remboursement.setReservation(reservation);
        remboursement.setMontant(120.0);
        remboursement.setStatut(StatutRemboursement.EN_ATTENTE);
    }

    @Test
    void traiter_shouldAcceptRefundAndUpdateReservation() {
        TraitementRemboursementRequest request =
                new TraitementRemboursementRequest();
        request.setStatut(StatutRemboursement.ACCEPTE);

        when(userRepository.findByEmail("responsable@test.com"))
                .thenReturn(Optional.of(responsable));

        when(repository.findById(1L))
                .thenReturn(Optional.of(remboursement));

        when(repository.save(any(Remboursement.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        RemboursementResponseDTO result =
                service.traiter(1L, request, authentication);

        assertEquals(StatutRemboursement.ACCEPTE, result.getStatut());
        assertEquals(StatutReservation.REMBOURSEE, reservation.getStatut());
        assertNotNull(result.getDateTraitement());

        verify(reservationRepository).save(reservation);
        verify(repository).save(remboursement);
    }

    @Test
    void traiter_shouldRejectRefundWithoutChangingReservationToRefunded() {
        TraitementRemboursementRequest request =
                new TraitementRemboursementRequest();
        request.setStatut(StatutRemboursement.REFUSE);

        when(userRepository.findByEmail("responsable@test.com"))
                .thenReturn(Optional.of(responsable));

        when(repository.findById(1L))
                .thenReturn(Optional.of(remboursement));

        when(repository.save(any(Remboursement.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        RemboursementResponseDTO result =
                service.traiter(1L, request, authentication);

        assertEquals(StatutRemboursement.REFUSE, result.getStatut());
        assertEquals(StatutReservation.CONFIRMEE, reservation.getStatut());

        verify(reservationRepository, never()).save(any());
    }
}