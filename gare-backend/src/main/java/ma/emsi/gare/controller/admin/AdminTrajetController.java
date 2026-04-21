package ma.emsi.gare.controller.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.RegisterRequest;
import ma.emsi.gare.dto.request.TrajetRequest;
import ma.emsi.gare.dto.response.ChauffeurResponseDTO;
import ma.emsi.gare.dto.response.TrajetResponseDTO;
import ma.emsi.gare.entity.Chauffeur;
import ma.emsi.gare.entity.Trajet;
import ma.emsi.gare.mapper.GareMapper;
import ma.emsi.gare.repository.TrajetRepository;
import ma.emsi.gare.service.AdminTrajetChauffeurService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminTrajetController {

    private final AdminTrajetChauffeurService service;
    private final GareMapper mapper;
    private final TrajetRepository trajetRepository;

    // ===== Trajets =====
    @PostMapping("/trajets")
    public ResponseEntity<TrajetResponseDTO> creerTrajet(
            @Valid @RequestBody TrajetRequest request) {
        Trajet trajet = service.creerTrajet(request);
        return ResponseEntity.ok(mapper.toTrajetDTO(trajet));
    }

    @PutMapping("/trajets/{id}")
    public ResponseEntity<TrajetResponseDTO> modifierTrajet(
            @PathVariable Long id,
            @Valid @RequestBody TrajetRequest request) {
        Trajet trajet = service.modifierTrajet(id, request);
        return ResponseEntity.ok(mapper.toTrajetDTO(trajet));
    }

    @PatchMapping("/trajets/{id}/annuler")
    public ResponseEntity<TrajetResponseDTO> annulerTrajet(
            @PathVariable Long id) {
        Trajet trajet = service.annulerTrajet(id);
        return ResponseEntity.ok(mapper.toTrajetDTO(trajet));
    }

    @GetMapping("/trajets")
    public ResponseEntity<List<TrajetResponseDTO>> getTrajets() {
        List<Trajet> trajets = service.getTousLesTrajets();
        return ResponseEntity.ok(mapper.toTrajetDTOList(trajets));
    }

    @GetMapping("/trajets/{id}")
    public ResponseEntity<TrajetResponseDTO> getTrajetById(
            @PathVariable Long id) {
        Trajet trajet = trajetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trajet non trouvé"));
        return ResponseEntity.ok(mapper.toTrajetDTO(trajet));
    }

    // ===== Chauffeurs =====
    @PostMapping("/chauffeurs/compagnie/{compagnieId}")
    public ResponseEntity<ChauffeurResponseDTO> creerChauffeur(
            @Valid @RequestBody RegisterRequest request,
            @PathVariable Long compagnieId) {
        Chauffeur chauffeur = service.creerChauffeur(request, compagnieId);
        return ResponseEntity.ok(mapper.toChauffeurDTO(chauffeur));
    }

    @PatchMapping("/chauffeurs/{id}/conge")
    public ResponseEntity<ChauffeurResponseDTO> mettreEnConge(
            @PathVariable Long id) {
        Chauffeur chauffeur = service.mettreEnConge(id);
        return ResponseEntity.ok(mapper.toChauffeurDTO(chauffeur));
    }

    @PatchMapping("/chauffeurs/{id}/retour-conge")
    public ResponseEntity<ChauffeurResponseDTO> remettreDuConge(
            @PathVariable Long id) {
        Chauffeur chauffeur = service.remettreDuConge(id);
        return ResponseEntity.ok(mapper.toChauffeurDTO(chauffeur));
    }

    @GetMapping("/chauffeurs/disponibles/{compagnieId}")
    public ResponseEntity<List<ChauffeurResponseDTO>> getChauffeursDisponibles(
            @PathVariable Long compagnieId) {
        List<Chauffeur> chauffeurs =
                service.getChauffeursDisponibles(compagnieId);
        return ResponseEntity.ok(mapper.toChauffeurDTOList(chauffeurs));
    }
}