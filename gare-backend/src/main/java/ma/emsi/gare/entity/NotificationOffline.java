package ma.emsi.gare.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.emsi.gare.enums.TypeNotification;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications_offline")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationOffline {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Email du destinataire (on l'identifie sans connexion)
    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeNotification type;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    // false = en attente de livraison, true = livré
    @Column(nullable = false)
    private boolean livree = false;

    @Column(name = "date_livraison")
    private LocalDateTime dateLivraison;

    // Données supplémentaires (ex: numéro de trajet, nouveau quai...)
    @Column(name = "payload", length = 1000)
    private String payload;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
    }
}