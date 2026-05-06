package ma.emsi.gare.messaging;

import lombok.RequiredArgsConstructor;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationProducer {

    private static final String NOTIFICATION_QUEUE = "notification.queue";

    private final JmsTemplate jmsTemplate;

    public void envoyerNotification(String message) {
        jmsTemplate.convertAndSend(NOTIFICATION_QUEUE, message);
    }
}