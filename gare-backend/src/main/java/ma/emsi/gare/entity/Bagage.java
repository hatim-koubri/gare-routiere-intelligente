package ma.emsi.gare.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "bagages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Bagage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "qr_code_bagage", unique = true)
    private String qrCodeBagage;

    @Column(name = "poids_kg")
    private Double poidsKg;

    @Column(name = "dimension_cm")
    private String dimensionCm;

    @Column(name = "surplus_prix")
    private Double surplusPrix = 0.0;

    @Column(name = "scanné_arrivee")
    private boolean scannéArrivee = false;

    @Column(name = "perdu")
    private boolean perdu = false;

    @Column(name = "endommage")
    private boolean endommage = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id", nullable = false)
    private Reservation reservation;
}