package ma.emsi.gare.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "annonces")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Annonce {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titreFr;

    @Column(name = "titre_ar")
    private String titreAr;

    @Column(name = "contenu_fr", nullable = false, length = 2000)
    private String contenuFr;

    @Column(name = "contenu_ar", length = 2000)
    private String contenuAr;

    @Column(name = "date_debut")
    private LocalDateTime dateDebut;

    @Column(name = "date_fin")
    private LocalDateTime dateFin;

    @Column(nullable = false)
    private boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compagnie_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Compagnie compagnie;
}