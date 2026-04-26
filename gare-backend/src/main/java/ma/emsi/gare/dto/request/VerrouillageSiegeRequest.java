package ma.emsi.gare.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class VerrouillageSiegeRequest {

    private Long reservationId;
    private Long trajetId;
    private List<String> numerosSieges;
}