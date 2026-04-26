package ma.emsi.gare.repository;

import ma.emsi.gare.entity.MembreGroupe;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MembreGroupeRepository extends JpaRepository<MembreGroupe, Long> {

    List<MembreGroupe> findByGroupeId(Long groupeId);
}