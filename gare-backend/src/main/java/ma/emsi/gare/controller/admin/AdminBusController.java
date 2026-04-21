package ma.emsi.gare.controller.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.BusRequest;
import ma.emsi.gare.dto.response.BusResponseDTO;
import ma.emsi.gare.entity.Bus;
import ma.emsi.gare.mapper.GareMapper;
import ma.emsi.gare.service.AdminBusService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/bus")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminBusController {

    private final AdminBusService adminBusService;
    private final GareMapper mapper;  // ← Injecter le mapper

    @PostMapping
    public ResponseEntity<BusResponseDTO> creer(@Valid @RequestBody BusRequest request) {
        Bus bus = adminBusService.creerBus(request);
        return ResponseEntity.ok(mapper.toBusDTO(bus));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BusResponseDTO> modifier(@PathVariable Long id,
                                                   @Valid @RequestBody BusRequest request) {
        Bus bus = adminBusService.modifierBus(id, request);
        return ResponseEntity.ok(mapper.toBusDTO(bus));
    }

    @PatchMapping("/{id}/desactiver")
    public ResponseEntity<BusResponseDTO> desactiver(@PathVariable Long id) {
        Bus bus = adminBusService.desactiverBus(id);
        return ResponseEntity.ok(mapper.toBusDTO(bus));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        adminBusService.supprimerBus(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<BusResponseDTO>> getAll() {
        List<Bus> bus = adminBusService.getTousLesBus();
        return ResponseEntity.ok(mapper.toBusDTOList(bus));
    }

    @GetMapping("/compagnie/{compagnieId}")
    public ResponseEntity<List<BusResponseDTO>> getByCompagnie(
            @PathVariable Long compagnieId) {
        List<Bus> bus = adminBusService.getBusParCompagnie(compagnieId);
        return ResponseEntity.ok(mapper.toBusDTOList(bus));
    }
}