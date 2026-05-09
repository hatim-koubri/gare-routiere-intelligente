package ma.emsi.gare.repository;

import ma.emsi.gare.entity.Remboursement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RemboursementRepository
        extends JpaRepository<Remboursement, Long> {

    List<Remboursement>
    findByReservationTrajetLigneCompagnieId(Long compagnieId);

    List<Remboursement>
    findByReservationVoyageurIdOrderByDateDemandeDesc(Long voyageurId);
}