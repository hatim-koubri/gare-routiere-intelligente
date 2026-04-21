package ma.emsi.gare.repository;

import ma.emsi.gare.entity.Incident;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface IncidentRepository extends JpaRepository<Incident, Long> {
    List<Incident> findByChauffeurId(Long chauffeurId);
    List<Incident> findByTrajetId(Long trajetId);
    List<Incident> findByResoluFalse();
}