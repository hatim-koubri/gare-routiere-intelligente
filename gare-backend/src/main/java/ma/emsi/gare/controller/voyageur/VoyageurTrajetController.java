package ma.emsi.gare.controller.voyageur;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.response.TrajetResponseDTO;
import ma.emsi.gare.mapper.GareMapper;
import ma.emsi.gare.repository.TrajetRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/voyageur/trajets")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class VoyageurTrajetController {

    private final TrajetRepository trajetRepository;
    private final GareMapper mapper;

    @GetMapping("/{id}")
    public ResponseEntity<TrajetResponseDTO> getTrajet(@PathVariable Long id) {
        return trajetRepository.findById(id)
                .map(mapper::toTrajetDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}