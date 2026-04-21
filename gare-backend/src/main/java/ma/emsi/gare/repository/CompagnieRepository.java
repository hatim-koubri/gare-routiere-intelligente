package ma.emsi.gare.repository;

import ma.emsi.gare.entity.Compagnie;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CompagnieRepository extends JpaRepository<Compagnie, Long> {
    Optional<Compagnie> findByCode(String code);
    boolean existsByCode(String code);
    boolean existsByNom(String nom);
    List<Compagnie> findByActifTrue();
}