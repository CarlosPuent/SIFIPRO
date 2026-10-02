package com.puent.sifipro.audit.dto;

import java.util.List;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "One page of the points audit log, newest first.")
public record AuditPageResponse(
        List<AuditMovementEntry> content,
        @Schema(description = "Zero-based page index.", example = "0") int page,
        @Schema(example = "20") int size,
        @Schema(example = "91") long totalElements,
        @Schema(example = "5") int totalPages) {
}
