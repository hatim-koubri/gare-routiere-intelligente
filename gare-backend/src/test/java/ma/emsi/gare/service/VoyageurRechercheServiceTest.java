package ma.emsi.gare.service;

import ma.emsi.gare.dto.request.RechercheTrajetRequest;
import ma.emsi.gare.dto.response.TrajetResponseDTO;
import ma.emsi.gare.entity.Trajet;
import ma.emsi.gare.mapper.GareMapper;
import ma.emsi.gare.repository.TrajetRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VoyageurRechercheServiceTest {

    @Mock
    private TrajetRepository trajetRepository;

    @Mock
    private GareMapper gareMapper;

    @InjectMocks
    private VoyageurRechercheService voyageurRechercheService;

    @Test
    void rechercherTrajetsDirects_shouldReturnTrajets() {
        RechercheTrajetRequest request = new RechercheTrajetRequest();
        request.setVilleDepart("Casablanca");
        request.setVilleArrivee("Marrakech");
        request.setDate(LocalDate.of(2026, 5, 10));
        request.setCompagnieId(1L);

        Trajet trajet = new Trajet();

        TrajetResponseDTO dto = new TrajetResponseDTO();
        dto.setId(1L);
        dto.setVilleDepart("Casablanca");
        dto.setVilleArrivee("Marrakech");

        when(trajetRepository.findByVillePeriodeEtCompagnie(
                anyString(),
                anyString(),
                any(),
                any(),
                anyList(),
                any()
        )).thenReturn(List.of(trajet));

        when(gareMapper.toTrajetDTOList(List.of(trajet)))
                .thenReturn(List.of(dto));

        List<TrajetResponseDTO> result =
                voyageurRechercheService.rechercherTrajetsDirects(request);

        assertEquals(1, result.size());
        assertEquals("Casablanca", result.get(0).getVilleDepart());
        assertEquals("Marrakech", result.get(0).getVilleArrivee());
    }

    @Test
    void rechercherTrajetsDirects_shouldThrowWhenMissingData() {
        RechercheTrajetRequest request = new RechercheTrajetRequest();

        assertThrows(RuntimeException.class, () ->
                voyageurRechercheService.rechercherTrajetsDirects(request)
        );
    }
}