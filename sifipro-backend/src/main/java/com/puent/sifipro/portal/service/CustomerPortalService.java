package com.puent.sifipro.portal.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import com.puent.sifipro.auth.security.JwtService;
import com.puent.sifipro.customer.CustomerTier;
import com.puent.sifipro.customer.dto.CustomerTierProgressResponse;
import com.puent.sifipro.customer.entity.Customer;
import com.puent.sifipro.customer.repository.CustomerRepository;
import com.puent.sifipro.loyalty.entity.ProgramConfig;
import com.puent.sifipro.loyalty.repository.ProgramConfigRepository;
import com.puent.sifipro.portal.dto.PortalDtos.PortalAuthResponse;
import com.puent.sifipro.portal.dto.PortalDtos.PortalLoginRequest;
import com.puent.sifipro.portal.dto.PortalDtos.PortalMovementEntry;
import com.puent.sifipro.portal.dto.PortalDtos.PortalProfileResponse;
import com.puent.sifipro.portal.dto.PortalDtos.PortalProgramBalance;
import com.puent.sifipro.portal.dto.PortalDtos.PortalRewardEntry;
import com.puent.sifipro.portal.dto.PortalDtos.PortalTenant;
import com.puent.sifipro.portal.dto.PortalDtos.PublicTenantResponse;
import com.puent.sifipro.portal.security.CustomerPrincipal;
import com.puent.sifipro.reward.entity.Reward;
import com.puent.sifipro.reward.repository.RewardRepository;
import com.puent.sifipro.shared.exception.BusinessException;
import com.puent.sifipro.shared.exception.ResourceNotFoundException;
import com.puent.sifipro.tenant.entity.Tenant;
import com.puent.sifipro.tenant.repository.TenantRepository;
import com.puent.sifipro.transaction.entity.PointsMovement;
import com.puent.sifipro.transaction.entity.PointsMovementType;
import com.puent.sifipro.transaction.repository.PointsMovementRepository;
import com.puent.sifipro.transaction.service.ProgramPointsBalanceCalculator;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Customer self-service portal (RF-08): sign-in and read-only access to the customer's
 * own balance, tier, points history and the rewards they can claim at the counter.
 *
 * Every query is keyed by the customer id AND tenant id carried in the authenticated
 * principal, so a customer can only ever read their own data.
 */
@Service
public class CustomerPortalService {

    private static final String TOKEN_TYPE = "Bearer";
    private static final String INVALID_CREDENTIALS = "Invalid credentials.";
    private static final int MOVEMENTS_LIMIT = 50;

    private final TenantRepository tenantRepository;
    private final CustomerRepository customerRepository;
    private final ProgramConfigRepository programConfigRepository;
    private final RewardRepository rewardRepository;
    private final PointsMovementRepository pointsMovementRepository;
    private final ProgramPointsBalanceCalculator balanceCalculator;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public CustomerPortalService(
            TenantRepository tenantRepository,
            CustomerRepository customerRepository,
            ProgramConfigRepository programConfigRepository,
            RewardRepository rewardRepository,
            PointsMovementRepository pointsMovementRepository,
            ProgramPointsBalanceCalculator balanceCalculator,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.tenantRepository = tenantRepository;
        this.customerRepository = customerRepository;
        this.programConfigRepository = programConfigRepository;
        this.rewardRepository = rewardRepository;
        this.pointsMovementRepository = pointsMovementRepository;
        this.balanceCalculator = balanceCalculator;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional(readOnly = true)
    public PublicTenantResponse getPublicTenant(String code) {
        Tenant tenant = tenantRepository.findByCodeIgnoreCase(normalize(code))
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found."));
        return new PublicTenantResponse(tenant.getCode(), tenant.getName(), Boolean.TRUE.equals(tenant.getActive()));
    }

    @Transactional
    public PortalAuthResponse login(PortalLoginRequest request) {
        Tenant tenant = tenantRepository.findByCodeIgnoreCase(normalize(request.tenantCode()))
                .orElseThrow(() -> new BusinessException(INVALID_CREDENTIALS));
        Customer customer = customerRepository
                .findByEmailIgnoreCaseAndTenantId(normalize(request.email()), tenant.getId())
                .orElseThrow(() -> new BusinessException(INVALID_CREDENTIALS));

        if (!customer.isPortalEnabled()
                || !passwordEncoder.matches(request.password(), customer.getPortalPasswordHash())) {
            throw new BusinessException(INVALID_CREDENTIALS);
        }
        // Account state is revealed only after the password matched (same rule as staff login).
        if (!Boolean.TRUE.equals(tenant.getActive())) {
            throw new BusinessException("Tenant account is suspended.");
        }
        if (!Boolean.TRUE.equals(customer.getActive())) {
            throw new BusinessException("Customer account is inactive.");
        }

        customer.setPortalLastLoginAt(LocalDateTime.now());
        customerRepository.save(customer);

        return new PortalAuthResponse(jwtService.generateCustomerToken(customer), TOKEN_TYPE, toProfile(customer));
    }

    @Transactional(readOnly = true)
    public PortalProfileResponse getProfile(CustomerPrincipal principal) {
        return toProfile(findCustomer(principal));
    }

    @Transactional(readOnly = true)
    public List<PortalMovementEntry> getMovements(CustomerPrincipal principal) {
        Customer customer = findCustomer(principal);
        return pointsMovementRepository
                .findAllByCustomerIdAndTenantIdOrderByIdDesc(customer.getId(), principal.tenantId())
                .stream()
                .limit(MOVEMENTS_LIMIT)
                .map(this::toMovement)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PortalRewardEntry> getRewards(CustomerPrincipal principal) {
        Customer customer = findCustomer(principal);
        Map<Long, BigDecimal> balances = new HashMap<>();
        List<PortalRewardEntry> rewards = new ArrayList<>();

        for (Reward reward : rewardRepository.findAllByTenantIdOrderByIdDesc(principal.tenantId())) {
            ProgramConfig program = reward.getProgramConfig();
            if (!Boolean.TRUE.equals(reward.getActive()) || !Boolean.TRUE.equals(program.getActive())) {
                continue;
            }
            BigDecimal balance = balances.computeIfAbsent(program.getId(),
                    id -> balanceCalculator.calculate(customer.getId(), principal.tenantId(), id));
            BigDecimal required = reward.getRequiredPoints();
            int stock = reward.getStock() == null ? 0 : reward.getStock();
            BigDecimal missing = required.subtract(balance).max(BigDecimal.ZERO);
            boolean available = stock > 0 && missing.signum() == 0;

            rewards.add(new PortalRewardEntry(
                    reward.getId(), reward.getName(), reward.getDescription(), reward.getImageUrl(),
                    program.getId(), program.getProgramName(), required, stock,
                    scale(balance), scale(missing), available));
        }

        rewards.sort(Comparator.comparing(PortalRewardEntry::available).reversed()
                .thenComparing(PortalRewardEntry::requiredPoints));
        return rewards;
    }

    private Customer findCustomer(CustomerPrincipal principal) {
        return customerRepository.findByIdAndTenantId(principal.customerId(), principal.tenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found."));
    }

    private PortalProfileResponse toProfile(Customer customer) {
        BigDecimal points = customer.getPointsBalance() == null ? BigDecimal.ZERO : customer.getPointsBalance();
        CustomerTier tier = CustomerTier.fromPoints(points);
        Tenant tenant = customer.getTenant();

        List<PortalProgramBalance> programs = programConfigRepository
                .findAllByTenantIdOrderByIdDesc(tenant.getId())
                .stream()
                .filter(program -> Boolean.TRUE.equals(program.getActive()))
                .map(program -> new PortalProgramBalance(
                        program.getId(),
                        program.getProgramName(),
                        scale(balanceCalculator.calculate(customer.getId(), tenant.getId(), program.getId()))))
                .toList();

        return new PortalProfileResponse(
                customer.getId(),
                customer.getFirstName(),
                customer.getLastName(),
                customer.getEmail(),
                customer.getPhone(),
                customer.getCreatedAt(),
                new PortalTenant(tenant.getCode(), tenant.getName()),
                scale(points),
                tier.name(),
                buildTierProgress(tier, points),
                programs);
    }

    private PortalMovementEntry toMovement(PointsMovement movement) {
        BigDecimal points = movement.getPoints() == null ? BigDecimal.ZERO : movement.getPoints();
        if (movement.getType() == PointsMovementType.REDEEM || movement.getType() == PointsMovementType.EXPIRE) {
            points = points.abs().negate();
        }
        String description = movement.getType() == PointsMovementType.ADJUSTMENT
                ? movement.getReason()
                : movement.getDescription();
        return new PortalMovementEntry(
                movement.getId(),
                movement.getCreatedAt(),
                movement.getType().name(),
                movement.getProgramConfig().getProgramName(),
                scale(points),
                description);
    }

    private static CustomerTierProgressResponse buildTierProgress(CustomerTier tier, BigDecimal points) {
        CustomerTierProgressResponse progress = new CustomerTierProgressResponse();
        progress.setCurrentTier(tier.name());
        CustomerTier next = tier.next();
        progress.setNextTier(next == null ? null : next.name());
        progress.setCurrentPoints(points);
        if (tier == CustomerTier.GOLD) {
            progress.setPointsToNextTier(BigDecimal.ZERO);
            progress.setProgressPercentage(100.0);
        } else {
            progress.setPointsForNextTier(tier.getNextThreshold());
            progress.setPointsToNextTier(tier.getNextThreshold().subtract(points).max(BigDecimal.ZERO));
            progress.setProgressPercentage(tier.computeProgressPercentage(points));
        }
        return progress;
    }

    private static BigDecimal scale(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private static String normalize(String value) {
        return value == null ? null : value.trim().toLowerCase(Locale.ROOT);
    }
}
