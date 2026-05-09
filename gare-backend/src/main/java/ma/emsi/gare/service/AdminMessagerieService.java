package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.response.MessageResponseDTO;
import ma.emsi.gare.entity.Message;
import ma.emsi.gare.entity.User;
import ma.emsi.gare.enums.Role;
import ma.emsi.gare.repository.MessageRepository;
import ma.emsi.gare.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminMessagerieService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<Message> getInbox(Authentication authentication) {
        User admin = (User) authentication.getPrincipal();
        return messageRepository
                .findByExpediteurIdOrDestinataireIdOrderByDateEnvoiDesc(
                        admin.getId(), admin.getId()
                );
    }

    public Message getMessage(Long id, Authentication authentication) {
        Message message = messageRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Message introuvable"));
        User admin = (User) authentication.getPrincipal();
        if (message.getDestinataire().getId().equals(admin.getId()) && !message.isLu()) {
            message.setLu(true);
            messageRepository.save(message);
        }
        return message;
    }

    public Message envoyer(String contenu, Long destinataireId, Authentication authentication) {
        User expediteur = (User) authentication.getPrincipal();
        User destinataire = userRepository.findById(destinataireId)
                .orElseThrow(() -> new IllegalArgumentException("Destinataire introuvable"));
        Message message = new Message();
        message.setExpediteur(expediteur);
        message.setDestinataire(destinataire);
        message.setContenu(contenu);
        return messageRepository.save(message);
    }

    @Transactional(readOnly = true)
    public List<User> getResponsables() {
        return userRepository.findByRole(Role.RESPONSABLE_COMPAGNIE);
    }

    public MessageResponseDTO toDto(Message message) {
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
}
