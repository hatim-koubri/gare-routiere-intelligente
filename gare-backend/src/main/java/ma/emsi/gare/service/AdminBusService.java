package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.entity.Bus;
import ma.emsi.gare.entity.Compagnie;
import ma.emsi.gare.dto.request.BusRequest;
import ma.emsi.gare.repository.BusRepository;
import ma.emsi.gare.repository.CompagnieRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminBusService {

    private final BusRepository busRepository;
    private final CompagnieRepository compagnieRepository;

    public Bus creerBus(BusRequest request) {
        if (busRepository.existsByMatricule(request.getMatricule())) {
            throw new RuntimeException("Matricule déjà existant : "
                    + request.getMatricule());
        }
        Compagnie compagnie = compagnieRepository.findById(request.getCompagnieId())
                .orElseThrow(() -> new RuntimeException("Compagnie non trouvée"));

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
        return busRepository.save(bus);
    }

    public Bus modifierBus(Long id, BusRequest request) {
        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bus non trouvé"));

        bus.setMarque(request.getMarque());
        bus.setModele(request.getModele());
        bus.setNbSieges(request.getNbSieges());
        bus.setClimatise(request.isClimatise());
        bus.setWifi(request.isWifi());
        bus.setDateMaintenance(request.getDateMaintenance());
        return busRepository.save(bus);
    }

    public Bus desactiverBus(Long id) {
        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bus non trouvé"));
        bus.setActif(false);
        return busRepository.save(bus);
    }

    public void supprimerBus(Long id) {
        if (!busRepository.existsById(id)) {
            throw new RuntimeException("Bus non trouvé");
        }
        busRepository.deleteById(id);
    }

    public List<Bus> getBusParCompagnie(Long compagnieId) {
        return busRepository.findByCompagnieId(compagnieId);
    }

    public List<Bus> getTousLesBus() {
        return busRepository.findAll();
    }

    public Bus getBusById(Long id) {
        return busRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bus non trouvé"));
    }
}