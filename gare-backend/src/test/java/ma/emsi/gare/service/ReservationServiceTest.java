package ma.emsi.gare.service;

import ma.emsi.gare.dto.request.MembreGroupeRequest;
import ma.emsi.gare.dto.request.ReservationRequest;
import ma.emsi.gare.dto.response.ReservationResponseDTO;
import ma.emsi.gare.entity.*;
import ma.emsi.gare.enums.CategorieTarifaire;
import ma.emsi.gare.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

    @Mock private ReservationRepository reservationRepository;
    @Mock private GroupeVoyageRepository groupeVoyageRepository;
    @Mock private MembreGroupeRepository membreGroupeRepository;
    @Mock private PreferenceVoisinageRepository preferenceVoisinageRepository;
    @Mock private VoyageurRepository voyageurRepository;
    @Mock private TrajetRepository trajetRepository;
    @Mock private SiegeRepository siegeRepository;

    @InjectMocks
    private ReservationService reservationService;

    @Test
    void creerReservation_shouldCreateGroupReservation() {
        Voyageur voyageur = new Voyageur();
        voyageur.setId(6L);
        voyageur.setEmail("test@gmail.com");

        Ligne ligne = new Ligne();
        ligne.setPrixBase(120.0);
        ligne.setVilleDepart("Casablanca");
        ligne.setVilleArrivee("Marrakech");

        Trajet trajet = new Trajet();
        trajet.setId(2L);
        trajet.setLigne(ligne);

        Reservation reservation = new Reservation();
        reservation.setId(1L);
        reservation.setVoyageur(voyageur);
        reservation.setTrajet(trajet);

        GroupeVoyage groupe = new GroupeVoyage();
        groupe.setId(1L);
        groupe.setOrganisateur(voyageur);
        groupe.setReservation(reservation);

        MembreGroupe membre = new MembreGroupe();
        membre.setId(1L);

        MembreGroupeRequest membreRequest = new MembreGroupeRequest();
        membreRequest.setNomManuel("Koubri");
        membreRequest.setPrenomManuel("Hatim");
        membreRequest.setSexe("HOMME");
        membreRequest.setAge(22);
        membreRequest.setCategorieTarifaire(CategorieTarifaire.ETUDIANT);
        membreRequest.setLienOrganisateur("MOI");
        membreRequest.setEnfantSurGenoux(false);

        ReservationRequest request = new ReservationRequest();
        request.setTrajetId(2L);
        request.setTypeGroupe("MOI_PLUS_ACCOMPAGNANTS");
        request.setMembres(List.of(membreRequest));

        when(voyageurRepository.findById(6L)).thenReturn(Optional.of(voyageur));
        when(trajetRepository.findById(2L)).thenReturn(Optional.of(trajet));

        when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(invocation -> {
                    Reservation r = invocation.getArgument(0);
                    r.setId(1L);
                    return r;
                });

        when(groupeVoyageRepository.save(any(GroupeVoyage.class)))
                .thenAnswer(invocation -> {
                    GroupeVoyage g = invocation.getArgument(0);
                    g.setId(1L);
                    return g;
                });

        when(membreGroupeRepository.save(any(MembreGroupe.class)))
                .thenAnswer(invocation -> {
                    MembreGroupe m = invocation.getArgument(0);
                    m.setId(1L);
                    return m;
                });

        ReservationResponseDTO response =
                reservationService.creerReservation(6L, request);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals(6L, response.getVoyageurId());
        assertEquals(2L, response.getTrajetId());
        assertEquals(90.0, response.getPrixTotal());
        assertEquals("MOI_PLUS_ACCOMPAGNANTS", response.getTypeGroupe());

        verify(reservationRepository, atLeastOnce()).save(any(Reservation.class));
        verify(groupeVoyageRepository).save(any(GroupeVoyage.class));
        verify(membreGroupeRepository).save(any(MembreGroupe.class));
    }
}