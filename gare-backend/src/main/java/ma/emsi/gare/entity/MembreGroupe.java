package ma.emsi.gare.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.emsi.gare.enums.CategorieTarifaire;

@Entity
@Table(name = "membres_groupe")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MembreGroupe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "groupe_id", nullable = false)
    private GroupeVoyage groupe;

    // Si le membre a un compte existant
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voyageur_id")
    private Voyageur voyageur;

    // Si ajout manuel (sans compte)
    @Column(name = "nom_manuel")
    private String nomManuel;

    @Column(name = "prenom_manuel")
    private String prenomManuel;

    // HOMME ou FEMME
    @Column(name = "sexe")
    private String sexe;

    @Column(name = "age")
    private Integer age;

    @Enumerated(EnumType.STRING)
    @Column(name = "categorie_tarifaire")
    private CategorieTarifaire categorieTarifaire
            = CategorieTarifaire.NORMAL;

    // CONJOINT, FAMILLE, AMI, COLLEGUE
    @Column(name = "lien_organisateur")
    private String lienOrganisateur;

    // Enfant sur genoux (gratuit) ou siège séparé
    @Column(name = "enfant_sur_genoux")
    private boolean enfantSurGenoux = false;

    // Siège attribué après algorithme placement
    @Column(name = "siege_attribue")
    private String siegeAttribue;

    // Prix calculé pour ce membre
    @Column(name = "prix_membre")
    private Double prixMembre;

    // Ticket généré pour ce membre
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id")
    private Ticket ticket;
}