package ma.emsi.gare.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "lignes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Ligne {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ville_depart", nullable = false)
    private String villeDepart;

    @Column(name = "ville_arrivee", nullable = false)
    private String villeArrivee;

    @Column(name = "duree_minutes")
    private Integer dureeMinutes;

    @Column(name = "prix_base", nullable = false)
    private Double prixBase;

    @Column(nullable = false)
    private boolean actif = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compagnie_id", nullable = false)
    private Compagnie compagnie;

    @OneToMany(mappedBy = "ligne", cascade = CascadeType.ALL)
    @OrderBy("ordre")
    private List<Arret> arrets = new ArrayList<>();

    @OneToMany(mappedBy = "ligne")
    private List<Trajet> trajets = new ArrayList<>();
}