package ma.emsi.gare.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.emsi.gare.enums.CategorieTarifaire;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "voyageurs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(callSuper = true, exclude = {"reservations", "avis"})
@EqualsAndHashCode(callSuper = true, exclude = {"reservations", "avis"})
public class Voyageur extends User {

    @Enumerated(EnumType.STRING)
    @Column(name = "categorie_tarifaire")
    private CategorieTarifaire categorieTarifaire = CategorieTarifaire.NORMAL;

    @Column(name = "justificatif_url")
    private String justificatifUrl;

    @Column(name = "justificatif_valide")
    private boolean justificatifValide = false;

    @OneToMany(mappedBy = "voyageur", cascade = CascadeType.ALL)
    private List<Reservation> reservations = new ArrayList<>();

    @OneToMany(mappedBy = "voyageur", cascade = CascadeType.ALL)
    private List<Avis> avis = new ArrayList<>();
}