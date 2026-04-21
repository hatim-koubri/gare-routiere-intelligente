package ma.emsi.gare.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;  // ← AJOUTER CET IMPORT

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "compagnies")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Compagnie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String nom;

    @Column(nullable = false, unique = true)
    private String code;

    private String logo;
    private String description;
    private String telephone;
    private String email;

    @Column(name = "note_moyenne")
    private Double noteMoyenne = 0.0;

    @Column(nullable = false)
    private boolean actif = true;

    @OneToMany(mappedBy = "compagnie", cascade = CascadeType.ALL)
    @JsonIgnore  // ← AJOUTER CETTE LIGNE
    private List<Bus> bus = new ArrayList<>();

    @OneToMany(mappedBy = "compagnie", cascade = CascadeType.ALL)
    @JsonIgnore  // ← AJOUTER CETTE LIGNE
    private List<Quai> quais = new ArrayList<>();

    @OneToMany(mappedBy = "compagnie", cascade = CascadeType.ALL)
    @JsonIgnore  // ← AJOUTER CETTE LIGNE
    private List<Chauffeur> chauffeurs = new ArrayList<>();
}