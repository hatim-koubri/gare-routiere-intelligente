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

    public BufferedImage preprocessImage(
            MultipartFile file) throws IOException {

        InputStream is = file.getInputStream();

        BufferedImage original = ImageIO.read(is);

        if (original == null) {
            throw new IOException("Image illisible");
        }

        log.info(
                "Image originale: {}x{}",
                original.getWidth(),
                original.getHeight());

        BufferedImage plaque = extraireZonePlaque(original);

        BufferedImage gray = toGrayscale(plaque);

        BufferedImage contrast = improveContrast(gray);

        BufferedImage binary = binarize(contrast);

        BufferedImage scaled = scaleImage(binary, 4.0);

        log.info(
                "Image finale OCR: {}x{}",
                scaled.getWidth(),
                scaled.getHeight());

        return scaled;
    }

    private BufferedImage extraireZonePlaque(
            BufferedImage image) {

        int width = image.getWidth();
        int height = image.getHeight();

        int startX = (int) (width * 0.20);

        int startY = (int) (height * 0.72);

        int cropWidth = (int) (width * 0.28);

        int cropHeight = (int) (height * 0.18);

        if (startX + cropWidth > width) {
            cropWidth = width - startX;
        }

        if (startY + cropHeight > height) {
            cropHeight = height - startY;
        }

        log.info(
                "Crop plaque x={} y={} w={} h={}",
                startX,
                startY,
                cropWidth,
                cropHeight);

        return image.getSubimage(
                startX,
                startY,
                cropWidth,
                cropHeight);
    }

    private BufferedImage toGrayscale(
            BufferedImage image) {

        BufferedImage gray = new BufferedImage(
                image.getWidth(),
                image.getHeight(),
                BufferedImage.TYPE_BYTE_GRAY);

        Graphics2D g = gray.createGraphics();

        g.drawImage(image, 0, 0, null);

        g.dispose();

        return gray;
    }

    private BufferedImage improveContrast(
            BufferedImage image) {

        BufferedImage result = new BufferedImage(
                image.getWidth(),
                image.getHeight(),
                BufferedImage.TYPE_BYTE_GRAY);

        for (int y = 0; y < image.getHeight(); y++) {

            for (int x = 0; x < image.getWidth(); x++) {

                int pixel = new Color(
                        image.getRGB(x, y)).getRed();

                int newPixel = (int) Math.min(
                        255,
                        Math.max(
                                0,
                                (pixel - 128) * 2.5 + 128));

                result.setRGB(
                        x,
                        y,
                        new Color(
                                newPixel,
                                newPixel,
                                newPixel).getRGB());
            }
        }

        return result;
    }

    private BufferedImage binarize(
            BufferedImage image) {

        BufferedImage result = new BufferedImage(
                image.getWidth(),
                image.getHeight(),
                BufferedImage.TYPE_BYTE_BINARY);

        int threshold = 140;

        for (int y = 0; y < image.getHeight(); y++) {

            for (int x = 0; x < image.getWidth(); x++) {

                int pixel = new Color(
                        image.getRGB(x, y)).getRed();

                int value = pixel > threshold
                        ? 255
                        : 0;

                result.setRGB(
                        x,
                        y,
                        new Color(
                                value,
                                value,
                                value).getRGB());
            }
        }

        return result;
    }

    private BufferedImage scaleImage(
            BufferedImage image,
            double scale) {

        int newWidth = (int) (image.getWidth() * scale);

        int newHeight = (int) (image.getHeight() * scale);

        BufferedImage scaled = new BufferedImage(
                newWidth,
                newHeight,
                BufferedImage.TYPE_BYTE_BINARY);

        Graphics2D g = scaled.createGraphics();

        g.setRenderingHint(
                RenderingHints.KEY_INTERPOLATION,
                RenderingHints.VALUE_INTERPOLATION_BICUBIC);

        g.drawImage(
                image,
                0,
                0,
                newWidth,
                newHeight,
                null);

        g.dispose();

        return scaled;
    }
}