package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.response.DashboardFinancierDTO;
import ma.emsi.gare.enums.StatutReservation;
import ma.emsi.gare.repository.PaiementRepository;
import ma.emsi.gare.repository.ReservationRepository;
import ma.emsi.gare.repository.SiegeRepository;
import ma.emsi.gare.repository.StationnementOCRRepository;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardFinancierService {

    private final PaiementRepository paiementRepository;
    private final StationnementOCRRepository stationnementOCRRepository;
    private final ReservationRepository reservationRepository;
    private final SiegeRepository siegeRepository;

    public DashboardFinancierDTO getDashboardFinancier() {
        double recettesTickets = paiementRepository.calculerRecettesTickets();
        double recettesStationnement = stationnementOCRRepository.calculerRecettesStationnement();
        double recettesTotales = recettesTickets + recettesStationnement;

        long reservationsConfirmees = reservationRepository.countByStatut(StatutReservation.CONFIRMEE);
        long reservationsAnnulees = reservationRepository.countByStatut(StatutReservation.ANNULEE);

        long totalSieges = siegeRepository.count();
        long siegesOccupes = siegeRepository.findAll()
                .stream()
                .filter(siege -> siege.isOccupe())
                .count();

        double tauxRemplissageGlobal = calculerTauxRemplissage(siegesOccupes, totalSieges);

        return new DashboardFinancierDTO(
                recettesTickets,
                recettesStationnement,
                recettesTotales,
                reservationsConfirmees,
                reservationsAnnulees,
                tauxRemplissageGlobal
        );
    }

    private double calculerTauxRemplissage(long siegesOccupes, long totalSieges) {
        if (totalSieges == 0) {
            return 0.0;
        }
        return (siegesOccupes * 100.0) / totalSieges;
    }
}