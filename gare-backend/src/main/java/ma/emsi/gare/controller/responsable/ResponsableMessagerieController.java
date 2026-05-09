package ma.emsi.gare.controller.responsable;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.response.MessageResponseDTO;
import ma.emsi.gare.entity.Message;
import ma.emsi.gare.service.ResponsableMessagerieService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/responsable/messages")
@RequiredArgsConstructor
public class ResponsableMessagerieController {

    private final ResponsableMessagerieService service;

    @GetMapping("/inbox")
    public ResponseEntity<List<MessageResponseDTO>> getInbox(
            Authentication authentication
    ) {
        List<MessageResponseDTO> messages = service.getInbox(authentication)
                .stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MessageResponseDTO> getMessage(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                toDto(service.getMessage(id, authentication))
        );
    }

    @PostMapping("/envoyer")
    public ResponseEntity<MessageResponseDTO> envoyer(
            @Valid @RequestBody EnvoyerMessageRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                toDto(service.envoyer(request.getContenu(), authentication))
        );
    }

    private MessageResponseDTO toDto(Message message) {
        MessageResponseDTO dto = new MessageResponseDTO();
        dto.setId(message.getId());
        dto.setContenu(message.getContenu());
        dto.setLu(message.isLu());
        dto.setDateEnvoi(message.getDateEnvoi());
        if (message.getExpediteur() != null) {
            dto.setExpediteurId(message.getExpediteur().getId());
            dto.setExpediteurNom(message.getExpediteur().getNom());
            dto.setExpediteurPrenom(message.getExpediteur().getPrenom());
        }
        if (message.getDestinataire() != null) {
            dto.setDestinataireId(message.getDestinataire().getId());
            dto.setDestinataireNom(message.getDestinataire().getNom());
            dto.setDestinatairePrenom(message.getDestinataire().getPrenom());
        }
        return dto;
    }

    @Data
    public static class EnvoyerMessageRequest {
        @NotBlank
        private String contenu;
    }
}

