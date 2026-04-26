package ma.emsi.gare.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "preferences_voisinage")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PreferenceVoisinage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "membre_id", nullable = false)
    private MembreGroupe membre;

    // Accepte-t-il le sexe opposé à côté ?
    @Column(name = "accepte_sexe_oppose", nullable = false)
    private boolean accepteSexeOppose = true;

    // Côté fenêtre ou couloir ?
    @Column(name = "preference_position")
    private String preferencePosition; // FENETRE, COULOIR, INDIFFERENT

    // Préfère être à côté de qui dans le groupe ?
    @Column(name = "prefere_cote_membre_id")
    private Long prefereCoteMembreId;
}