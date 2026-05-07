package ma.emsi.gare.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.emsi.gare.enums.StatutRemboursement;

import java.time.LocalDateTime;

@Entity
@Table(name = "remboursements")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Remboursement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id", nullable = false)
    private Reservation reservation;

    @Column(nullable = false)
    private Double montant;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutRemboursement statut =
            StatutRemboursement.EN_ATTENTE;

    @Column(length = 1000)
    private String motif;

    @Column(name = "date_demande")
    private LocalDateTime dateDemande;

    @Column(name = "date_traitement")
    private LocalDateTime dateTraitement;

    @PrePersist
    protected void onCreate() {
        dateDemande = LocalDateTime.now();
    }
}