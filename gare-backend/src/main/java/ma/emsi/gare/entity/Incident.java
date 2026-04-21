package ma.emsi.gare.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "incidents")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Incident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chauffeur_id")
    private Chauffeur chauffeur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trajet_id")
    private Trajet trajet;

    @Column(nullable = false)
    private String type; // PANNE, RETARD, ACCIDENT, AUTRE

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(name = "date_incident", nullable = false)
    private LocalDateTime dateIncident;

    @Column(nullable = false)
    private boolean resolu = false;

    @PrePersist
    protected void onCreate() {
        dateIncident = LocalDateTime.now();
    }
}