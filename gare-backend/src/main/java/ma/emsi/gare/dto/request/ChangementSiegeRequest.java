package ma.emsi.gare.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class ChangementSiegeRequest {
    private List<String> nouveauxSieges;
}