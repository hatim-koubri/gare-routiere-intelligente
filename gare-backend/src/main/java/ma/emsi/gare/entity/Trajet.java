package ma.emsi.gare.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.emsi.gare.enums.StatutTrajet;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "trajets")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Trajet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ligne_id", nullable = false)
    private Ligne ligne;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bus_id", nullable = false)
    private Bus bus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chauffeur_id")
    private Chauffeur chauffeur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quai_id")
    private Quai quai;

    @Column(name = "date_depart", nullable = false)
    private LocalDateTime dateDepart;

    @Column(name = "date_arrivee_prevue")
    private LocalDateTime dateArriveePrevue;

    @Column(name = "date_arrivee_reelle")
    private LocalDateTime dateArriveeReelle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutTrajet statut = StatutTrajet.PLANIFIE;

    @Column(name = "retard_minutes")
    private Integer retardMinutes = 0;

    @Column(name = "nb_reservations")
    private Integer nbReservations = 0;

    @OneToMany(mappedBy = "trajet", cascade = CascadeType.ALL)
    private List<Reservation> reservations = new ArrayList<>();

    @OneToMany(mappedBy = "trajet", cascade = CascadeType.ALL)
    private List<Siege> sieges = new ArrayList<>();
}