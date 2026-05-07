package ma.emsi.gare.repository;

import ma.emsi.gare.entity.TarificationDynamique;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TarificationDynamiqueRepository
        extends JpaRepository<TarificationDynamique, Long> {

    Optional<TarificationDynamique>
    findByCompagnieId(Long compagnieId);
}