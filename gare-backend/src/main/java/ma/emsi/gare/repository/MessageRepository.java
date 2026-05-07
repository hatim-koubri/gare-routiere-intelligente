package ma.emsi.gare.repository;

import ma.emsi.gare.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository
        extends JpaRepository<Message, Long> {

    List<Message>
    findByExpediteurIdOrDestinataireIdOrderByDateEnvoiDesc(
            Long expediteurId,
            Long destinataireId
    );
}