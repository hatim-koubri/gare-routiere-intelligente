package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.BusRequest;
import ma.emsi.gare.entity.Bus;
import ma.emsi.gare.entity.Compagnie;
import ma.emsi.gare.entity.ResponsableCompagnie;
import ma.emsi.gare.repository.BusRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import ma.emsi.gare.repository.CompagnieRepository;

import org.springframework.transaction.annotation.Transactional;

import java.util.List;


@Service
@RequiredArgsConstructor
@Transactional
public class ResponsableBusService {

    private final BusRepository busRepository;
    private final CompagnieRepository compagnieRepository;

    public Bus creerBus(BusRequest request, Authentication authentication) {
        Compagnie compagnie = getCompagnieResponsable(authentication);

        if (busRepository.existsByMatricule(request.getMatricule())) {
            throw new IllegalArgumentException(
                    "Matricule déjà existant : " + request.getMatricule()
            );
        }

        Bus bus = new Bus();
        bus.setMatricule(request.getMatricule());
        bus.setMarque(request.getMarque());
        bus.setModele(request.getModele());
        bus.setNbSieges(request.getNbSieges());
        bus.setClimatise(request.isClimatise());
        bus.setWifi(request.isWifi());
        bus.setDateMaintenance(request.getDateMaintenance());
        bus.setCompagnie(compagnie);
        bus.setActif(true);

        Bus savedBus = busRepository.save(bus);

        savedBus.setCompagnie(compagnie);

        return savedBus;
    }

    public Bus modifierBus(Long id, BusRequest request, Authentication authentication) {
        Bus bus = getBusResponsable(id, authentication);

        bus.setMarque(request.getMarque());
        bus.setModele(request.getModele());
        bus.setNbSieges(request.getNbSieges());
        bus.setClimatise(request.isClimatise());
        bus.setWifi(request.isWifi());
        bus.setDateMaintenance(request.getDateMaintenance());

        return busRepository.save(bus);
    }

    public Bus changerMaintenance(Long id, boolean enMaintenance, Authentication authentication) {
        Bus bus = getBusResponsable(id, authentication);
        bus.setEnMaintenance(enMaintenance);
        return busRepository.save(bus);
    }

    public Bus desactiverBus(Long id, Authentication authentication) {
        Bus bus = getBusResponsable(id, authentication);
        bus.setActif(false);
        return busRepository.save(bus);
    }

    public Bus activerBus(Long id, Authentication authentication) {
        Bus bus = getBusResponsable(id, authentication);
        bus.setActif(true);
        return busRepository.save(bus);
    }

    public void supprimerBus(Long id, Authentication authentication) {
        Bus bus = getBusResponsable(id, authentication);
        busRepository.delete(bus);
    }

    @Transactional(readOnly = true)
    public List<Bus> getMesBus(Authentication authentication) {
        Compagnie compagnie = getCompagnieResponsable(authentication);
        return busRepository.findByCompagnieId(compagnie.getId());
    }

    @Transactional(readOnly = true)
    public Bus getBusById(Long id, Authentication authentication) {
        return getBusResponsable(id, authentication);
    }

    private Bus getBusResponsable(Long busId, Authentication authentication) {
        Compagnie compagnie = getCompagnieResponsable(authentication);

        return busRepository.findById(busId)
                .filter(bus -> bus.getCompagnie().getId().equals(compagnie.getId()))
                .orElseThrow(() -> new IllegalArgumentException("Bus non trouvé pour votre compagnie"));
    }

    private Compagnie getCompagnieResponsable(Authentication authentication) {
        Object principal = authentication.getPrincipal();

        if (!(principal instanceof ResponsableCompagnie responsable)) {
            throw new IllegalStateException("Utilisateur connecté invalide");
        }

        if (responsable.getCompagnie() == null || responsable.getCompagnie().getId() == null) {
            throw new IllegalStateException("Responsable non associé à une compagnie");
        }

        Long compagnieId = responsable.getCompagnie().getId();

        return compagnieRepository.findById(compagnieId)
                .orElseThrow(() -> new IllegalStateException("Compagnie du responsable introuvable"));
    }
}