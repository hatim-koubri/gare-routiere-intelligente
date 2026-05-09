package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.response.PreferenceNonSatisfaiteDTO;
import ma.emsi.gare.entity.*;
import ma.emsi.gare.repository.*;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ResponsablePreferenceVoisinageService {

    private final TrajetRepository trajetRepository;
    private final GroupeVoyageRepository groupeVoyageRepository;
    private final MembreGroupeRepository membreRepository;
    private final PreferenceVoisinageRepository preferenceRepository;
    private final CompagnieRepository compagnieRepository;

    public List<PreferenceNonSatisfaiteDTO>
    getAllPreferencesNonSatisfaites(
            Long trajetId,
            Authentication authentication
    ) {

        Compagnie compagnie = getCompagnie(authentication);

        List<Trajet> trajets;

        if (trajetId != null) {

            Trajet trajet =
                    getTrajetResponsable(
                            trajetId,
                            authentication
                    );

            trajets = List.of(trajet);

        } else {

            trajets = trajetRepository
                    .findByLigneCompagnieId(
                            compagnie.getId()
                    );
        }

        List<PreferenceNonSatisfaiteDTO> result =
                new ArrayList<>();

        for (Trajet trajet : trajets) {

            result.addAll(
                    getNonSatisfaitesForTrajet(trajet)
            );
        }

        return result;
    }

    public List<PreferenceNonSatisfaiteDTO>
    getPreferencesNonSatisfaites(
            Long trajetId,
            Authentication authentication
    ) {

        Trajet trajet =
                getTrajetResponsable(
                        trajetId,
                        authentication
                );

        return getNonSatisfaitesForTrajet(trajet);
    }

    private List<PreferenceNonSatisfaiteDTO>
    getNonSatisfaitesForTrajet(Trajet trajet) {

        List<PreferenceNonSatisfaiteDTO> result =
                new ArrayList<>();

        for (Reservation reservation : trajet.getReservations()) {

            GroupeVoyage groupe =
                    groupeVoyageRepository
                            .findByReservationId(
                                    reservation.getId()
                            )
                            .orElse(null);

            if (groupe == null) {
                continue;
            }

            List<MembreGroupe> membres =
                    membreRepository.findByGroupeId(
                            groupe.getId()
                    );

            for (MembreGroupe membre : membres) {

                List<PreferenceVoisinage> preferences =
                        preferenceRepository
                                .findByMembreId(
                                        membre.getId()
                                );

                for (PreferenceVoisinage pref : preferences) {

                    if (pref.isAccepteSexeOppose()) {
                        continue;
                    }

                    MembreGroupe voisin =
                            trouverVoisinDifferentGenre(
                                    membre,
                                    membres
                            );

                    if (voisin != null) {

                        PreferenceNonSatisfaiteDTO dto =
                                new PreferenceNonSatisfaiteDTO();

                        dto.setMembreId(membre.getId());

                        dto.setNom(
                                membre.getNomManuel()
                        );

                        dto.setPrenom(
                                membre.getPrenomManuel()
                        );

                        dto.setSiege(
                                membre.getSiegeAttribue()
                        );

                        dto.setGenre(
                                membre.getSexe()
                        );

                        dto.setVoisinSiege(
                                voisin.getSiegeAttribue()
                        );

                        dto.setVoisinGenre(
                                voisin.getSexe()
                        );

                        dto.setProbleme(
                                "Préférence voisinage non respectée"
                        );

                        dto.setTrajetId(trajet.getId());

                        result.add(dto);
                    }
                }
            }
        }

        return result;
    }

    private MembreGroupe trouverVoisinDifferentGenre(
            MembreGroupe membre,
            List<MembreGroupe> membres
    ) {

        if (membre.getSiegeAttribue() == null) {
            return null;
        }

        String siege = membre.getSiegeAttribue();

        if (siege.length() < 2) {
            return null;
        }

        try {

            int rangee =
                    Integer.parseInt(
                            siege.substring(
                                    0,
                                    siege.length() - 1
                            )
                    );

            char position =
                    siege.charAt(siege.length() - 1);

            char voisinPosition =
                    position == 'A' ? 'B' : 'A';

            String voisinSiege =
                    rangee + String.valueOf(voisinPosition);

            return membres.stream()
                    .filter(m ->
                            voisinSiege.equals(
                                    m.getSiegeAttribue()
                            )
                    )
                    .filter(m ->
                            !m.getSexe()
                                    .equalsIgnoreCase(
                                            membre.getSexe()
                                    )
                    )
                    .findFirst()
                    .orElse(null);

        } catch (Exception e) {
            return null;
        }
    }

    private Trajet getTrajetResponsable(
            Long trajetId,
            Authentication authentication
    ) {

        Compagnie compagnie =
                getCompagnie(authentication);

        Trajet trajet =
                trajetRepository.findById(trajetId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Trajet introuvable"
                                ));

        Long compagnieId =
                trajet.getLigne()
                        .getCompagnie()
                        .getId();

        if (!compagnieId.equals(compagnie.getId())) {

            throw new IllegalArgumentException(
                    "Trajet inaccessible"
            );
        }

        return trajet;
    }

    private Compagnie getCompagnie(Authentication authentication) {

        Object principal = authentication.getPrincipal();

        if (!(principal instanceof ResponsableCompagnie responsable)) {
            throw new IllegalStateException(
                    "Utilisateur invalide"
            );
        }

        Long compagnieId =
                responsable.getCompagnie().getId();

        return compagnieRepository.findById(compagnieId)
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Compagnie introuvable"
                        ));
    }
}