package ma.emsi.gare.controller.admin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.response.MessageResponseDTO;
import ma.emsi.gare.entity.User;
import ma.emsi.gare.service.AdminMessagerieService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/messages")
@RequiredArgsConstructor
public class AdminMessagerieController {

    private final AdminMessagerieService service;

    @GetMapping("/inbox")
    public ResponseEntity<List<MessageResponseDTO>> getInbox(Authentication authentication) {
        List<MessageResponseDTO> messages = service.getInbox(authentication)
                .stream().map(service::toDto).toList();
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MessageResponseDTO> getMessage(
            @PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(service.toDto(service.getMessage(id, authentication)));
    }

    @PostMapping("/envoyer")
    public ResponseEntity<MessageResponseDTO> envoyer(
            @Valid @RequestBody EnvoyerMessageRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(service.toDto(
                service.envoyer(request.getContenu(), request.getDestinataireId(), authentication)));
    }

    @GetMapping("/responsables")
    public ResponseEntity<List<ResponsableDTO>> getResponsables() {
        List<ResponsableDTO> dtos = service.getResponsables().stream()
                .map(u -> new ResponsableDTO(u.getId(), u.getNom(), u.getPrenom(), u.getEmail()))
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @Data
    public static class EnvoyerMessageRequest {
        @NotNull
        private Long destinataireId;
        @NotBlank
        private String contenu;
    }

    @Data
    @AllArgsConstructor
    public static class ResponsableDTO {
        private Long id;
        private String nom;
        private String prenom;
        private String email;
    }
}
