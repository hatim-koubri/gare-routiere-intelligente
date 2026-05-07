package ma.emsi.gare.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expediteur_id", nullable = false)
    private User expediteur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destinataire_id", nullable = false)
    private User destinataire;

    @Column(nullable = false, length = 2000)
    private String contenu;

    @Column(nullable = false)
    private boolean lu = false;

    @Column(name = "date_envoi")
    private LocalDateTime dateEnvoi;

    @PrePersist
    protected void onCreate() {
        dateEnvoi = LocalDateTime.now();
    }
}