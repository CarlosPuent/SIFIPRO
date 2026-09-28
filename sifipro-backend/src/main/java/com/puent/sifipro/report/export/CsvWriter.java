package com.puent.sifipro.report.export;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.io.Writer;
import java.math.BigDecimal;

/**
 * Minimal RFC 4180 CSV writer (comma separator, CRLF line endings).
 *
 * Text cells that start with = + - @ (or a tab/carriage return) are prefixed with an
 * apostrophe, so customer-entered data can never be interpreted as a formula when the
 * file is opened in a spreadsheet (CSV/formula injection). Numbers are written as-is.
 */
public final class CsvWriter {

    private static final String UTF8_BOM = "﻿";

    private final Writer out;

    public CsvWriter(Writer out) {
        this.out = out;
    }

    /** Byte order mark so spreadsheet software detects UTF-8 (accents in names). */
    public CsvWriter writeBom() {
        write(UTF8_BOM);
        return this;
    }

    public CsvWriter row(Object... values) {
        StringBuilder line = new StringBuilder();
        for (int i = 0; i < values.length; i++) {
            if (i > 0) {
                line.append(',');
            }
            line.append(escape(values[i]));
        }
        write(line.append("\r\n").toString());
        return this;
    }

    public void flush() {
        try {
            out.flush();
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }
    }

    static String escape(Object value) {
        if (value == null) {
            return "";
        }
        if (value instanceof BigDecimal decimal) {
            return decimal.toPlainString();
        }
        if (value instanceof Number || value instanceof Boolean) {
            return value.toString();
        }

        String text = value.toString();
        if (!text.isEmpty() && "=+-@\t\r".indexOf(text.charAt(0)) >= 0) {
            text = "'" + text;
        }
        if (text.contains(",") || text.contains("\"") || text.contains("\n") || text.contains("\r")) {
            text = "\"" + text.replace("\"", "\"\"") + "\"";
        }
        return text;
    }

    private void write(String text) {
        try {
            out.write(text);
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }
    }
}
