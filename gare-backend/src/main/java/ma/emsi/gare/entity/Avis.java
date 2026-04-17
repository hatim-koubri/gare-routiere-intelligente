package ma.emsi.gare.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "avis")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Avis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voyageur_id", nullable = false)
    private Voyageur voyageur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trajet_id", nullable = false)
    private Trajet trajet;

    @Column(name = "note_ponctualite")
    private Integer notePonctualite;

    @Column(name = "note_confort")
    private Integer noteConfort;

    @Column(name = "note_chauffeur")
    private Integer noteChauffeur;

    @Column(name = "commentaire", length = 1000)
    private String commentaire;

    @Column(name = "date_avis")
    private LocalDateTime dateAvis;

    @PrePersist
    protected void onCreate() { dateAvis = LocalDateTime.now(); }
}