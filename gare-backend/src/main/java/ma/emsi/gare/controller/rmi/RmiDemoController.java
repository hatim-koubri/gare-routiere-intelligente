package ma.emsi.gare.controller.rmi;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.response.RmiPriceResponseDTO;
import ma.emsi.gare.service.RmiPriceClientService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rmi")
@RequiredArgsConstructor
public class RmiDemoController {

    private final RmiPriceClientService rmiPriceClientService;

    @GetMapping("/estimate")
    public ResponseEntity<RmiPriceResponseDTO> estimatePrice(

            @RequestParam double distanceKm,

            @RequestParam double occupancyRate,

            @RequestParam boolean weekend,

            @RequestParam boolean vip
    ) {

        double estimatedPrice =
                rmiPriceClientService.estimatePrice(
                        distanceKm,
                        occupancyRate,
                        weekend,
                        vip
                );

        return ResponseEntity.ok(
                RmiPriceResponseDTO.builder()
                        .distanceKm(distanceKm)
                        .occupancyRate(occupancyRate)
                        .weekend(weekend)
                        .vip(vip)
                        .estimatedPrice(estimatedPrice)
                        .technology("Java RMI")
                        .build()
        );
    }
}