package ma.emsi.gare.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "quais")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Quai {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Integer numero;

    @Column(name = "tarif_horaire", nullable = false)
    private Double tarifHoraire;

    @Column(nullable = false)
    private boolean disponible = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compagnie_id")
    private Compagnie compagnie;
}