package ma.emsi.gare.service;

import ma.emsi.gare.dto.request.BusRequest;
import ma.emsi.gare.entity.Bus;
import ma.emsi.gare.entity.Compagnie;
import ma.emsi.gare.repository.BusRepository;
import ma.emsi.gare.repository.CompagnieRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminBusService — Tests unitaires")
class AdminBusServiceTest {

    @Mock private BusRepository busRepository;
    @Mock private CompagnieRepository compagnieRepository;
    @InjectMocks private AdminBusService adminBusService;

    private BusRequest busRequest;
    private Compagnie ctm;
    private Bus bus;

    @BeforeEach
    void setUp() {
        ctm = new Compagnie();
        ctm.setId(1L);
        ctm.setNom("CTM");
        ctm.setCode("CTM001");

        busRequest = new BusRequest();
        busRequest.setMatricule("12345-A-1");
        busRequest.setMarque("Mercedes");
        busRequest.setModele("Tourismo");
        busRequest.setNbSieges(45);
        busRequest.setClimatise(true);
        busRequest.setWifi(true);
        busRequest.setCompagnieId(1L);

        bus = new Bus();
        bus.setId(1L);
        bus.setMatricule("12345-A-1");
        bus.setMarque("Mercedes");
        bus.setNbSieges(45);
        bus.setActif(true);
        bus.setCompagnie(ctm);
    }

    @Test
    @DisplayName("Créer bus — succès")
    void creerBus_Success() {
        when(busRepository.existsByMatricule("12345-A-1")).thenReturn(false);
        when(compagnieRepository.findById(1L)).thenReturn(Optional.of(ctm));
        when(busRepository.save(any())).thenReturn(bus);

        Bus result = adminBusService.creerBus(busRequest);

        assertThat(result).isNotNull();
        assertThat(result.getMatricule()).isEqualTo("12345-A-1");
        assertThat(result.getNbSieges()).isEqualTo(45);
        verify(busRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Créer bus — matricule déjà existant → exception")
    void creerBus_MatriculeExistant_ThrowsException() {
        when(busRepository.existsByMatricule("12345-A-1")).thenReturn(true);

        assertThatThrownBy(() -> adminBusService.creerBus(busRequest))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Matricule déjà existant");

        verify(busRepository, never()).save(any());
    }

    @Test
    @DisplayName("Créer bus — compagnie non trouvée → exception")
    void creerBus_CompagnieNonTrouvee_ThrowsException() {
        when(busRepository.existsByMatricule(any())).thenReturn(false);
        when(compagnieRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminBusService.creerBus(busRequest))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Compagnie non trouvée");
    }

    @Test
    @DisplayName("Désactiver bus — actif devient false")
    void desactiverBus_Success() {
        when(busRepository.findById(1L)).thenReturn(Optional.of(bus));
        when(busRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Bus result = adminBusService.desactiverBus(1L);

        assertThat(result.isActif()).isFalse();
        verify(busRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Supprimer bus — bus non trouvé → exception")
    void supprimerBus_NonTrouve_ThrowsException() {
        when(busRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> adminBusService.supprimerBus(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Bus non trouvé");

        verify(busRepository, never()).deleteById(any());
    }
}