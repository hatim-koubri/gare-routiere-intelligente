package ma.emsi.gare.repository;

import ma.emsi.gare.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    List<Notification>
    findByDestinataireIdOrderByDateEnvoiDesc(
            Long destinataireId
    );
}