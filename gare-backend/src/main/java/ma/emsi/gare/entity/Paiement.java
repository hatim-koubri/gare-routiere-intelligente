package ma.emsi.gare.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "paiements")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Paiement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "reservation_id", nullable = false)
    private Reservation reservation;

    @Column(nullable = false)
    private Double montant;

    @Column(name = "methode_paiement", nullable = false)
    private String methodePaiement; // CARTE, PAYPAL

    @Column(name = "transaction_id", unique = true)
    private String transactionId;

    @Column(name = "date_paiement")
    private LocalDateTime datePaiement;

    @Column(nullable = false)
    private boolean confirme = false;
}