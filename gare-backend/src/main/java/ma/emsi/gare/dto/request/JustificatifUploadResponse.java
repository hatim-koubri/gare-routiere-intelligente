package ma.emsi.gare.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class JustificatifUploadResponse {
    private String url;
    private String message;
}
