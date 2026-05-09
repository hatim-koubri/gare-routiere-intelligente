package ma.emsi.gare.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "lignes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@ToString(exclude = {"compagnie", "arrets", "trajets"})
@EqualsAndHashCode(exclude = {"compagnie", "arrets", "trajets"})
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

    @Column(name = "prix_abonnement_mensuel")
    private Double prixAbonnementMensuel;

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