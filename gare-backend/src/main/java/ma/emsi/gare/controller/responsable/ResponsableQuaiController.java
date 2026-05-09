package ma.emsi.gare.controller.responsable;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.response.QuaiResponseDTO;
import ma.emsi.gare.entity.Quai;
import ma.emsi.gare.service.ResponsableQuaiService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/responsable/quais")
@RequiredArgsConstructor
public class ResponsableQuaiController {

    private final ResponsableQuaiService responsableQuaiService;

    @GetMapping
    public ResponseEntity<List<QuaiResponseDTO>> getMesQuais(Authentication authentication) {
        List<Quai> quais = responsableQuaiService.getMesQuais(authentication);
        List<QuaiResponseDTO> dtos = quais.stream()
                .map(q -> {
                    QuaiResponseDTO dto = new QuaiResponseDTO();
                    dto.setId(q.getId());
                    dto.setNumero(q.getNumero());
                    if (q.getCompagnie() != null) {
                        dto.setCompagnieId(q.getCompagnie().getId());
                    }
                    return dto;
                })
                .toList();
        return ResponseEntity.ok(dtos);
    }
}
