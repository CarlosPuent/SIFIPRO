package com.puent.sifipro.customer;

import java.math.BigDecimal;
import java.math.RoundingMode;

public enum CustomerTier {
    BRONZE,
    SILVER,
    GOLD;

    private static final BigDecimal SILVER_THRESHOLD = new BigDecimal("500");
    private static final BigDecimal GOLD_THRESHOLD = new BigDecimal("2000");

    public static CustomerTier fromPoints(BigDecimal points) {
        if (points == null) return BRONZE;
        if (points.compareTo(GOLD_THRESHOLD) >= 0) return GOLD;
        if (points.compareTo(SILVER_THRESHOLD) >= 0) return SILVER;
        return BRONZE;
    }

    public BigDecimal getThreshold() {
        return switch (this) {
            case BRONZE -> BigDecimal.ZERO;
            case SILVER -> SILVER_THRESHOLD;
            case GOLD -> GOLD_THRESHOLD;
        };
    }

    public BigDecimal getNextThreshold() {
        return switch (this) {
            case BRONZE -> SILVER_THRESHOLD;
            case SILVER -> GOLD_THRESHOLD;
            case GOLD -> GOLD_THRESHOLD;
        };
    }

    public CustomerTier next() {
        return switch (this) {
            case BRONZE -> SILVER;
            case SILVER -> GOLD;
            case GOLD -> null;
        };
    }

    public double computeProgressPercentage(BigDecimal currentPoints) {
        if (this == GOLD) return 100.0;
        BigDecimal range = getNextThreshold().subtract(getThreshold());
        BigDecimal progress = currentPoints.subtract(getThreshold());
        if (progress.compareTo(BigDecimal.ZERO) <= 0) return 0.0;
        return progress
                .divide(range, 6, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
