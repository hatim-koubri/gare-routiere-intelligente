package ma.emsi.gare.controller.responsable;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.BusRequest;
import ma.emsi.gare.dto.response.BusResponseDTO;
import ma.emsi.gare.entity.Bus;
import ma.emsi.gare.service.ResponsableBusService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/responsable/bus")
@RequiredArgsConstructor
public class ResponsableBusController {

    private final ResponsableBusService responsableBusService;

    @PostMapping
    public ResponseEntity<BusResponseDTO> creer(
            @Valid @RequestBody BusRequest request,
            Authentication authentication) {

        Bus bus = responsableBusService.creerBus(request, authentication);
        return ResponseEntity.ok(toDto(bus));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BusResponseDTO> modifier(
            @PathVariable Long id,
            @Valid @RequestBody BusRequest request,
            Authentication authentication) {

        Bus bus = responsableBusService.modifierBus(id, request, authentication);
        return ResponseEntity.ok(toDto(bus));
    }

    @PatchMapping("/{id}/maintenance")
    public ResponseEntity<BusResponseDTO> changerMaintenance(
            @PathVariable Long id,
            @RequestParam boolean enMaintenance,
            Authentication authentication) {

        Bus bus = responsableBusService.changerMaintenance(id, enMaintenance, authentication);
        return ResponseEntity.ok(toDto(bus));
    }

    @PatchMapping("/{id}/desactiver")
    public ResponseEntity<BusResponseDTO> desactiver(
            @PathVariable Long id,
            Authentication authentication) {

        Bus bus = responsableBusService.desactiverBus(id, authentication);
        return ResponseEntity.ok(toDto(bus));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(
            @PathVariable Long id,
            Authentication authentication) {

        responsableBusService.supprimerBus(id, authentication);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<BusResponseDTO>> getMesBus(Authentication authentication) {
        List<BusResponseDTO> bus = responsableBusService.getMesBus(authentication)
                .stream()
                .map(this::toDto)
                .toList();

        return ResponseEntity.ok(bus);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BusResponseDTO> getById(
            @PathVariable Long id,
            Authentication authentication) {

        Bus bus = responsableBusService.getBusById(id, authentication);
        return ResponseEntity.ok(toDto(bus));
    }

    private BusResponseDTO toDto(Bus bus) {
        BusResponseDTO dto = new BusResponseDTO();
        dto.setId(bus.getId());
        dto.setMatricule(bus.getMatricule());
        dto.setMarque(bus.getMarque());
        dto.setModele(bus.getModele());
        dto.setNbSieges(bus.getNbSieges());
        dto.setClimatise(bus.isClimatise());
        dto.setWifi(bus.isWifi());
        dto.setDateMaintenance(bus.getDateMaintenance());
        dto.setEnMaintenance(bus.isEnMaintenance());
        dto.setActif(bus.isActif());

        if (bus.getCompagnie() != null) {
            dto.setCompagnieId(bus.getCompagnie().getId());
            dto.setCompagnieNom(bus.getCompagnie().getNom());
        }

        return dto;
    }
}