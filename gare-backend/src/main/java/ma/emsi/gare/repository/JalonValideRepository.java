package ma.emsi.gare.repository;

import ma.emsi.gare.entity.JalonValide;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface JalonValideRepository extends JpaRepository<JalonValide, Long> {
    List<JalonValide> findByTrajetIdOrderByOrdreAsc(Long trajetId);
    Optional<JalonValide> findByTrajetIdAndArretId(Long trajetId, Long arretId);
    boolean existsByTrajetIdAndArretId(Long trajetId, Long arretId);

    @Query("SELECT j.arretId FROM JalonValide j WHERE j.trajetId = :trajetId AND j.arriveeLe IS NOT NULL")
    List<Long> findArrivedArretIdsByTrajetId(Long trajetId);

    @Query("SELECT j.arretId FROM JalonValide j WHERE j.trajetId = :trajetId AND j.departLe IS NOT NULL")
    List<Long> findDepartedArretIdsByTrajetId(Long trajetId);
}
