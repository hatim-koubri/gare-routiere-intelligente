package ma.emsi.gare.rmi;

import java.rmi.Remote;
import java.rmi.RemoteException;

public interface RemotePriceEstimationService extends Remote {

    double estimatePrice(
            double distanceKm,
            double occupancyRate,
            boolean weekend,
            boolean vip
    ) throws RemoteException;
}