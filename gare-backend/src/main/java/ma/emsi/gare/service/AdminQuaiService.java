package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.QuaiRequest;
import ma.emsi.gare.entity.Compagnie;
import ma.emsi.gare.entity.Quai;
import ma.emsi.gare.repository.CompagnieRepository;
import ma.emsi.gare.repository.QuaiRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminQuaiService {

    private final QuaiRepository quaiRepository;
    private final CompagnieRepository compagnieRepository;

    private static final int MAX_QUAIS_PAR_COMPAGNIE = 5;

    public Quai creerQuai(QuaiRequest request) {
        if (quaiRepository.existsByNumero(request.getNumero())) {
            throw new RuntimeException("Numéro de quai déjà existant");
        }
        Quai quai = new Quai();
        quai.setNumero(request.getNumero());
        quai.setTarifHoraire(request.getTarifHoraire());
        quai.setDisponible(true);

        if (request.getCompagnieId() != null) {
            attribuerCompagnie(quai, request.getCompagnieId());
        }
        return quaiRepository.save(quai);
    }

    public Quai attribuerQuaiACompagnie(Long quaiId, Long compagnieId) {
        Quai quai = quaiRepository.findById(quaiId)
                .orElseThrow(() -> new RuntimeException("Quai non trouvé"));

        // Règle métier : max 5 quais par compagnie
        long nbQuaisActuels = quaiRepository.countByCompagnieId(compagnieId);
        if (nbQuaisActuels >= MAX_QUAIS_PAR_COMPAGNIE) {
            throw new RuntimeException(
                    "Limite atteinte : max " + MAX_QUAIS_PAR_COMPAGNIE
                            + " quais par compagnie");
        }

        attribuerCompagnie(quai, compagnieId);
        quai.setDisponible(false);
        return quaiRepository.save(quai);
    }

    public Quai libererQuai(Long quaiId) {
        Quai quai = quaiRepository.findById(quaiId)
                .orElseThrow(() -> new RuntimeException("Quai non trouvé"));
        quai.setCompagnie(null);
        quai.setDisponible(true);
        return quaiRepository.save(quai);
    }

    public List<Quai> getTousLesQuais() {
        List<Quai> quais = quaiRepository.findAll();
        quais.forEach(q -> {
            boolean shouldBeDisponible = q.getCompagnie() == null;
            if (q.isDisponible() != shouldBeDisponible) {
                q.setDisponible(shouldBeDisponible);
                quaiRepository.save(q);
            }
        });
        return quaiRepository.findAll();
    }

    public List<Quai> getQuaisDisponibles() {
        return quaiRepository.findByDisponibleTrue();
    }

    public List<Quai> getQuaisParCompagnie(Long compagnieId) {
        return quaiRepository.findByCompagnieId(compagnieId);
    }

    private void attribuerCompagnie(Quai quai, Long compagnieId) {
        Compagnie compagnie = compagnieRepository.findById(compagnieId)
                .orElseThrow(() -> new RuntimeException("Compagnie non trouvée"));
        quai.setCompagnie(compagnie);
    }
}