package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.MessageRequest;
import ma.emsi.gare.entity.Message;
import ma.emsi.gare.entity.Notification;
import ma.emsi.gare.entity.User;
import ma.emsi.gare.enums.TypeNotification;
import ma.emsi.gare.repository.MessageRepository;
import ma.emsi.gare.repository.NotificationRepository;
import ma.emsi.gare.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MessagerieService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public Message envoyer(
            MessageRequest request,
            Authentication authentication
    ) {

        User expediteur =
                (User) authentication.getPrincipal();

        User destinataire =
                userRepository.findById(
                                request.getDestinataireId()
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Destinataire introuvable"
                                ));

        Message message = new Message();

        message.setExpediteur(expediteur);

        message.setDestinataire(destinataire);

        message.setContenu(request.getContenu());

        Message saved =
                messageRepository.save(message);

        Notification notif =
                new Notification();

        notif.setDestinataire(destinataire);

        notif.setType(TypeNotification.ALERTE_GARE);

        notif.setMessage(
                "Nouveau message reçu"
        );

        notificationRepository.save(notif);

        return saved;
    }

    @Transactional(readOnly = true)
    public List<Message> getMesMessages(
            Authentication authentication
    ) {

        User user =
                (User) authentication.getPrincipal();

        return messageRepository
                .findByExpediteurIdOrDestinataireIdOrderByDateEnvoiDesc(
                        user.getId(),
                        user.getId()
                );
    }
}