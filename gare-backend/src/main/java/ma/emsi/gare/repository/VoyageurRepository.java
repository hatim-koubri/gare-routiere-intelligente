package ma.emsi.gare.repository;

import ma.emsi.gare.entity.Voyageur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface VoyageurRepository extends JpaRepository<Voyageur, Long> {

    Optional<Voyageur> findByEmail(String email);

    @Query("SELECT v FROM Voyageur v WHERE v.justificatifUrl IS NOT NULL")
    List<Voyageur> findAllWithJustificatif();

    @Query("SELECT v FROM Voyageur v WHERE v.justificatifUrl IS NOT NULL AND v.justificatifValide = false")
    List<Voyageur> findWithJustificatifEnAttente();

    @Query("SELECT v FROM Voyageur v WHERE v.justificatifUrl IS NOT NULL AND v.justificatifValide = true")
    List<Voyageur> findWithJustificatifValide();

}