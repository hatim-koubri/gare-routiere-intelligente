package ma.emsi.gare.service;

import ma.emsi.gare.dto.response.DashboardFinancierDTO;
import ma.emsi.gare.enums.StatutReservation;
import ma.emsi.gare.repository.PaiementRepository;
import ma.emsi.gare.repository.ReservationRepository;
import ma.emsi.gare.repository.SiegeRepository;
import ma.emsi.gare.repository.StationnementOCRRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DashboardFinancierServiceTest {

    @Mock
    private PaiementRepository paiementRepository;

    @Mock
    private StationnementOCRRepository stationnementOCRRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private SiegeRepository siegeRepository;

    @InjectMocks
    private DashboardFinancierService service;

    @Test
    void shouldCalculateDashboardCorrectly() {

        when(paiementRepository.calculerRecettesTickets()).thenReturn(1000.0);
        when(stationnementOCRRepository.calculerRecettesStationnement()).thenReturn(200.0);
        when(reservationRepository.countByStatut(StatutReservation.CONFIRMEE)).thenReturn(5L);
        when(reservationRepository.countByStatut(StatutReservation.ANNULEE)).thenReturn(2L);
        when(siegeRepository.count()).thenReturn(10L);

        when(siegeRepository.findAll()).thenReturn(java.util.List.of(
                mockSiege(true),
                mockSiege(true),
                mockSiege(false),
                mockSiege(true),
                mockSiege(false),
                mockSiege(true),
                mockSiege(false),
                mockSiege(false),
                mockSiege(true),
                mockSiege(false)
        ));

        DashboardFinancierDTO result = service.getDashboardFinancier();

        assertEquals(1000.0, result.getRecettesTickets());
        assertEquals(200.0, result.getRecettesStationnement());
        assertEquals(1200.0, result.getRecettesTotales());
        assertEquals(5, result.getReservationsConfirmees());
        assertEquals(2, result.getReservationsAnnulees());
        assertTrue(result.getTauxRemplissageGlobal() > 0);
    }

    private ma.emsi.gare.entity.Siege mockSiege(boolean occupe) {
        ma.emsi.gare.entity.Siege s = new ma.emsi.gare.entity.Siege();
        s.setOccupe(occupe);
        return s;
    }
}