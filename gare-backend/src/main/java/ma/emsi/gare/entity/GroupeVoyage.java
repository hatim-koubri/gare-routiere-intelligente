package ma.emsi.gare.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "groupes_voyage")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GroupeVoyage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Qui a créé la réservation du groupe
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organisateur_id", nullable = false)
    private Voyageur organisateur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id")
    private Reservation reservation;

    // MOI_SEUL, MOI_PLUS_ACCOMPAGNANTS, AUTRE_PERSONNE
    @Column(name = "type_groupe", nullable = false)
    private String typeGroupe;

    @Column(name = "nombre_passagers")
    private Integer nombrePassagers;

    @OneToMany(mappedBy = "groupe",
            cascade = CascadeType.ALL,
            orphanRemoval = true)
    private List<MembreGroupe> membres = new ArrayList<>();

    @Column(name = "placement_effectue")
    private Boolean placementEffectue = false;

    @Column(name = "accepte_separer")
    private Boolean accepteSeparer = false;
}