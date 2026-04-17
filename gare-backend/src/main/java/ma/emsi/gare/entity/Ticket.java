package ma.emsi.gare.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.emsi.gare.enums.CategorieTarifaire;
import ma.emsi.gare.enums.StatutTicket;

@Entity
@Table(name = "tickets")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "qr_code", unique = true, nullable = false)
    private String qrCode;

    @Column(name = "nom_passager", nullable = false)
    private String nomPassager;

    @Column(name = "prenom_passager", nullable = false)
    private String prenomPassager;

    @Enumerated(EnumType.STRING)
    @Column(name = "categorie_tarifaire")
    private CategorieTarifaire categorieTarifaire = CategorieTarifaire.NORMAL;

    @Column(name = "numero_siege")
    private String numeroSiege;

    @Column(nullable = false)
    private Double prix;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutTicket statut = StatutTicket.ACTIF;

    @Column(name = "enfant_sur_genoux")
    private boolean enfantSurGenoux = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id", nullable = false)
    private Reservation reservation;
}