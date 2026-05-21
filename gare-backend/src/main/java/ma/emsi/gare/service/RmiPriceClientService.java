package ma.emsi.gare.service;

import ma.emsi.gare.rmi.RemotePriceEstimationService;
import org.springframework.stereotype.Service;

import java.rmi.registry.LocateRegistry;
import java.rmi.registry.Registry;

@Service
public class RmiPriceClientService {

    private static final String HOST = "localhost";
    private static final int PORT = 1099;
    private static final String SERVICE_NAME =
            "PriceEstimationService";

    public double estimatePrice(
            double distanceKm,
            double occupancyRate,
            boolean weekend,
            boolean vip
    ) {

        try {

            Registry registry =
                    LocateRegistry.getRegistry(HOST, PORT);

            RemotePriceEstimationService service =
                    (RemotePriceEstimationService)
                            registry.lookup(SERVICE_NAME);

            return service.estimatePrice(
                    distanceKm,
                    occupancyRate,
                    weekend,
                    vip
            );

        } catch (Exception e) {

            throw new IllegalStateException(
                    "Erreur appel RMI: "
                            + e.getMessage(),
                    e
            );
        }
    }
}