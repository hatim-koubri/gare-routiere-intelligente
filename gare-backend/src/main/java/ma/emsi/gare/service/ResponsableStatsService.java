package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.response.CompagnieStatsDTO;
import ma.emsi.gare.entity.Compagnie;
import ma.emsi.gare.entity.ResponsableCompagnie;
import ma.emsi.gare.repository.*;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
            Authentication authentication
    ) {

        Compagnie compagnie = getCompagnie(authentication);

        Long compagnieId = compagnie.getId();

        long totalTrajets =
                trajetRepository.countByCompagnieId(compagnieId);

        long totalReservations =
                reservationRepository.countByCompagnieId(compagnieId);

        double totalVentes =
                paiementRepository.calculerRecettesCompagnie(compagnieId);

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