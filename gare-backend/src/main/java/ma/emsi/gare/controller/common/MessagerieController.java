package ma.emsi.gare.controller.common;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.MessageRequest;
import ma.emsi.gare.dto.response.MessageResponseDTO;
import ma.emsi.gare.entity.Message;
import ma.emsi.gare.service.MessagerieService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessagerieController {

    private final MessagerieService service;

    @PostMapping
    public ResponseEntity<MessageResponseDTO>
    envoyer(
            @Valid @RequestBody MessageRequest request,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                toDto(
                        service.envoyer(
                                request,
                                authentication
                        )
                )
        );
    }

    @GetMapping
    public ResponseEntity<List<MessageResponseDTO>>
    getMessages(Authentication authentication) {

        List<MessageResponseDTO> messages =
                service.getMesMessages(authentication)
                        .stream()
                        .map(this::toDto)
                        .toList();

        return ResponseEntity.ok(messages);
    }

    private MessageResponseDTO toDto(Message message) {

        MessageResponseDTO dto =
                new MessageResponseDTO();

        dto.setId(message.getId());

        dto.setContenu(message.getContenu());

        dto.setLu(message.isLu());

        dto.setDateEnvoi(message.getDateEnvoi());

        if (message.getExpediteur() != null) {

            dto.setExpediteurId(
                    message.getExpediteur().getId()
            );

            dto.setExpediteurNom(
                    message.getExpediteur().getNom()
            );
        }

        if (message.getDestinataire() != null) {

            dto.setDestinataireId(
                    message.getDestinataire().getId()
            );

            dto.setDestinataireNom(
                    message.getDestinataire().getNom()
            );
        }

        return dto;
    }
}