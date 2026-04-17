package ma.emsi.gare.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "responsables_compagnie")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ResponsableCompagnie extends User {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compagnie_id")
    private Compagnie compagnie;
}