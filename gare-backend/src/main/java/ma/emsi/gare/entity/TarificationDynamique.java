package ma.emsi.gare.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tarifications_dynamiques")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TarificationDynamique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private double reductionTrenteJours = 20.0;

    private double reductionQuinzeJours = 10.0;

    private double supplementJourMeme = 10.0;

    private double seuilHaut = 80.0;

    private double supplementHaut = 15.0;

    private double seuilBas = 30.0;

    private double reductionBas = 10.0;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compagnie_id", unique = true)
    private Compagnie compagnie;
}