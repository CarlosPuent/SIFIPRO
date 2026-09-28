package com.puent.sifipro.report.export;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.StringWriter;
import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

/** Pure unit tests for CSV quoting and formula-injection protection. */
class CsvWriterTest {

    @Test
    void quotesCellsWithSeparatorsQuotesOrLineBreaks() {
        assertThat(CsvWriter.escape("Lopez, Andres")).isEqualTo("\"Lopez, Andres\"");
        assertThat(CsvWriter.escape("15\" screen")).isEqualTo("\"15\"\" screen\"");
        assertThat(CsvWriter.escape("line1\nline2")).isEqualTo("\"line1\nline2\"");
        assertThat(CsvWriter.escape(null)).isEmpty();
    }

    @Test
    void neutralisesTextThatSpreadsheetsWouldRunAsAFormula() {
        assertThat(CsvWriter.escape("=HYPERLINK(\"http://evil\")")).startsWith("\"'=");
        assertThat(CsvWriter.escape("+1")).isEqualTo("'+1");
        assertThat(CsvWriter.escape("@SUM(A1)")).isEqualTo("'@SUM(A1)");
    }

    @Test
    void writesNumbersAsIs_includingNegativeOnes() {
        assertThat(CsvWriter.escape(new BigDecimal("-120.0000"))).isEqualTo("-120.0000");
        assertThat(CsvWriter.escape(42L)).isEqualTo("42");
    }

    @Test
    void writesRowsWithCrlf() {
        StringWriter out = new StringWriter();
        new CsvWriter(out).row("a", 1).row("b", 2).flush();
        assertThat(out.toString()).isEqualTo("a,1\r\nb,2\r\n");
    }
}
