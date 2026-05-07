package ma.emsi.gare.service;

import ma.emsi.gare.dto.request.TarificationDynamiqueRequest;
import ma.emsi.gare.entity.Compagnie;
import ma.emsi.gare.entity.ResponsableCompagnie;
import ma.emsi.gare.entity.TarificationDynamique;
import ma.emsi.gare.repository.CompagnieRepository;
import ma.emsi.gare.repository.TarificationDynamiqueRepository;
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
class ResponsableTarificationServiceTest {

    @Mock
    private TarificationDynamiqueRepository repository;

    @Mock
    private CompagnieRepository compagnieRepository;

    @InjectMocks
    private ResponsableTarificationService service;

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

        authentication = new UsernamePasswordAuthenticationToken(responsable, null);
    }

    @Test
    void configurer_shouldCreateConfigurationSuccessfully() {
        TarificationDynamiqueRequest request = new TarificationDynamiqueRequest();
        request.setReductionTrenteJours(25);
        request.setReductionQuinzeJours(15);
        request.setSupplementJourMeme(20);
        request.setSeuilHaut(85);
        request.setSupplementHaut(18);
        request.setSeuilBas(40);
        request.setReductionBas(12);

        when(compagnieRepository.findById(1L)).thenReturn(Optional.of(compagnie));
        when(repository.findByCompagnieId(1L)).thenReturn(Optional.empty());
        when(repository.save(any(TarificationDynamique.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        TarificationDynamique result = service.configurer(request, authentication);

        assertNotNull(result);
        assertEquals(25, result.getReductionTrenteJours());
        assertEquals(85, result.getSeuilHaut());
        assertEquals("CTM", result.getCompagnie().getNom());

        verify(repository).save(any(TarificationDynamique.class));
    }

    @Test
    void getConfiguration_shouldReturnExistingConfiguration() {
        TarificationDynamique config = new TarificationDynamique();
        config.setId(1L);
        config.setCompagnie(compagnie);

        when(compagnieRepository.findById(1L)).thenReturn(Optional.of(compagnie));
        when(repository.findByCompagnieId(1L)).thenReturn(Optional.of(config));

        TarificationDynamique result = service.getConfiguration(authentication);

        assertEquals(1L, result.getId());
    }
}