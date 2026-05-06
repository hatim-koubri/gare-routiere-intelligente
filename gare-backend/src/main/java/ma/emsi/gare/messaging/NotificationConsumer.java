package ma.emsi.gare.messaging;

import lombok.RequiredArgsConstructor;
import org.springframework.jms.annotation.JmsListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationConsumer {

    @JmsListener(destination = "notification.queue")
    public void recevoirNotification(String message) {
        System.out.println("Message ActiveMQ reçu : " + message);
    }
}