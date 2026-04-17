package ma.emsi.gare.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.emsi.gare.enums.StatutStationnement;

import java.time.LocalDateTime;

@Entity
@Table(name = "stationnements_ocr")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StationnementOCR {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String matricule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compagnie_id")
    private Compagnie compagnie;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quai_id")
    private Quai quai;

    @Column(name = "heure_entree", nullable = false)
    private LocalDateTime heureEntree;

    @Column(name = "heure_sortie")
    private LocalDateTime heureSortie;

    @Column(name = "duree_minutes")
    private Integer dureeMinutes;

    @Column(name = "montant_facture")
    private Double montantFacture;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutStationnement statut = StatutStationnement.EN_COURS;

    @Column(name = "correction_manuelle")
    private boolean correctionManuelle = false;

    @Column(name = "image_entree_url")
    private String imageEntreeUrl;
}