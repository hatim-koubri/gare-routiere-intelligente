package ma.emsi.gare.repository;

import ma.emsi.gare.entity.PreferenceVoisinage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PreferenceVoisinageRepository extends JpaRepository<PreferenceVoisinage, Long> {

    List<PreferenceVoisinage> findByMembreId(Long membreId);
    Optional<PreferenceVoisinage> findTopByMembreId(Long membreId);
}