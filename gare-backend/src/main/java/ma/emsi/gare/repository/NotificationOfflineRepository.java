package ma.emsi.gare.repository;

import ma.emsi.gare.entity.NotificationOffline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationOfflineRepository
        extends JpaRepository<NotificationOffline, Long> {

    // Toutes les notifs non livrées pour un user
    List<NotificationOffline> findByUserEmailAndLivreeFalseOrderByDateCreationAsc(
            String userEmail);

    // Toutes les notifs d'un user (historique)
    List<NotificationOffline> findByUserEmailOrderByDateCreationDesc(
            String userEmail);

    // Marquer toutes les notifs comme livrées
    @Modifying
    @Query("""
        UPDATE NotificationOffline n
        SET n.livree = true, n.dateLivraison = CURRENT_TIMESTAMP
        WHERE n.userEmail = :email AND n.livree = false
    """)
    int marquerToutesCommeLivrees(@Param("email") String email);

    // Compter les notifs en attente
    long countByUserEmailAndLivreeFalse(String userEmail);
}