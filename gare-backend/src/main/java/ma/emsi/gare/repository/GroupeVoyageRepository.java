package ma.emsi.gare.repository;

import ma.emsi.gare.entity.GroupeVoyage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface GroupeVoyageRepository
        extends JpaRepository<GroupeVoyage, Long> {

    List<GroupeVoyage> findByOrganisateurId(Long voyageurId);

    Optional<GroupeVoyage> findByReservationId(Long reservationId);
}