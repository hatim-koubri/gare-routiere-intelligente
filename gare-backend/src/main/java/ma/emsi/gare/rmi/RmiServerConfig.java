package ma.emsi.gare.rmi;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.rmi.registry.LocateRegistry;
import java.rmi.registry.Registry;

@Component
public class RmiServerConfig {

    private static final int RMI_PORT = 1099;
    private static final String SERVICE_NAME =
            "PriceEstimationService";

    @PostConstruct
    public void startRmiServer() {
        try {
            Registry registry =
                    LocateRegistry.createRegistry(RMI_PORT);

            RemotePriceEstimationService service =
                    new RemotePriceEstimationServiceImpl();

            registry.rebind(SERVICE_NAME, service);

            System.out.println(
                    "RMI Server started on port "
                            + RMI_PORT
                            + " with service "
                            + SERVICE_NAME
            );

        } catch (Exception e) {
            System.err.println(
                    "RMI Server error: "
                            + e.getMessage()
            );
        }
    }
}