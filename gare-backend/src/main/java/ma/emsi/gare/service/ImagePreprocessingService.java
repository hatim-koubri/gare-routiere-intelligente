package ma.emsi.gare.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;

@Slf4j
@Service
public class ImagePreprocessingService {

    public BufferedImage preprocessImage(MultipartFile file) throws IOException {
        InputStream is = file.getInputStream();
        BufferedImage original = ImageIO.read(is);
        if (original == null) throw new IOException("Image illisible");

        log.info("Image originale: {}x{}", original.getWidth(), original.getHeight());

        // ✅ Crop spécifique pour plaque en bas de l'image
        BufferedImage plaqueZone = extraireZonePlaque(original);

        // Conversion gris
        BufferedImage gray = toGrayscale(plaqueZone);

        // Amélioration contraste
        BufferedImage contrast = improveContrast(gray);

        // Binarisation
        BufferedImage binary = binarize(contrast);

        // Redimensionnement (x2 pour meilleure reconnaissance)
        BufferedImage scaled = scaleImage(binary, 2.0);

        log.info("Image prétraitée: {}x{}", scaled.getWidth(), scaled.getHeight());
        return scaled;
    }

    // ✅ Méthode spécifique pour extraire la zone de la plaque
    private BufferedImage extraireZonePlaque(BufferedImage image) {
        int height = image.getHeight();
        int width = image.getWidth();

        // La plaque est toujours dans les 25% inférieurs de l'image
        int startY = (int) (height * 0.70);
        int cropHeight = (int) (height * 0.25);
        int startX = (int) (width * 0.10);
        int cropWidth = (int) (width * 0.80);

        // Sécurité pour ne pas dépasser
        cropHeight = Math.min(cropHeight, height - startY);
        cropWidth = Math.min(cropWidth, width - startX);

        log.info("Zone plaque: x={}, y={}, w={}, h={}", startX, startY, cropWidth, cropHeight);
        return image.getSubimage(startX, startY, cropWidth, cropHeight);
    }

    private BufferedImage toGrayscale(BufferedImage image) {
        BufferedImage gray = new BufferedImage(
                image.getWidth(), image.getHeight(), BufferedImage.TYPE_BYTE_GRAY);
        Graphics2D g = gray.createGraphics();
        g.drawImage(image, 0, 0, null);
        g.dispose();
        return gray;
    }

    private BufferedImage improveContrast(BufferedImage image) {
        BufferedImage result = new BufferedImage(
                image.getWidth(), image.getHeight(), BufferedImage.TYPE_BYTE_GRAY);

        for (int y = 0; y < image.getHeight(); y++) {
            for (int x = 0; x < image.getWidth(); x++) {
                int pixel = new Color(image.getRGB(x, y)).getRed();
                int newPixel = (int) Math.min(255, Math.max(0, (pixel - 128) * 1.5 + 128));
                result.setRGB(x, y, new Color(newPixel, newPixel, newPixel).getRGB());
            }
        }
        return result;
    }

    private BufferedImage binarize(BufferedImage image) {
        BufferedImage result = new BufferedImage(
                image.getWidth(), image.getHeight(), BufferedImage.TYPE_BYTE_GRAY);

        int threshold = 120; // Seuil fixe pour contraste élevé

        for (int y = 0; y < image.getHeight(); y++) {
            for (int x = 0; x < image.getWidth(); x++) {
                int pixel = new Color(image.getRGB(x, y)).getRed();
                int newPixel = pixel > threshold ? 255 : 0;
                result.setRGB(x, y, new Color(newPixel, newPixel, newPixel).getRGB());
            }
        }
        return result;
    }

    private BufferedImage scaleImage(BufferedImage image, double scale) {
        int newWidth = (int) (image.getWidth() * scale);
        int newHeight = (int) (image.getHeight() * scale);

        BufferedImage scaled = new BufferedImage(newWidth, newHeight, BufferedImage.TYPE_BYTE_GRAY);
        Graphics2D g = scaled.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g.drawImage(image, 0, 0, newWidth, newHeight, null);
        g.dispose();
        return scaled;
    }
}