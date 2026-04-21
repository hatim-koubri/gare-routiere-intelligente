package ma.emsi.gare.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "codes_promo")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class CodePromo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(name = "pourcentage_reduction", nullable = false)
    private Double pourcentageReduction;

    @Column(name = "date_expiration", nullable = false)
    private LocalDateTime dateExpiration;

    @Column(name = "nb_utilisations_max")
    private Integer nbUtilisationsMax;

    @Column(name = "nb_utilisations_actuel")
    private Integer nbUtilisationsActuel = 0;

    @Column(nullable = false)
    private boolean actif = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compagnie_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Compagnie compagnie;
}