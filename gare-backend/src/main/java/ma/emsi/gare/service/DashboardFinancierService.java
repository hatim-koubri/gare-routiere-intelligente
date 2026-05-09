package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.response.DashboardFinancierDTO;
import ma.emsi.gare.dto.response.QuaiStationnementDetailDTO;
import ma.emsi.gare.dto.response.QuaiStationnementSummaryDTO;
import ma.emsi.gare.dto.response.StationnementLigneDTO;
import ma.emsi.gare.entity.StationnementOCR;
import ma.emsi.gare.enums.StatutReservation;
import ma.emsi.gare.repository.PaiementRepository;
import ma.emsi.gare.repository.ReservationRepository;
import ma.emsi.gare.repository.SiegeRepository;
import ma.emsi.gare.repository.StationnementOCRRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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

    public QuaiStationnementSummaryDTO getQuaiStationnementSummary() {
        List<StationnementOCR> tous = stationnementOCRRepository.findAllWithQuaiAndCompagnieOrdered();
        Map<Long, QuaiStationnementDetailDTO> quaiMap = new LinkedHashMap<>();
        double totalGeneral = 0;

        for (StationnementOCR s : tous) {
            if (s.getQuai() == null) continue;

            Long quaiId = s.getQuai().getId();
            QuaiStationnementDetailDTO detail = quaiMap.computeIfAbsent(quaiId, id ->
                    new QuaiStationnementDetailDTO(
                            quaiId,
                            s.getQuai().getNumero(),
                            s.getQuai().getTarifHoraire(),
                            s.getCompagnie() != null ? s.getCompagnie().getNom() : "-",
                            new ArrayList<>(),
                            0
                    ));

            LocalDateTime now = LocalDateTime.now();
            long dureeMinutes;
            double cout;

            if (s.getHeureSortie() != null && s.getMontantFacture() != null) {
                dureeMinutes = ChronoUnit.MINUTES.between(s.getHeureEntree(), s.getHeureSortie());
                cout = s.getMontantFacture();
            } else {
                dureeMinutes = ChronoUnit.MINUTES.between(s.getHeureEntree(), now);
                double heures = dureeMinutes / 60.0;
                cout = Math.round(heures * detail.getTarifHoraire() * 100.0) / 100.0;
            }

            detail.getStationnements().add(new StationnementLigneDTO(
                    s.getId(),
                    s.getMatricule(),
                    s.getCompagnie() != null ? s.getCompagnie().getNom() : "-",
                    s.getHeureEntree() != null ? s.getHeureEntree().toString() : null,
                    s.getHeureSortie() != null ? s.getHeureSortie().toString() : null,
                    dureeMinutes,
                    cout,
                    s.getStatut() != null ? s.getStatut().name() : "EN_COURS"
            ));

            detail.setTotalQuai(Math.round((detail.getTotalQuai() + cout) * 100.0) / 100.0);
            totalGeneral += cout;
        }

        totalGeneral = Math.round(totalGeneral * 100.0) / 100.0;
        return new QuaiStationnementSummaryDTO(new ArrayList<>(quaiMap.values()), totalGeneral);
    }

    private double calculerTauxRemplissage(long siegesOccupes, long totalSieges) {
        if (totalSieges == 0) {
            return 0.0;
        }
        return (siegesOccupes * 100.0) / totalSieges;
    }
}