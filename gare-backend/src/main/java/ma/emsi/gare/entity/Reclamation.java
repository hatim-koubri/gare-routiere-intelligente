package ma.emsi.gare.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.emsi.gare.enums.StatutReclamation;
import ma.emsi.gare.enums.TypeReclamation;

import java.time.LocalDateTime;

@Entity
@Table(name = "reclamations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Reclamation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeReclamation type;

    @Column(nullable = false)
    private String sujet;

    @Column(nullable = false, length = 1500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutReclamation statut =
            StatutReclamation.OUVERTE;

    @Column(length = 1500)
    private String reponseResponsable;

    @Column(nullable = false)
    private LocalDateTime dateCreation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voyageur_id")
    private Voyageur voyageur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id")
    private Reservation reservation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compagnie_id")
    private Compagnie compagnie;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
    }
}