package ma.emsi.gare.service;

import com.itextpdf.text.Document;
import com.itextpdf.text.Element;
import com.itextpdf.text.FontFactory;
import com.itextpdf.text.PageSize;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.Phrase;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import com.itextpdf.text.BaseColor;
import com.itextpdf.text.Font;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HoraireExportService {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private final HoraireOfflineService horaireOfflineService;

    public byte[] exporterPDF(int jours) throws Exception {
        var horaires = horaireOfflineService.genererHoraires(jours);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4.rotate());
        PdfWriter.getInstance(document, baos);
        document.open();

        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, new BaseColor(30, 64, 175));
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, BaseColor.WHITE);
        Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 9, BaseColor.BLACK);
        Font infoFont = FontFactory.getFont(FontFactory.HELVETICA, 10, new BaseColor(100, 116, 139));

        Paragraph title = new Paragraph("Horaires - Gare Routière", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(6);
        document.add(title);

        Paragraph period = new Paragraph(
                "Période : " + horaires.getPeriodeDebut() + " → " + horaires.getPeriodeFin()
                        + "  |  " + horaires.getNombreTrajets() + " trajet(s)",
                infoFont
        );
        period.setAlignment(Element.ALIGN_CENTER);
        period.setSpacingAfter(16);
        document.add(period);

        PdfPTable table = new PdfPTable(7);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1.5f, 1.5f, 2f, 2f, 1.2f, 1.2f, 1.2f});

        BaseColor headerBg = new BaseColor(30, 64, 175);
        String[] headers = {"Départ", "Arrivée", "Compagnie", "Date Départ", "Arrivée Prev.", "Prix", "Places"};

        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
            cell.setBackgroundColor(headerBg);
            cell.setPadding(6);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(cell);
        }

        BaseColor altBg = new BaseColor(238, 242, 255);
        boolean alt = false;

        for (var t : horaires.getTrajets()) {
            BaseColor bg = alt ? altBg : BaseColor.WHITE;
            addCell(table, t.getVilleDepart(), cellFont, bg);
            addCell(table, t.getVilleArrivee(), cellFont, bg);
            addCell(table, t.getCompagnie(), cellFont, bg);
            addCell(table, t.getDateDepart(), cellFont, bg);
            addCell(table, t.getDateArriveePrevue(), cellFont, bg);
            addCell(table, t.getPrixBase() + " DH", cellFont, bg);
            addCell(table, String.valueOf(t.getNbSiegesDisponibles()), cellFont, bg);
            alt = !alt;
        }

        document.add(table);

        Paragraph footer = new Paragraph(
                "\nGénéré le " + LocalDateTime.now().format(FORMATTER),
                infoFont
        );
        footer.setAlignment(Element.ALIGN_RIGHT);
        document.add(footer);

        document.close();
        return baos.toByteArray();
    }

    private void addCell(PdfPTable table, String text, com.itextpdf.text.Font font, BaseColor bg) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(4);
        cell.setBackgroundColor(bg);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(cell);
    }

    public byte[] exporterExcel(int jours) {
        var horaires = horaireOfflineService.genererHoraires(jours);

        XSSFWorkbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Horaires");

        CellStyle headerStyle = workbook.createCellStyle();
        org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerFont.setColor(IndexedColors.WHITE.getIndex());
        headerStyle.setFont(headerFont);
        headerStyle.setFillForegroundColor(IndexedColors.INDIGO.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        headerStyle.setAlignment(HorizontalAlignment.CENTER);

        CellStyle cellStyle = workbook.createCellStyle();
        cellStyle.setAlignment(HorizontalAlignment.CENTER);

        CellStyle altCellStyle = workbook.createCellStyle();
        altCellStyle.setAlignment(HorizontalAlignment.CENTER);
        altCellStyle.setFillForegroundColor(IndexedColors.LAVENDER.getIndex());
        altCellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        String[] headers = {"Départ", "Arrivée", "Compagnie", "Date Départ", "Arrivée Prev.", "Prix (DH)", "Places"};
        Row headerRow = sheet.createRow(0);

        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        for (int i = 0; i < headers.length; i++) {
            sheet.setColumnWidth(i, 4000);
        }

        int rowIdx = 1;
        boolean alt = false;

        for (var t : horaires.getTrajets()) {
            Row row = sheet.createRow(rowIdx++);
            CellStyle style = alt ? altCellStyle : cellStyle;

            row.createCell(0).setCellValue(t.getVilleDepart());
            row.createCell(1).setCellValue(t.getVilleArrivee());
            row.createCell(2).setCellValue(t.getCompagnie());
            row.createCell(3).setCellValue(t.getDateDepart());
            row.createCell(4).setCellValue(t.getDateArriveePrevue());
            row.createCell(5).setCellValue(t.getPrixBase());
            row.createCell(6).setCellValue(t.getNbSiegesDisponibles());

            for (int j = 0; j < 7; j++) {
                row.getCell(j).setCellStyle(style);
            }

            alt = !alt;
        }

        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            workbook.write(baos);
            workbook.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Erreur export Excel", e);
        }
    }
}
