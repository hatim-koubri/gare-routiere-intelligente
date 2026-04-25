package ma.emsi.gare.controller.chauffeur;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.IncidentRequest;
import ma.emsi.gare.dto.request.JalonRequest;
import ma.emsi.gare.dto.response.IncidentResponseDTO;
import ma.emsi.gare.entity.Arret;
import ma.emsi.gare.entity.Incident;
import ma.emsi.gare.entity.Trajet;
import ma.emsi.gare.entity.User;
import ma.emsi.gare.mapper.GareMapper;
import ma.emsi.gare.repository.IncidentRepository;
import ma.emsi.gare.repository.TrajetRepository;
import ma.emsi.gare.service.ChauffeurService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import ma.emsi.gare.dto.response.TrajetResponseDTO;
@RestController
@RequestMapping("/api/chauffeur")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('CHAUFFEUR')")
public class ChauffeurController {

    private final ChauffeurService chauffeurService;
    private final GareMapper mapper;
    private final TrajetRepository trajetRepository;  // ← Injecter le repository
    private final IncidentRepository incidentRepository;

    // US-33 — Trajets du jour
    @GetMapping("/trajets/jour")
    public ResponseEntity<List<TrajetResponseDTO>> getTrajetsJour(Authentication auth) {
        Long chauffeurId = getUserId(auth);
        return ResponseEntity.ok(chauffeurService.getTrajetsJour(chauffeurId));
    }

    // US-34 — Manifeste de voyage
    @GetMapping("/trajets/{trajetId}/manifeste")
    public ResponseEntity<Map<String, Object>> getManifeste(
            @PathVariable Long trajetId) {
        return ResponseEntity.ok(
                chauffeurService.getManifeste(trajetId));
    }

    // US-35 — Valider ticket QR
    @PostMapping("/tickets/valider/{qrCode}")
    public ResponseEntity<Map<String, Object>> validerTicket(
            @PathVariable String qrCode) {
        return ResponseEntity.ok(
                chauffeurService.validerTicketQR(qrCode));
    }

    // US-36 — Scanner bagage
    @PostMapping("/bagages/scanner/{bagageId}")
    public ResponseEntity<Map<String, Object>> scannerBagage(
            @PathVariable Long bagageId) {
        return ResponseEntity.ok(
                chauffeurService.scannerBagage(bagageId));
    }

    // US-37 — Valider jalon
    @PostMapping("/jalons/valider")
    public ResponseEntity<Map<String, Object>> validerJalon(
            @Valid @RequestBody JalonRequest request,
            Authentication auth) {
        Long chauffeurId = getUserId(auth);
        return ResponseEntity.ok(
                chauffeurService.validerJalon(request, chauffeurId));
    }

    // US-41 — Bouton DÉPART
    @PostMapping("/trajets/{trajetId}/depart")
    public ResponseEntity<Map<String, Object>> declencherDepart(
            @PathVariable Long trajetId,
            Authentication auth) {
        Long chauffeurId = getUserId(auth);
        return ResponseEntity.ok(
                chauffeurService.declencherDepart(trajetId, chauffeurId));
    }

    // US-42 — Signaler incident
    @PostMapping("/incidents")
    public ResponseEntity<IncidentResponseDTO> signalerIncident(
            @Valid @RequestBody IncidentRequest request,
            Authentication auth) {
        Long chauffeurId = getUserId(auth);
        Incident incident = chauffeurService.signalerIncident(request, chauffeurId);
        return ResponseEntity.ok(mapper.toIncidentDTO(incident));
    }

    private Long getUserId(Authentication auth) {
        User user = (User) auth.getPrincipal();
        return user.getId();
    }
    @GetMapping("/trajets/{trajetId}/arrets")
    public ResponseEntity<List<Arret>> getArretsByTrajet(@PathVariable Long trajetId) {
        Trajet trajet = trajetRepository.findById(trajetId)
                .orElseThrow(() -> new RuntimeException("Trajet non trouvé"));
        List<Arret> arrets = trajet.getLigne().getArrets();
        return ResponseEntity.ok(arrets);
    }
    // Récupérer les incidents d'un trajet (pour chauffeur)
    @GetMapping("/trajets/{trajetId}/incidents")
    public ResponseEntity<List<IncidentResponseDTO>> getIncidentsByTrajet(@PathVariable Long trajetId) {
        List<Incident> incidents = incidentRepository.findByTrajetId(trajetId);
        return ResponseEntity.ok(mapper.toIncidentDTOList(incidents));
    }
    @GetMapping("/trajets/historique")
    public ResponseEntity<List<TrajetResponseDTO>> getHistoriqueTrajets(Authentication auth) {
        Long chauffeurId = getUserId(auth);
        return ResponseEntity.ok(chauffeurService.getHistoriqueTrajets(chauffeurId));
    }
    // Récupérer tous les incidents du chauffeur connecté
    @GetMapping("/incidents")
    public ResponseEntity<List<IncidentResponseDTO>> getMesIncidents(Authentication auth) {
        Long chauffeurId = getUserId(auth);
        List<Incident> incidents = incidentRepository.findByChauffeurId(chauffeurId);
        return ResponseEntity.ok(mapper.toIncidentDTOList(incidents));
    }


}