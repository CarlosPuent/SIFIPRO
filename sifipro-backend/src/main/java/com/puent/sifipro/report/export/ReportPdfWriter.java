package com.puent.sifipro.report.export;

import java.awt.Color;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.ColumnText;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfWriter;
import com.puent.sifipro.report.dto.ReportSummaryResponse;
import com.puent.sifipro.report.dto.ReportTimeSeriesPoint;
import com.puent.sifipro.report.dto.StockAlertEntry;
import com.puent.sifipro.report.dto.TierDistributionEntry;
import com.puent.sifipro.report.dto.TopCustomerReportEntry;
import com.puent.sifipro.report.dto.TopRewardReportEntry;

/**
 * Renders the tenant report as a formal, printable PDF (Avance final · reportes).
 *
 * Pure rendering: it receives figures already computed (and tenant-isolated) by
 * ReportService, so the PDF always matches the Reports screen and the CSV exports.
 */
public final class ReportPdfWriter {

    /** Everything the PDF shows, gathered by the controller from ReportService. */
    public record ReportPdfData(
            String tenantName,
            String tenantCode,
            String generatedBy,
            LocalDateTime generatedAt,
            ReportSummaryResponse summary,
            List<ReportTimeSeriesPoint> monthly,
            List<TopCustomerReportEntry> topCustomers,
            List<TopRewardReportEntry> topRewards,
            List<TierDistributionEntry> tiers,
            List<StockAlertEntry> stockAlerts) {
    }

    private static final Color INDIGO = new Color(79, 70, 229);
    private static final Color INK = new Color(15, 23, 42);
    private static final Color MUTED = new Color(100, 116, 139);
    private static final Color LINE = new Color(226, 232, 240);
    private static final Color SOFT = new Color(248, 250, 252);
    private static final Color AMBER = new Color(180, 83, 9);

    private static final Font TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, Color.WHITE);
    private static final Font BRAND = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, new Color(199, 210, 254));
    private static final Font SECTION = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, INK);
    private static final Font LABEL = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7.5f, MUTED);
    private static final Font VALUE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 15, INK);
    private static final Font BODY = FontFactory.getFont(FontFactory.HELVETICA, 9, INK);
    private static final Font BODY_MUTED = FontFactory.getFont(FontFactory.HELVETICA, 8, MUTED);
    private static final Font HEAD = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, Color.WHITE);
    private static final Font WARN = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, AMBER);

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter MONTH = DateTimeFormatter.ofPattern("MMM yyyy", Locale.forLanguageTag("es"));

    private ReportPdfWriter() {
    }

    public static void write(ReportPdfData data, OutputStream out) {
        Document document = new Document(PageSize.A4, 36, 36, 36, 48);
        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new Footer(data));
            document.addTitle("Reporte de fidelización · " + data.tenantName());
            document.addAuthor("SIFIPRO");
            document.open();

            document.add(header(data));
            document.add(metadata(data));
            document.add(sectionTitle("Indicadores del periodo"));
            document.add(kpis(data.summary()));
            document.add(sectionTitle("Evolución mensual"));
            document.add(monthly(data.monthly()));
            document.add(sectionTitle("Clientes con más puntos ganados"));
            document.add(topCustomers(data.topCustomers()));
            document.add(sectionTitle("Recompensas más canjeadas"));
            document.add(topRewards(data.topRewards()));
            document.add(sectionTitle("Distribución de clientes por nivel"));
            document.add(tiers(data.tiers()));
            document.add(sectionTitle("Alertas de inventario"));
            document.add(stockAlerts(data.stockAlerts()));
        } catch (DocumentException ex) {
            throw new IllegalStateException("Could not render the PDF report.", ex);
        } finally {
            document.close();
        }
    }

    // ── Blocks ──────────────────────────────────────────────────────────────

    private static PdfPTable header(ReportPdfData data) {
        PdfPTable table = new PdfPTable(1);
        table.setWidthPercentage(100);
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(INDIGO);
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(16);
        cell.addElement(new Paragraph("SIFIPRO · PLATAFORMA DE FIDELIZACIÓN", BRAND));
        Paragraph title = new Paragraph("Reporte de fidelización", TITLE);
        title.setSpacingBefore(4);
        cell.addElement(title);
        cell.addElement(new Paragraph(data.tenantName(), FontFactory.getFont(FontFactory.HELVETICA, 11, new Color(224, 231, 255))));
        table.addCell(cell);
        return table;
    }

    private static PdfPTable metadata(ReportPdfData data) throws DocumentException {
        ReportSummaryResponse s = data.summary();
        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setSpacingBefore(10);
        table.setWidths(new float[] {1, 1, 1, 1});
        table.addCell(meta("COMERCIO", data.tenantName() + " (" + data.tenantCode() + ")"));
        table.addCell(meta("PROGRAMA", s.programName()));
        table.addCell(meta("PERIODO", period(s.from(), s.to())));
        table.addCell(meta("GENERADO", DATE_TIME.format(data.generatedAt()) + "\n" + data.generatedBy()));
        return table;
    }

    private static PdfPTable kpis(ReportSummaryResponse s) {
        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.addCell(kpi("COMPRAS", integer(s.purchases())));
        table.addCell(kpi("MONTO VENDIDO", "$" + money(s.totalAmount())));
        table.addCell(kpi("PUNTOS EMITIDOS", points(s.pointsIssued())));
        table.addCell(kpi("PUNTOS CANJEADOS", points(s.pointsRedeemed())));
        table.addCell(kpi("CANJES", integer(s.redemptions())));
        table.addCell(kpi("CLIENTES QUE COMPRARON", integer(s.purchasingCustomers())));
        table.addCell(kpi("CLIENTES NUEVOS", integer(s.newCustomers())));
        table.addCell(kpi("CLIENTES ACTIVOS", integer(s.activeCustomers()) + " de " + integer(s.totalCustomers())));
        return table;
    }

    private static PdfPTable monthly(List<ReportTimeSeriesPoint> points) throws DocumentException {
        PdfPTable table = dataTable(new float[] {1.4f, 1, 1.3f, 1.3f, 1, 1.3f},
                "MES", "COMPRAS", "MONTO", "PTS EMITIDOS", "CANJES", "PTS CANJEADOS");
        if (points.isEmpty()) {
            return empty(table, 6);
        }
        int row = 0;
        for (ReportTimeSeriesPoint p : points) {
            Color bg = row++ % 2 == 0 ? Color.WHITE : SOFT;
            table.addCell(cell(capitalize(MONTH.format(p.period())), bg, Element.ALIGN_LEFT));
            table.addCell(cell(integer(p.purchases()), bg, Element.ALIGN_RIGHT));
            table.addCell(cell("$" + money(p.amount()), bg, Element.ALIGN_RIGHT));
            table.addCell(cell(points(p.pointsIssued()), bg, Element.ALIGN_RIGHT));
            table.addCell(cell(integer(p.redemptions()), bg, Element.ALIGN_RIGHT));
            table.addCell(cell(points(p.pointsRedeemed()), bg, Element.ALIGN_RIGHT));
        }
        return table;
    }

    private static PdfPTable topCustomers(List<TopCustomerReportEntry> customers) throws DocumentException {
        PdfPTable table = dataTable(new float[] {0.4f, 2.6f, 0.9f, 1.1f, 1.2f, 0.9f, 1.2f},
                "#", "CLIENTE", "COMPRAS", "MONTO", "PTS GANADOS", "CANJES", "SALDO");
        if (customers.isEmpty()) {
            return empty(table, 7);
        }
        int rank = 1;
        for (TopCustomerReportEntry c : customers) {
            Color bg = rank % 2 == 1 ? Color.WHITE : SOFT;
            table.addCell(cell(String.valueOf(rank++), bg, Element.ALIGN_CENTER));
            table.addCell(cell(c.customerFullName() + "\n" + c.email(), bg, Element.ALIGN_LEFT));
            table.addCell(cell(integer(c.purchases()), bg, Element.ALIGN_RIGHT));
            table.addCell(cell("$" + money(c.amount()), bg, Element.ALIGN_RIGHT));
            table.addCell(cell(points(c.pointsEarned()), bg, Element.ALIGN_RIGHT));
            table.addCell(cell(integer(c.redemptions()), bg, Element.ALIGN_RIGHT));
            table.addCell(cell(points(c.pointsBalance()), bg, Element.ALIGN_RIGHT));
        }
        return table;
    }

    private static PdfPTable topRewards(List<TopRewardReportEntry> rewards) throws DocumentException {
        PdfPTable table = dataTable(new float[] {0.4f, 3, 1, 1.3f, 1}, "#", "RECOMPENSA", "CANJES", "PTS CANJEADOS", "STOCK");
        if (rewards.isEmpty()) {
            return empty(table, 5);
        }
        int rank = 1;
        for (TopRewardReportEntry r : rewards) {
            Color bg = rank % 2 == 1 ? Color.WHITE : SOFT;
            table.addCell(cell(String.valueOf(rank++), bg, Element.ALIGN_CENTER));
            table.addCell(cell(r.rewardName(), bg, Element.ALIGN_LEFT));
            table.addCell(cell(integer(r.redemptions()), bg, Element.ALIGN_RIGHT));
            table.addCell(cell(points(r.pointsRedeemed()), bg, Element.ALIGN_RIGHT));
            table.addCell(cell(String.valueOf(r.stock()), bg, Element.ALIGN_RIGHT));
        }
        return table;
    }

    private static PdfPTable tiers(List<TierDistributionEntry> tiers) throws DocumentException {
        PdfPTable table = dataTable(new float[] {2, 1, 1.5f, 3}, "NIVEL", "CLIENTES", "PUNTOS", "REGLA");
        if (tiers.isEmpty()) {
            return empty(table, 4);
        }
        int row = 0;
        for (TierDistributionEntry t : tiers) {
            Color bg = row++ % 2 == 0 ? Color.WHITE : SOFT;
            table.addCell(cell(t.tier(), bg, Element.ALIGN_LEFT));
            table.addCell(cell(integer(t.customers()), bg, Element.ALIGN_RIGHT));
            table.addCell(cell(points(t.totalPoints()), bg, Element.ALIGN_RIGHT));
            table.addCell(cell(tierRule(t.tier()), bg, Element.ALIGN_LEFT));
        }
        return table;
    }

    private static PdfPTable stockAlerts(List<StockAlertEntry> alerts) throws DocumentException {
        PdfPTable table = dataTable(new float[] {3, 1, 1.3f, 1.4f}, "RECOMPENSA", "STOCK", "PTS REQUERIDOS", "ESTADO");
        if (alerts.isEmpty()) {
            PdfPCell none = new PdfPCell(new Phrase("Sin alertas: todas las recompensas activas tienen inventario suficiente.", BODY_MUTED));
            none.setColspan(4);
            none.setPadding(8);
            none.setBorderColor(LINE);
            table.addCell(none);
            return table;
        }
        for (StockAlertEntry a : alerts) {
            table.addCell(cell(a.name(), Color.WHITE, Element.ALIGN_LEFT));
            table.addCell(cell(String.valueOf(a.stock()), Color.WHITE, Element.ALIGN_RIGHT));
            table.addCell(cell(points(a.requiredPoints()), Color.WHITE, Element.ALIGN_RIGHT));
            PdfPCell status = new PdfPCell(new Phrase("OUT_OF_STOCK".equals(a.status()) ? "Agotada" : "Stock bajo", WARN));
            status.setPadding(6);
            status.setBorderColor(LINE);
            table.addCell(status);
        }
        return table;
    }

    // ── Cells ───────────────────────────────────────────────────────────────

    private static Paragraph sectionTitle(String text) {
        Paragraph p = new Paragraph(text, SECTION);
        p.setSpacingBefore(16);
        p.setSpacingAfter(6);
        return p;
    }

    private static PdfPCell meta(String label, String value) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.BOTTOM);
        cell.setBorderColor(LINE);
        cell.setPadding(6);
        cell.addElement(new Paragraph(label, LABEL));
        cell.addElement(new Paragraph(value == null ? "—" : value, BODY));
        return cell;
    }

    private static PdfPCell kpi(String label, String value) {
        PdfPCell cell = new PdfPCell();
        cell.setBorderColor(LINE);
        cell.setBackgroundColor(SOFT);
        cell.setPadding(9);
        cell.addElement(new Paragraph(label, LABEL));
        Paragraph v = new Paragraph(value, VALUE);
        v.setSpacingBefore(3);
        cell.addElement(v);
        return cell;
    }

    private static PdfPTable dataTable(float[] widths, String... headers) throws DocumentException {
        PdfPTable table = new PdfPTable(widths.length);
        table.setWidthPercentage(100);
        table.setWidths(widths);
        table.setHeaderRows(1);
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, HEAD));
            cell.setBackgroundColor(INK);
            cell.setBorderColor(INK);
            cell.setPadding(6);
            table.addCell(cell);
        }
        return table;
    }

    private static PdfPTable empty(PdfPTable table, int columns) {
        PdfPCell none = new PdfPCell(new Phrase("Sin datos en el periodo seleccionado.", BODY_MUTED));
        none.setColspan(columns);
        none.setPadding(8);
        none.setBorderColor(LINE);
        table.addCell(none);
        return table;
    }

    private static PdfPCell cell(String text, Color background, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(text == null ? "" : text, BODY));
        cell.setBackgroundColor(background);
        cell.setBorderColor(LINE);
        cell.setPadding(5);
        cell.setHorizontalAlignment(align);
        return cell;
    }

    // ── Formatting ──────────────────────────────────────────────────────────

    private static String period(LocalDate from, LocalDate to) {
        if (from == null && to == null) {
            return "Todo el historial";
        }
        return (from == null ? "Inicio" : DATE.format(from)) + " – " + (to == null ? "Hoy" : DATE.format(to));
    }

    private static String tierRule(String tier) {
        return switch (tier) {
            case "GOLD" -> "2,000 pts o más";
            case "SILVER" -> "De 500 a 1,999 pts";
            default -> "Menos de 500 pts";
        };
    }

    private static String integer(long value) {
        return new DecimalFormat("#,##0", DecimalFormatSymbols.getInstance(Locale.US)).format(value);
    }

    private static String money(BigDecimal value) {
        BigDecimal v = value == null ? BigDecimal.ZERO : value.setScale(2, RoundingMode.HALF_UP);
        return new DecimalFormat("#,##0.00", DecimalFormatSymbols.getInstance(Locale.US)).format(v);
    }

    private static String points(BigDecimal value) {
        BigDecimal v = value == null ? BigDecimal.ZERO : value.setScale(1, RoundingMode.HALF_UP);
        return new DecimalFormat("#,##0.#", DecimalFormatSymbols.getInstance(Locale.US)).format(v);
    }

    private static String capitalize(String text) {
        return text.isEmpty() ? text : Character.toUpperCase(text.charAt(0)) + text.substring(1).replace(".", "");
    }

    /** Footer on every page: confidentiality note + page number. */
    private static final class Footer extends PdfPageEventHelper {

        private final ReportPdfData data;

        private Footer(ReportPdfData data) {
            this.data = data;
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            Rectangle page = document.getPageSize();
            Phrase left = new Phrase("SIFIPRO · Información del comercio " + data.tenantCode()
                    + " · datos aislados por tenant", BODY_MUTED);
            Phrase right = new Phrase("Página " + writer.getPageNumber(), BODY_MUTED);
            ColumnText.showTextAligned(writer.getDirectContent(), Element.ALIGN_LEFT, left,
                    document.leftMargin(), 24, 0);
            ColumnText.showTextAligned(writer.getDirectContent(), Element.ALIGN_RIGHT, right,
                    page.getWidth() - document.rightMargin(), 24, 0);
        }
    }
}
