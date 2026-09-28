package com.puent.sifipro.audit.service;

import java.time.LocalDate;
import com.puent.sifipro.audit.dto.AuditPageResponse;
import com.puent.sifipro.transaction.entity.PointsMovementType;

public interface AuditService {

    AuditPageResponse getPointsMovements(
            LocalDate from,
            LocalDate to,
            PointsMovementType type,
            Long customerId,
            Long userId,
            Integer page,
            Integer size,
            String currentUserEmail);
}
