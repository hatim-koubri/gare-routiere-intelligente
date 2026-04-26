package ma.emsi.gare.repository;

import ma.emsi.gare.entity.Abonnement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface AbonnementRepository
        extends JpaRepository<Abonnement, Long> {

    List<Abonnement> findByVoyageurId(Long voyageurId);

    List<Abonnement> findByVoyageurIdAndActifTrue(Long voyageurId);

    // Abonnements à renouveler
    @Query("""
        SELECT a FROM Abonnement a
        WHERE a.renouvellementAuto = true
        AND a.actif = true
        AND a.dateFin <= :dateLimite
    """)
    List<Abonnement> findAbonnementsARenouveler(
            @Param("dateLimite") LocalDate dateLimite);

    boolean existsByVoyageurIdAndLigneIdAndActifTrue(
            Long voyageurId, Long ligneId);
}