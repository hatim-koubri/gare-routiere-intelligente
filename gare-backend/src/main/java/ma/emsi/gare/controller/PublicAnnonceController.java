package ma.emsi.gare.controller;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.response.AnnonceResponseDTO;
import ma.emsi.gare.entity.Annonce;
import ma.emsi.gare.entity.Compagnie;
import ma.emsi.gare.repository.AnnonceRepository;
import ma.emsi.gare.repository.CompagnieRepository;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public/annonces")
@RequiredArgsConstructor
public class PublicAnnonceController {

    private final AnnonceRepository annonceRepository;
    private final CompagnieRepository compagnieRepository;

    @GetMapping
    public ResponseEntity<List<AnnonceResponseDTO>> getAnnonces(
            @RequestParam(required = false) Long compagnieId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateMin,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateMax
    ) {
        LocalDateTime now = LocalDateTime.now();
        List<Annonce> annonces = annonceRepository.findAnnoncesActivesFiltered(now, compagnieId, dateMin, dateMax);
        return ResponseEntity.ok(annonces.stream().map(this::toDto).toList());
    }

    @GetMapping("/compagnies")
    public ResponseEntity<List<Map<String, Object>>> getCompagnies() {
        List<Compagnie> compagnies = compagnieRepository.findByActifTrue();
        List<Map<String, Object>> data = compagnies.stream()
                .map(c -> Map.<String, Object>of(
                        "id", c.getId(),
                        "nom", c.getNom(),
                        "code", c.getCode()
                ))
                .toList();
        return ResponseEntity.ok(data);
    }

    private AnnonceResponseDTO toDto(Annonce annonce) {
        AnnonceResponseDTO dto = new AnnonceResponseDTO();
        dto.setId(annonce.getId());
        dto.setTitreFr(annonce.getTitreFr());
        dto.setTitreAr(annonce.getTitreAr());
        dto.setContenuFr(annonce.getContenuFr());
        dto.setContenuAr(annonce.getContenuAr());
        dto.setDateDebut(annonce.getDateDebut());
        dto.setDateFin(annonce.getDateFin());
        dto.setActive(annonce.isActive());
        if (annonce.getCompagnie() != null) {
            dto.setCompagnieId(annonce.getCompagnie().getId());
            dto.setCompagnieNom(annonce.getCompagnie().getNom());
        }
        return dto;
    }
}
