package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.response.CompagnieStatsDTO;
import ma.emsi.gare.entity.Compagnie;
import ma.emsi.gare.entity.ResponsableCompagnie;
import ma.emsi.gare.repository.*;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ResponsableStatsService {

    private final TrajetRepository trajetRepository;
    private final ReservationRepository reservationRepository;
    private final PaiementRepository paiementRepository;
    private final BusRepository busRepository;
    private final CodePromoRepository codePromoRepository;
    private final CompagnieRepository compagnieRepository;

    public CompagnieStatsDTO getDashboardStats(
            Authentication authentication,
            String periode
    ) {

        Compagnie compagnie = getCompagnie(authentication);

        Long compagnieId = compagnie.getId();

        LocalDateTime debut = null;
        LocalDateTime fin = null;

        if (periode != null) {
            LocalDate today = LocalDate.now();
            switch (periode) {
                case "jour" -> {
                    debut = today.atStartOfDay();
                    fin = today.atTime(LocalTime.MAX);
                }
                case "mois" -> {
                    debut = today.withDayOfMonth(1).atStartOfDay();
                    fin = today.withDayOfMonth(today.lengthOfMonth()).atTime(LocalTime.MAX);
                }
                case "an" -> {
                    debut = today.withDayOfYear(1).atStartOfDay();
                    fin = today.withDayOfYear(today.lengthOfYear()).atTime(LocalTime.MAX);
                }
            }
        }

        long totalTrajets;
        long totalReservations;
        double totalVentes;

        if (debut != null && fin != null) {
            totalTrajets = trajetRepository.countByCompagnieIdAndDateDepartBetween(compagnieId, debut, fin);
            totalReservations = reservationRepository.countByCompagnieIdAndDateReservationBetween(compagnieId, debut, fin);
            totalVentes = paiementRepository.calculerRecettesCompagnieEntre(compagnieId, debut, fin);
        } else {
            totalTrajets = trajetRepository.countByCompagnieId(compagnieId);
            totalReservations = reservationRepository.countByCompagnieId(compagnieId);
            totalVentes = paiementRepository.calculerRecettesCompagnie(compagnieId);
        }

        long totalBusActifs =
                busRepository.countByCompagnieIdAndActifTrue(compagnieId);

        long totalCodesPromoActifs =
                codePromoRepository
                        .countByCompagnieIdAndActifTrue(compagnieId);

        double tauxRemplissageMoyen = 0.0;

        if (totalTrajets > 0) {
            tauxRemplissageMoyen =
                    (double) totalReservations / totalTrajets;
        }

        return CompagnieStatsDTO.builder()
                .totalTrajets(totalTrajets)
                .totalReservations(totalReservations)
                .totalVentes(totalVentes)
                .tauxRemplissageMoyen(
                        Math.round(tauxRemplissageMoyen * 100.0) / 100.0
                )
                .totalBusActifs(totalBusActifs)
                .totalCodesPromoActifs(totalCodesPromoActifs)
                .build();
    }

    private Compagnie getCompagnie(Authentication authentication) {

        Object principal = authentication.getPrincipal();

        if (!(principal instanceof ResponsableCompagnie responsable)) {
            throw new IllegalStateException("Utilisateur invalide");
        }

        Long compagnieId = responsable.getCompagnie().getId();

        return compagnieRepository.findById(compagnieId)
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Compagnie introuvable"
                        ));
    }
}