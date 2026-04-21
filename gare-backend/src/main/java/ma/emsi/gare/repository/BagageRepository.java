package ma.emsi.gare.repository;

import ma.emsi.gare.entity.Bagage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BagageRepository extends JpaRepository<Bagage, Long> {
    List<Bagage> findByReservationId(Long reservationId);
    Optional<Bagage> findByQrCodeBagage(String qrCode);
}