package com.puent.sifipro.audit.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import com.puent.sifipro.audit.dto.AuditMovementEntry;
import com.puent.sifipro.audit.dto.AuditPageResponse;
import com.puent.sifipro.audit.repository.AuditQueryRepository;
import com.puent.sifipro.audit.repository.AuditQueryRepository.AuditFilter;
import com.puent.sifipro.shared.exception.BusinessException;
import com.puent.sifipro.shared.exception.ResourceNotFoundException;
import com.puent.sifipro.transaction.entity.PointsMovementType;
import com.puent.sifipro.user.entity.AppUser;
import com.puent.sifipro.user.repository.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditServiceImpl implements AuditService {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;

    private final AuditQueryRepository auditQueryRepository;
    private final AppUserRepository appUserRepository;

    public AuditServiceImpl(AuditQueryRepository auditQueryRepository, AppUserRepository appUserRepository) {
        this.auditQueryRepository = auditQueryRepository;
        this.appUserRepository = appUserRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AuditPageResponse getPointsMovements(
            LocalDate from,
            LocalDate to,
            PointsMovementType type,
            Long customerId,
            Long userId,
            Integer page,
            Integer size,
            String currentUserEmail) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new BusinessException("'from' must be on or before 'to'.");
        }

        // The tenant always comes from the authenticated user, never from the request.
        Long tenantId = findAuthenticatedUser(currentUserEmail).getTenant().getId();
        AuditFilter filter = new AuditFilter(tenantId, from, to, type, customerId, userId);

        int pageIndex = page == null ? 0 : Math.max(0, page);
        int pageSize = size == null ? DEFAULT_PAGE_SIZE : Math.max(1, Math.min(MAX_PAGE_SIZE, size));

        long total = auditQueryRepository.count(filter);
        List<AuditMovementEntry> content = auditQueryRepository.findPage(filter, pageIndex, pageSize);
        int totalPages = (int) ((total + pageSize - 1) / pageSize);

        return new AuditPageResponse(content, pageIndex, pageSize, total, totalPages);
    }

    private AppUser findAuthenticatedUser(String currentUserEmail) {
        String email = currentUserEmail == null ? null : currentUserEmail.trim().toLowerCase(Locale.ROOT);
        AppUser currentUser = appUserRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found."));

        if (currentUser.getTenant() == null) {
            throw new ResourceNotFoundException("Authenticated user not found.");
        }

        return currentUser;
    }
}
