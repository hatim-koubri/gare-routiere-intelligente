package ma.emsi.gare.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "arrets")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Arret {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String ville;

    @Column(nullable = false)
    private Integer ordre;

    @Column(name = "duree_pause_minutes")
    private Integer dureePauseMinutes = 0;

    @Column(name = "heure_prevue_offset_minutes")
    private Integer heurePrevueOffsetMinutes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ligne_id", nullable = false)
    private Ligne ligne;
}