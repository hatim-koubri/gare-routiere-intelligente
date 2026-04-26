package ma.emsi.gare.controller.voyageur;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.response.CompagnieResponseDTO;
import ma.emsi.gare.entity.Compagnie;
import ma.emsi.gare.mapper.GareMapper;
import ma.emsi.gare.repository.CompagnieRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/voyageur/compagnies")
@RequiredArgsConstructor
public class VoyageurCompagnieController {

    private final CompagnieRepository compagnieRepository;
    private final GareMapper mapper;

    @GetMapping
    public List<CompagnieResponseDTO> getAll() {
        return mapper.toCompagnieDTOList(compagnieRepository.findAll());
    }

    @GetMapping("/{id}")
    public CompagnieResponseDTO getById(@PathVariable Long id) {
        Compagnie compagnie = compagnieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Compagnie non trouvée"));
        return mapper.toCompagnieDTO(compagnie);
    }
}