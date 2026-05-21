package ma.emsi.gare.rmi;

import java.rmi.RemoteException;
import java.rmi.server.UnicastRemoteObject;

public class RemotePriceEstimationServiceImpl
        extends UnicastRemoteObject
        implements RemotePriceEstimationService {

    private static final double PRICE_PER_KM = 0.8;

    public RemotePriceEstimationServiceImpl()
            throws RemoteException {
        super();
    }

    @Override
    public double estimatePrice(
            double distanceKm,
            double occupancyRate,
            boolean weekend,
            boolean vip
    ) throws RemoteException {

        if (distanceKm <= 0) {
            throw new RemoteException(
                    "Distance invalide"
            );
        }

        // prix base
        double price = distanceKm * PRICE_PER_KM;

        // taux remplissage
        if (occupancyRate >= 80) {
            price *= 1.30;
        }
        else if (occupancyRate >= 50) {
            price *= 1.15;
        }

        // weekend
        if (weekend) {
            price *= 1.10;
        }

        // VIP
        if (vip) {
            price *= 1.25;
        }

        return Math.round(price * 100.0) / 100.0;
    }
}