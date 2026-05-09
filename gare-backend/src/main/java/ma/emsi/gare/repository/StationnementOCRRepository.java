package ma.emsi.gare.repository;

import ma.emsi.gare.entity.StationnementOCR;
import ma.emsi.gare.enums.StatutStationnement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;

public interface StationnementOCRRepository
        extends JpaRepository<StationnementOCR, Long> {

    Optional<StationnementOCR> findByMatriculeAndStatut(
            String matricule, StatutStationnement statut);

    List<StationnementOCR> findByStatut(StatutStationnement statut);
    List<StationnementOCR> findByCompagnieId(Long compagnieId);
    List<StationnementOCR> findByCorrectionManuelleTrue();

    @Query("""
    SELECT COALESCE(SUM(s.montantFacture), 0)
    FROM StationnementOCR s
    WHERE s.montantFacture IS NOT NULL
""")
    double calculerRecettesStationnement();

    @Query("SELECT s FROM StationnementOCR s LEFT JOIN FETCH s.quai LEFT JOIN FETCH s.compagnie ORDER BY s.quai.numero ASC, s.heureEntree DESC")
    List<StationnementOCR> findAllWithQuaiAndCompagnieOrdered();
}