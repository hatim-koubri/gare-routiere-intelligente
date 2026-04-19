package ma.emsi.gare.controller.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.BusRequest;
import ma.emsi.gare.entity.Bus;
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

    @PostMapping
    public ResponseEntity<Bus> creer(@Valid @RequestBody BusRequest request) {
        return ResponseEntity.ok(adminBusService.creerBus(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Bus> modifier(@PathVariable Long id,
                                        @Valid @RequestBody BusRequest request) {
        return ResponseEntity.ok(adminBusService.modifierBus(id, request));
    }

    @PatchMapping("/{id}/desactiver")
    public ResponseEntity<Bus> desactiver(@PathVariable Long id) {
        return ResponseEntity.ok(adminBusService.desactiverBus(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        adminBusService.supprimerBus(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<Bus>> getAll() {
        return ResponseEntity.ok(adminBusService.getTousLesBus());
    }

    @GetMapping("/compagnie/{compagnieId}")
    public ResponseEntity<List<Bus>> getByCompagnie(
            @PathVariable Long compagnieId) {
        return ResponseEntity.ok(
                adminBusService.getBusParCompagnie(compagnieId));
    }
}