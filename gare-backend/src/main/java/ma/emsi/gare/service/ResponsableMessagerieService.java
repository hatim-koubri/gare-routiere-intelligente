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
public class ResponsableMessagerieService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<Message> getInbox(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return messageRepository
                .findByExpediteurIdOrDestinataireIdOrderByDateEnvoiDesc(
                        user.getId(), user.getId()
                );
    }

    public Message getMessage(Long id, Authentication authentication) {
        Message message = messageRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Message introuvable")
                );
        User user = (User) authentication.getPrincipal();
        if (message.getDestinataire().getId().equals(user.getId()) && !message.isLu()) {
            message.setLu(true);
            messageRepository.save(message);
        }
        return message;
    }

    public Message envoyer(String contenu, Authentication authentication) {
        User expediteur = (User) authentication.getPrincipal();
        List<User> admins = userRepository.findByRole(Role.ADMIN);
        if (admins.isEmpty()) {
            throw new IllegalStateException("Aucun administrateur disponible");
        }
        User destinataire = admins.get(0);
        Message message = new Message();
        message.setExpediteur(expediteur);
        message.setDestinataire(destinataire);
        message.setContenu(contenu);
        return messageRepository.save(message);
    }
}
