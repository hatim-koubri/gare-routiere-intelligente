package ma.emsi.gare.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "sieges")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Siege {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_siege", nullable = false)
    private String numeroSiege;

    @Column(name = "occupe", nullable = false)
    private boolean occupe = false;

    @Column(name = "bloque", nullable = false)
    private boolean bloque = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trajet_id", nullable = false)
    private Trajet trajet;
}