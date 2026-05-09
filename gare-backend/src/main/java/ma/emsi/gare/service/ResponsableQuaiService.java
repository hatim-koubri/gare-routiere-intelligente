package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.entity.Compagnie;
import ma.emsi.gare.entity.Quai;
import ma.emsi.gare.entity.ResponsableCompagnie;
import ma.emsi.gare.repository.CompagnieRepository;
import ma.emsi.gare.repository.QuaiRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ResponsableQuaiService {

    private final QuaiRepository quaiRepository;
    private final CompagnieRepository compagnieRepository;

    public List<Quai> getMesQuais(Authentication authentication) {
        Compagnie compagnie = getCompagnie(authentication);
        return quaiRepository.findByCompagnieId(compagnie.getId());
    }

    private Compagnie getCompagnie(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof ResponsableCompagnie responsable)) {
            throw new IllegalStateException("Utilisateur invalide");
        }
        Long compagnieId = responsable.getCompagnie().getId();
        return compagnieRepository.findById(compagnieId)
                .orElseThrow(() -> new IllegalStateException("Compagnie introuvable"));
    }
}
