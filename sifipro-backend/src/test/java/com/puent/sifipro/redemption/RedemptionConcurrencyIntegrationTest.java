package com.puent.sifipro.redemption;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.puent.sifipro.customer.entity.Customer;
import com.puent.sifipro.customer.repository.CustomerRepository;
import com.puent.sifipro.loyalty.entity.ProgramConfig;
import com.puent.sifipro.loyalty.repository.ProgramConfigRepository;
import com.puent.sifipro.redemption.dto.CreateRedemptionRequest;
import com.puent.sifipro.redemption.repository.RedemptionRepository;
import com.puent.sifipro.redemption.service.RedemptionService;
import com.puent.sifipro.reward.entity.Reward;
import com.puent.sifipro.reward.repository.RewardRepository;
import com.puent.sifipro.tenant.entity.Tenant;
import com.puent.sifipro.tenant.repository.TenantRepository;
import com.puent.sifipro.transaction.entity.PointsMovement;
import com.puent.sifipro.transaction.entity.PointsMovementType;
import com.puent.sifipro.transaction.repository.PointsMovementRepository;
import com.puent.sifipro.user.entity.AppUser;
import com.puent.sifipro.user.entity.UserRole;
import com.puent.sifipro.user.repository.AppUserRepository;

/**
 * Reproduces two simultaneous redemptions against the same Reward (stock = 1).
 * Before the optimistic locking fix, both requests could pass validation and
 * decrement stock independently, resulting in a negative stock (oversell).
 * With @Version on Reward/Customer, exactly one redemption must succeed and
 * the other must fail with an optimistic locking conflict.
 */
@SpringBootTest
class RedemptionConcurrencyIntegrationTest {

    @Autowired
    private RedemptionService redemptionService;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private AppUserRepository appUserRepository;

    @Autowired
    private ProgramConfigRepository programConfigRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private RewardRepository rewardRepository;

    @Autowired
    private PointsMovementRepository pointsMovementRepository;

    @Autowired
    private RedemptionRepository redemptionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Long createdTenantId;

    @AfterEach
    void cleanUpTestData() {
        if (createdTenantId == null) {
            return;
        }

        redemptionRepository.findAllByTenantIdOrderByIdDesc(createdTenantId)
                .forEach(redemptionRepository::delete);
        pointsMovementRepository.findAllByTenantIdOrderByIdDesc(createdTenantId)
                .forEach(pointsMovementRepository::delete);
        rewardRepository.findAllByTenantIdOrderByIdDesc(createdTenantId)
                .forEach(rewardRepository::delete);
        customerRepository.findAllByTenantIdOrderByIdDesc(createdTenantId)
                .forEach(customerRepository::delete);
        appUserRepository.findAllByTenantIdOrderByIdAsc(createdTenantId)
                .forEach(appUserRepository::delete);
        programConfigRepository.findAllByTenantIdOrderByIdDesc(createdTenantId)
                .forEach(programConfigRepository::delete);
        tenantRepository.deleteById(createdTenantId);

        createdTenantId = null;
    }

    @Test
    void onlyOneOfTwoConcurrentRedemptionsSucceedsWhenStockIsOne() throws InterruptedException {
        Tenant tenant = new Tenant();
        tenant.setName("Concurrency Test Tenant");
        tenant.setCode("concurrency-test-" + System.nanoTime());
        tenant.setActive(Boolean.TRUE);
        tenant = tenantRepository.save(tenant);
        createdTenantId = tenant.getId();

        AppUser staffUser = new AppUser();
        staffUser.setFirstName("Race");
        staffUser.setLastName("Tester");
        staffUser.setEmail("race-tester-" + System.nanoTime() + "@sifipro-test.dev");
        staffUser.setPasswordHash(passwordEncoder.encode("Test1234!"));
        staffUser.setRole(UserRole.STAFF);
        staffUser.setActive(Boolean.TRUE);
        staffUser.setTenant(tenant);
        staffUser = appUserRepository.save(staffUser);

        ProgramConfig programConfig = new ProgramConfig();
        programConfig.setProgramName("Concurrency Test Program");
        programConfig.setPointsPerDollar(new BigDecimal("1.0000"));
        programConfig.setMinimumPurchaseAmount(new BigDecimal("0.00"));
        programConfig.setActive(Boolean.TRUE);
        programConfig.setTenant(tenant);
        programConfig = programConfigRepository.save(programConfig);

        Customer customer = new Customer();
        customer.setFirstName("Race");
        customer.setLastName("Customer");
        customer.setEmail("race-customer-" + System.nanoTime() + "@sifipro-test.dev");
        customer.setPointsBalance(new BigDecimal("1000.0000"));
        customer.setActive(Boolean.TRUE);
        customer.setTenant(tenant);
        customer = customerRepository.save(customer);

        Reward reward = new Reward();
        reward.setName("Concurrency Test Reward");
        reward.setRequiredPoints(new BigDecimal("100.0000"));
        reward.setStock(1);
        reward.setActive(Boolean.TRUE);
        reward.setTenant(tenant);
        reward.setProgramConfig(programConfig);
        reward = rewardRepository.save(reward);

        PointsMovement earnMovement = new PointsMovement();
        earnMovement.setCustomer(customer);
        earnMovement.setTenant(tenant);
        earnMovement.setProgramConfig(programConfig);
        earnMovement.setType(PointsMovementType.EARN);
        earnMovement.setPoints(new BigDecimal("1000.0000"));
        earnMovement.setDescription("Seed balance for concurrency test");
        earnMovement.setReferenceType("TEST_SEED");
        earnMovement.setReferenceId(1L);
        pointsMovementRepository.save(earnMovement);

        Long customerId = customer.getId();
        Long rewardId = reward.getId();
        String currentUserEmail = staffUser.getEmail();

        int attempts = 2;
        CountDownLatch readyLatch = new CountDownLatch(attempts);
        CountDownLatch startLatch = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(attempts);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger conflictCount = new AtomicInteger(0);
        AtomicInteger otherFailureCount = new AtomicInteger(0);

        List<CompletableFuture<Void>> futures = List.of(
                CompletableFuture.runAsync(() -> runRedemptionAttempt(
                        customerId, rewardId, currentUserEmail, readyLatch, startLatch,
                        successCount, conflictCount, otherFailureCount), executor),
                CompletableFuture.runAsync(() -> runRedemptionAttempt(
                        customerId, rewardId, currentUserEmail, readyLatch, startLatch,
                        successCount, conflictCount, otherFailureCount), executor));

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown();

        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        executor.shutdown();

        assertThat(successCount.get())
                .as("exactly one of the two concurrent redemptions should succeed")
                .isEqualTo(1);
        assertThat(conflictCount.get())
                .as("the losing redemption should fail with an optimistic locking conflict")
                .isEqualTo(1);
        assertThat(otherFailureCount.get())
                .as("no unexpected failure types should occur")
                .isEqualTo(0);

        Reward reloadedReward = rewardRepository.findById(rewardId).orElseThrow();
        assertThat(reloadedReward.getStock())
                .as("stock must not be oversold (negative)")
                .isEqualTo(0);

        assertThat(redemptionRepository.findAllByCustomerIdAndTenantIdOrderByIdDesc(customerId, tenant.getId()))
                .as("only one redemption record should have been persisted")
                .hasSize(1);
    }

    private void runRedemptionAttempt(
            Long customerId,
            Long rewardId,
            String currentUserEmail,
            CountDownLatch readyLatch,
            CountDownLatch startLatch,
            AtomicInteger successCount,
            AtomicInteger conflictCount,
            AtomicInteger otherFailureCount) {
        try {
            readyLatch.countDown();
            startLatch.await(5, TimeUnit.SECONDS);

            CreateRedemptionRequest request = new CreateRedemptionRequest();
            request.setCustomerId(customerId);
            request.setRewardId(rewardId);
            request.setRedemptionDate(LocalDateTime.now());
            request.setNotes("Concurrency test attempt");

            redemptionService.createRedemption(request, currentUserEmail);
            successCount.incrementAndGet();
        } catch (OptimisticLockingFailureException ex) {
            conflictCount.incrementAndGet();
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            otherFailureCount.incrementAndGet();
        } catch (Exception ex) {
            otherFailureCount.incrementAndGet();
        }
    }
}
