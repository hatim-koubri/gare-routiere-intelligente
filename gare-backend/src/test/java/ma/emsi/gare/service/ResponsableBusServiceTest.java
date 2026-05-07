package ma.emsi.gare.service;

import ma.emsi.gare.dto.request.BusRequest;
import ma.emsi.gare.entity.Bus;
import ma.emsi.gare.entity.Compagnie;
import ma.emsi.gare.entity.ResponsableCompagnie;
import ma.emsi.gare.repository.BusRepository;
import ma.emsi.gare.repository.CompagnieRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResponsableBusServiceTest {

    @Mock
    private BusRepository busRepository;

    @Mock
    private CompagnieRepository compagnieRepository;

    @InjectMocks
    private ResponsableBusService service;

    private Authentication authentication;
    private Compagnie compagnie;

    @BeforeEach
    void setup() {
        compagnie = new Compagnie();
        compagnie.setId(1L);
        compagnie.setNom("CTM");

        ResponsableCompagnie responsable = new ResponsableCompagnie();
        responsable.setId(8L);
        responsable.setCompagnie(compagnie);

        authentication = new UsernamePasswordAuthenticationToken(
                responsable,
                null
        );
    }

    @Test
    void creerBus_shouldCreateBusSuccessfully() {
        BusRequest request = new BusRequest();
        request.setMatricule("CTM-001");
        request.setMarque("Mercedes");
        request.setModele("Tourismo");
        request.setNbSieges(50);
        request.setClimatise(true);
        request.setWifi(true);
        request.setDateMaintenance(LocalDate.of(2026, 5, 1));

        when(compagnieRepository.findById(1L))
                .thenReturn(Optional.of(compagnie));

        when(busRepository.existsByMatricule("CTM-001"))
                .thenReturn(false);

        when(busRepository.save(any(Bus.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Bus result = service.creerBus(request, authentication);

        assertNotNull(result);
        assertEquals("CTM-001", result.getMatricule());
        assertEquals("CTM", result.getCompagnie().getNom());
        assertTrue(result.isActif());

        verify(busRepository).save(any(Bus.class));
    }

    @Test
    void creerBus_shouldThrowException_whenMatriculeExists() {
        BusRequest request = new BusRequest();
        request.setMatricule("CTM-001");

        when(compagnieRepository.findById(1L))
                .thenReturn(Optional.of(compagnie));

        when(busRepository.existsByMatricule("CTM-001"))
                .thenReturn(true);

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.creerBus(request, authentication)
        );

        assertTrue(
                ex.getMessage().contains("Matricule déjà existant")
        );

        verify(busRepository, never()).save(any(Bus.class));
    }
}