package ma.emsi.gare.service;

import ma.emsi.gare.dto.request.BlocageSiegeRequest;
import ma.emsi.gare.entity.*;
import ma.emsi.gare.repository.CompagnieRepository;
import ma.emsi.gare.repository.SiegeRepository;
import ma.emsi.gare.repository.TrajetRepository;
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
class ResponsableBlocageSiegeServiceTest {

    @Mock
    private SiegeRepository siegeRepository;

    @Mock
    private TrajetRepository trajetRepository;

    @Mock
    private CompagnieRepository compagnieRepository;

    @InjectMocks
    private ResponsableBlocageSiegeService service;

    private Authentication authentication;
    private Compagnie compagnie;
    private Trajet trajet;
    private Siege siege;

    @BeforeEach
    void setup() {
        compagnie = new Compagnie();
        compagnie.setId(1L);

        ResponsableCompagnie responsable = new ResponsableCompagnie();
        responsable.setCompagnie(compagnie);

        authentication = new UsernamePasswordAuthenticationToken(responsable, null);

        Ligne ligne = new Ligne();
        ligne.setCompagnie(compagnie);

        trajet = new Trajet();
        trajet.setId(2L);
        trajet.setLigne(ligne);

        siege = new Siege();
        siege.setId(1L);
        siege.setTrajet(trajet);
        siege.setNumeroSiege("1A");
        siege.setBloque(false);
    }

    @Test
    void bloquer_shouldBlockSeatSuccessfully() {
        BlocageSiegeRequest request = new BlocageSiegeRequest();
        request.setTrajetId(2L);
        request.setNumeroSiege("1A");
        request.setMotifBlocage("Maintenance");

        when(compagnieRepository.findById(1L)).thenReturn(Optional.of(compagnie));
        when(trajetRepository.findById(2L)).thenReturn(Optional.of(trajet));
        when(siegeRepository.findByTrajetIdAndNumeroSiege(2L, "1A"))
                .thenReturn(Optional.of(siege));
        when(siegeRepository.save(any(Siege.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Siege result = service.bloquer(request, authentication);

        assertTrue(result.isBloque());
        assertEquals("Maintenance", result.getMotifBlocage());
        assertNotNull(result.getDateBlocage());
    }

    @Test
    void debloquer_shouldUnblockSeatSuccessfully() {
        siege.setBloque(true);
        siege.setMotifBlocage("Maintenance");

        when(compagnieRepository.findById(1L)).thenReturn(Optional.of(compagnie));
        when(siegeRepository.findById(1L)).thenReturn(Optional.of(siege));
        when(siegeRepository.save(any(Siege.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Siege result = service.debloquer(1L, authentication);

        assertFalse(result.isBloque());
        assertNull(result.getMotifBlocage());
        assertNull(result.getDateBlocage());
    }
}