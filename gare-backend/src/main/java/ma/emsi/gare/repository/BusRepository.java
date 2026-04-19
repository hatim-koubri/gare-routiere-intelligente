package ma.emsi.gare.repository;

import ma.emsi.gare.entity.Bus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BusRepository extends JpaRepository<Bus, Long> {
    Optional<Bus> findByMatricule(String matricule);
    boolean existsByMatricule(String matricule);
    List<Bus> findByCompagnieId(Long compagnieId);
    List<Bus> findByCompagnieIdAndActifTrue(Long compagnieId);
    List<Bus> findByEnMaintenanceTrue();
}