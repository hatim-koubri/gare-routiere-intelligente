package ma.emsi.gare.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "chauffeurs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Chauffeur extends User {

    @Column(name = "numero_permis", unique = true)
    private String numeroPermis;

    @Column(name = "date_embauche")
    private LocalDate dateEmbauche;

    @Column(name = "note_moyenne")
    private Double noteMoyenne = 0.0;

    @Column(name = "en_conge")
    private boolean enConge = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compagnie_id")
    private Compagnie compagnie;

    @OneToMany(mappedBy = "chauffeur")
    private List<Trajet> trajets = new ArrayList<>();
}