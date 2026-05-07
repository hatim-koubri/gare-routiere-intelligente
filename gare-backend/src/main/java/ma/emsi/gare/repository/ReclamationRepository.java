package ma.emsi.gare.repository;

import ma.emsi.gare.entity.Reclamation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReclamationRepository
        extends JpaRepository<Reclamation, Long> {

    List<Reclamation>
    findByReservationTrajetLigneCompagnieId(Long compagnieId);
}