package ma.emsi.gare.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sieges")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Siege {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_siege", nullable = false)
    private String numeroSiege;

    @Column(name = "numero_rangee")
    private Integer numeroRangee;  // ← NOUVEAU (ex: 1, 2, 3...)

    @Column(name = "position_rangee")
    private String positionRangee; // ← NOUVEAU (ex: A, B, C, D)

    @Column(name = "occupe", nullable = false)
    private boolean occupe = false;

    @Column(name = "bloque", nullable = false)
    private boolean bloque = false;

    // ← NOUVEAU — pour l'algorithme de placement
    @Column(name = "genre_occupant")
    private String genreOccupant; // HOMME, FEMME, null si libre

    // ← NOUVEAU — enfant sur genoux
    @Column(name = "enfant_sur_genoux")
    private boolean enfantSurGenoux = false;

    // ← NOUVEAU — verrouillage temporaire pendant paiement
    @Column(name = "verrouille_temporaire")
    private boolean verrouilleTemporaire = false;

    @Column(name = "verrouille_par_reservation")
    private Long verrouilleParReservationId;

    @Column(name = "verrouille_at")
    private LocalDateTime verrouilleAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trajet_id", nullable = false)
    private Trajet trajet;
}