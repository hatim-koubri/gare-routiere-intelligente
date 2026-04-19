package ma.emsi.gare.controller.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.AnnonceRequest;
import ma.emsi.gare.dto.request.CodePromoRequest;
import ma.emsi.gare.dto.request.TarificationRequest;
import ma.emsi.gare.entity.Annonce;
import ma.emsi.gare.entity.CodePromo;
import ma.emsi.gare.service.AdminPromoAnnonceService;
import ma.emsi.gare.service.TarificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminPromoController {

    private final AdminPromoAnnonceService promoAnnonceService;
    private final TarificationService tarificationService;

    // ===== Codes Promo =====
    @PostMapping("/promos")
    public ResponseEntity<CodePromo> creerPromo(
            @Valid @RequestBody CodePromoRequest request) {
        return ResponseEntity.ok(promoAnnonceService.creerCodePromo(request));
    }

    @GetMapping("/promos")
    public ResponseEntity<List<CodePromo>> getPromos() {
        return ResponseEntity.ok(promoAnnonceService.getCodesPromosActifs());
    }

    @GetMapping("/promos/valider/{code}")
    public ResponseEntity<CodePromo> validerPromo(@PathVariable String code) {
        return ResponseEntity.ok(promoAnnonceService.validerCodePromo(code));
    }

    @PatchMapping("/promos/{id}/desactiver")
    public ResponseEntity<CodePromo> desactiverPromo(@PathVariable Long id) {
        return ResponseEntity.ok(promoAnnonceService.desactiverCodePromo(id));
    }

    // ===== Annonces =====
    @PostMapping("/annonces")
    public ResponseEntity<Annonce> creerAnnonce(
            @Valid @RequestBody AnnonceRequest request) {
        return ResponseEntity.ok(promoAnnonceService.creerAnnonce(request));
    }

    @GetMapping("/annonces")
    public ResponseEntity<List<Annonce>> getAnnonces() {
        return ResponseEntity.ok(promoAnnonceService.getAnnoncesActives());
    }

    @PatchMapping("/annonces/{id}/desactiver")
    public ResponseEntity<Annonce> desactiverAnnonce(@PathVariable Long id) {
        return ResponseEntity.ok(promoAnnonceService.desactiverAnnonce(id));
    }

    // ===== Tarification =====
    @PostMapping("/tarification/configurer")
    public ResponseEntity<Map<String, String>> configurerTarification(
            @RequestBody TarificationRequest request) {
        tarificationService.configurerRegles(
                request.getReductionTrentejours(),
                request.getReductionQuinzeJours(),
                request.getSupplementJourMeme(),
                request.getSeuilHaut(),
                request.getSupplementHaut(),
                request.getSeuilBas(),
                request.getReductionBas()
        );
        return ResponseEntity.ok(Map.of("message", "Tarification mise à jour"));
    }
}