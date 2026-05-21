package ma.emsi.gare.repository;

import ma.emsi.gare.entity.ResponsableCompagnie;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResponsableCompagnieRepository extends JpaRepository<ResponsableCompagnie, Long> {
    List<ResponsableCompagnie> findByCompagnieId(Long compagnieId);
}
