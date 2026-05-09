package ma.emsi.gare.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "jalons_valides")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JalonValide {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "trajet_id", nullable = false)
    private Long trajetId;

    @Column(name = "arret_id", nullable = false)
    private Long arretId;

    @Column(nullable = false)
    private String ville;

    @Column(nullable = false)
    private Integer ordre;

    @Column(name = "arrivee_le")
    private LocalDateTime arriveeLe;

    @Column(name = "depart_le")
    private LocalDateTime departLe;

    @Builder.Default
    @Column(name = "retard_arrivee_minutes")
    private Integer retardArriveeMinutes = 0;

    @Builder.Default
    @Column(name = "duree_stationnement_minutes")
    private Integer dureeStationnementMinutes = 0;
}
