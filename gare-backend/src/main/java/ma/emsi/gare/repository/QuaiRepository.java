package ma.emsi.gare.repository;

import ma.emsi.gare.entity.Quai;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface QuaiRepository extends JpaRepository<Quai, Long> {
    List<Quai> findByCompagnieId(Long compagnieId);
    List<Quai> findByDisponibleTrue();
    boolean existsByNumero(Integer numero);

    // Compter les quais d'une compagnie
    long countByCompagnieId(Long compagnieId);

    @Query("SELECT q FROM Quai q WHERE q.compagnie IS NULL AND q.disponible = true")
    List<Quai> findQuaisNonAttribues();
}