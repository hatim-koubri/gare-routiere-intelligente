package ma.emsi.gare.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class QuaiStationnementSummaryDTO {
    private List<QuaiStationnementDetailDTO> quais;
    private double totalGeneral;
}
