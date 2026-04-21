package ma.emsi.gare.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "bus")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Bus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String matricule;

    @Column(nullable = false)
    private String marque;

    private String modele;

    @Column(name = "nb_sieges", nullable = false)
    private Integer nbSieges;

    @Column(name = "climatise")
    private boolean climatise = false;

    @Column(name = "wifi")
    private boolean wifi = false;

    @Column(name = "date_maintenance")
    private LocalDate dateMaintenance;

    @Column(name = "en_maintenance")
    private boolean enMaintenance = false;

    @Column(nullable = false)
    private boolean actif = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compagnie_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Compagnie compagnie;
}