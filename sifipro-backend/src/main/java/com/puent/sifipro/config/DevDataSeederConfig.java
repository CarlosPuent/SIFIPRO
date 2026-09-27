package com.puent.sifipro.config;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.puent.sifipro.customer.dto.CreateCustomerRequest;
import com.puent.sifipro.customer.dto.CustomerResponse;
import com.puent.sifipro.customer.repository.CustomerRepository;
import com.puent.sifipro.customer.service.CustomerService;
import com.puent.sifipro.loyalty.dto.CreateProgramConfigRequest;
import com.puent.sifipro.loyalty.service.ProgramConfigService;
import com.puent.sifipro.redemption.dto.CreateRedemptionRequest;
import com.puent.sifipro.redemption.service.RedemptionService;
import com.puent.sifipro.reward.dto.CreateRewardRequest;
import com.puent.sifipro.reward.service.RewardService;
import com.puent.sifipro.tenant.entity.Tenant;
import com.puent.sifipro.tenant.repository.TenantRepository;
import com.puent.sifipro.transaction.dto.CreatePurchaseTransactionRequest;
import com.puent.sifipro.transaction.service.PurchaseTransactionService;
import com.puent.sifipro.user.entity.AppUser;
import com.puent.sifipro.user.entity.UserRole;
import com.puent.sifipro.user.repository.AppUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Seeds demo data for the "dev" profile.
 *
 * <ul>
 *   <li>The platform operator (no tenant), if missing.</li>
 *   <li>Tenant "demo": 2 programs, 15 customers across the 3 tiers, 8 rewards (one
 *       low on stock, one sold out), ~60 purchases over the last 4 months and 15
 *       redemptions.</li>
 *   <li>Tenant "cafe-norte": a small second tenant used to demonstrate isolation. It
 *       shares one customer email with "demo" on purpose (allowed since V3).</li>
 * </ul>
 *
 * Every business row is created through the real services, so balances, stock and
 * the points ledger are produced by the same rules as in production. Idempotency is
 * keyed on the tenant code: a tenant that already exists is never seeded again, and
 * each tenant is seeded in a single transaction (all or nothing).
 *
 * Past dates: the services accept past transactionDate/redemptionDate, but the ledger
 * (points_movements) has no business date of its own — its date is the audit column
 * created_at, always "now". After seeding a tenant, backdateSeededRows() aligns
 * created_at with the business dates via SQL. It only touches timestamps (never
 * amounts, points or stock), only for the tenant just seeded, and only in dev.
 */
@Configuration
@Profile("dev")
public class DevDataSeederConfig {

    private static final Logger log = LoggerFactory.getLogger(DevDataSeederConfig.class);

    private static final String DEMO_TENANT_CODE = "demo";
    private static final String SECOND_TENANT_CODE = "cafe-norte";

    private static final String DEMO_ADMIN_EMAIL = "admin@sifipro.com";
    private static final String DEMO_STAFF_EMAIL = "staff@sifipro.com";
    private static final String SECOND_ADMIN_EMAIL = "admin@cafenorte.com";

    // Purchases fall between 118 and 12 days ago; redemptions in the last 10 days, so
    // every customer has earned its points before redeeming.
    private static final int OLDEST_PURCHASE_DAYS_AGO = 118;
    private static final int NEWEST_PURCHASE_DAYS_AGO = 12;
    private static final int REDEMPTION_WINDOW_DAYS = 10;

    @Bean
    public CommandLineRunner seedDevData(
            AppUserRepository appUserRepository,
            TenantRepository tenantRepository,
            CustomerRepository customerRepository,
            PasswordEncoder passwordEncoder,
            ProgramConfigService programConfigService,
            CustomerService customerService,
            RewardService rewardService,
            PurchaseTransactionService purchaseTransactionService,
            RedemptionService redemptionService,
            PlatformTransactionManager transactionManager,
            JdbcTemplate jdbcTemplate) {
        return args -> {
            seedPlatformAdminIfMissing(appUserRepository, passwordEncoder);

            TenantSeeder seeder = new TenantSeeder(
                    appUserRepository, tenantRepository, customerRepository, passwordEncoder,
                    programConfigService, customerService, rewardService,
                    purchaseTransactionService, redemptionService, jdbcTemplate);
            TransactionTemplate transaction = new TransactionTemplate(transactionManager);

            if (!tenantRepository.existsByCodeIgnoreCase(DEMO_TENANT_CODE)) {
                transaction.executeWithoutResult(status -> seeder.seed(demoTenantPlan()));
            }
            if (!tenantRepository.existsByCodeIgnoreCase(SECOND_TENANT_CODE)) {
                transaction.executeWithoutResult(status -> seeder.seed(secondTenantPlan()));
            }
        };
    }

    /**
     * Crea el AppUser PLATFORM_ADMIN semilla (sin tenant) si todavía no existe.
     * Consumido por sifipro-platform-api para el login de operador de plataforma;
     * vive aquí porque sifipro-backend sigue siendo el único dueño del esquema y
     * el único servicio con un seeder de datos de dev.
     */
    private void seedPlatformAdminIfMissing(
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder) {
        String platformAdminEmail = "platform-admin@sifipro.com";

        if (appUserRepository.findByEmailIgnoreCase(platformAdminEmail).isPresent()) {
            return;
        }

        AppUser platformAdmin = new AppUser();
        platformAdmin.setEmail(platformAdminEmail);
        platformAdmin.setPasswordHash(passwordEncoder.encode("PlatformAdmin123!"));
        platformAdmin.setFirstName("Platform");
        platformAdmin.setLastName("Admin");
        platformAdmin.setRole(UserRole.PLATFORM_ADMIN);
        platformAdmin.setActive(true);
        platformAdmin.setTenant(null);
        appUserRepository.save(platformAdmin);
    }

    // ── Seed plans (pure data) ────────────────────────────────────────────────

    private static TenantPlan demoTenantPlan() {
        return new TenantPlan(
                "Demo Tenant", DEMO_TENANT_CODE,
                List.of(
                        new UserPlan("Carlos", "Puente", DEMO_ADMIN_EMAIL, "Admin123!", UserRole.ADMIN),
                        new UserPlan("Ana", "Lopez", DEMO_STAFF_EMAIL, "Staff123!", UserRole.STAFF)),
                List.of(
                        new ProgramPlan("P1", "SIFIPRO Rewards", "1.5000", "25.00"),
                        new ProgramPlan("P2", "Club Café", "2.0000", "10.00")),
                List.of(
                        new RewardPlan("desc15", "P1", "15% Descuento en tienda", "Aplica un 15% de descuento en tu próxima compra.", "120", 20),
                        new RewardPlan("caja", "P1", "Caja de Bienvenida", "Kit exclusivo de temporada con productos seleccionados.", "220", 8),
                        new RewardPlan("envio", "P1", "Envío gratis", "Envío sin costo en tu próxima compra en línea.", "80", 30),
                        new RewardPlan("tarjeta", "P1", "Tarjeta de regalo $25", "Tarjeta de regalo canjeable en cualquier sucursal.", "400", 3),
                        new RewardPlan("audif", "P1", "Audífonos inalámbricos", "Audífonos Bluetooth con estuche de carga.", "1500", 2),
                        new RewardPlan("cafe", "P2", "Café Premium Gratis", "Canjea un café de especialidad en cualquier sucursal.", "90", 15),
                        new RewardPlan("postre", "P2", "Postre de la casa", "Un postre del día a elección.", "60", 25),
                        new RewardPlan("taza", "P2", "Taza edición limitada", "Taza de cerámica de la colección de temporada.", "300", 4)),
                List.of(
                        // GOLD (saldo final >= 2000)
                        customer("Laura", "Mendoza", "laura.mendoza@sifipro.dev", "+503-7100-1001",
                                buys("P1:420", "P1:380", "P1:450", "P1:400", "P1:390", "P1:410", "P2:35"), "audif", "envio"),
                        customer("Andres", "Lopez", "andres.lopez@sifipro.dev", "+503-7100-1002",
                                buys("P1:390", "P1:410", "P1:380", "P1:420", "P1:400", "P1:430", "P2:60"), "audif", "cafe"),
                        customer("Sara", "Castillo", "sara.castillo@sifipro.dev", "+503-7100-1003",
                                buys("P1:300", "P1:280", "P1:350", "P1:320", "P2:45", "P2:50", "P2:40"), "cafe"),
                        // SILVER (500 - 1999)
                        customer("Mariana", "Rivas", "mariana.rivas@sifipro.dev", "+503-7100-1004",
                                buys("P1:200", "P1:180", "P1:220", "P2:30"), "desc15"),
                        customer("Diego", "Hernandez", "diego.hernandez@sifipro.dev", "+503-7100-1005",
                                buys("P1:150", "P1:170", "P1:160", "P1:190"), "caja"),
                        customer("Valeria", "Cruz", "valeria.cruz@sifipro.dev", "+503-7100-1006",
                                buys("P2:80", "P2:95", "P2:70", "P2:85"), "postre"),
                        customer("Jose", "Martinez", "jose.martinez@sifipro.dev", "+503-7100-1007",
                                buys("P1:260", "P1:240", "P2:50", "P2:45"), "envio", "cafe"),
                        customer("Gabriela", "Flores", "gabriela.flores@sifipro.dev", "+503-7100-1008",
                                buys("P1:320", "P1:300", "P1:280", "P1:290"), "tarjeta"),
                        // BRONZE (< 500); Fernando and Sofia include purchases under the minimum (0 points)
                        customer("Ricardo", "Perez", "ricardo.perez@sifipro.dev", "+503-7100-1009",
                                buys("P1:90", "P1:110", "P1:70"), "desc15"),
                        customer("Camila", "Torres", "camila.torres@sifipro.dev", "+503-7100-1010",
                                buys("P2:25", "P2:30", "P2:20"), "postre"),
                        customer("Fernando", "Rojas", "fernando.rojas@sifipro.dev", null,
                                buys("P1:18", "P1:22", "P1:60")),
                        customer("Lucia", "Morales", "lucia.morales@sifipro.dev", "+503-7100-1012",
                                buys("P1:45", "P1:55", "P2:15", "P2:40"), "cafe"),
                        customer("Miguel", "Castro", "miguel.castro@sifipro.dev", "+503-7100-1013",
                                buys("P1:130", "P1:95", "P2:12"), "envio"),
                        customer("Sofia", "Ramirez", "sofia.ramirez@sifipro.dev", null,
                                buys("P2:8", "P2:25", "P2:30")),
                        customer("Tomas", "Vargas", "tomas.vargas@sifipro.dev", "+503-7100-1015",
                                buys("P1:40", "P1:35"))),
                // Deactivated after its activity, so the demo shows an inactive customer.
                List.of("tomas.vargas@sifipro.dev"));
    }

    private static TenantPlan secondTenantPlan() {
        return new TenantPlan(
                "Café del Norte", SECOND_TENANT_CODE,
                List.of(new UserPlan("Marta", "Diaz", SECOND_ADMIN_EMAIL, "Admin123!", UserRole.ADMIN)),
                List.of(new ProgramPlan("N", "Club Café del Norte", "1.0000", "5.00")),
                List.of(
                        new RewardPlan("espresso", "N", "Espresso doble", "Un espresso doble en barra.", "50", 40),
                        new RewardPlan("croissant", "N", "Croissant", "Croissant de mantequilla recién horneado.", "35", 30),
                        new RewardPlan("bolsa", "N", "Bolsa de café 250 g", "Café de altura molido o en grano.", "200", 5)),
                List.of(
                        // Same email as a "demo" customer: each tenant has its own record.
                        customer("Laura", "Mendoza", "laura.mendoza@sifipro.dev", "+503-7100-1001",
                                buys("N:12", "N:18", "N:9", "N:25"), "espresso"),
                        customer("Pablo", "Mendez", "pablo.mendez@cafenorte.dev", "+503-7200-2002",
                                buys("N:30", "N:22", "N:15"), "croissant"),
                        customer("Elena", "Suarez", "elena.suarez@cafenorte.dev", null,
                                buys("N:8", "N:4")),
                        customer("Oscar", "Navarro", "oscar.navarro@cafenorte.dev", "+503-7200-2004",
                                buys("N:45"))),
                List.of());
    }

    private static CustomerPlan customer(
            String firstName, String lastName, String email, String phone,
            List<PurchasePlan> purchases, String... redeemedRewardKeys) {
        return new CustomerPlan(firstName, lastName, email, phone, purchases, List.of(redeemedRewardKeys));
    }

    /** Parses "PROGRAM:amount" entries, e.g. buys("P1:420", "P2:35"). */
    private static List<PurchasePlan> buys(String... entries) {
        List<PurchasePlan> purchases = new ArrayList<>();
        for (String entry : entries) {
            String[] parts = entry.split(":");
            purchases.add(new PurchasePlan(parts[0], parts[1]));
        }
        return purchases;
    }

    private record TenantPlan(
            String name, String code, List<UserPlan> users, List<ProgramPlan> programs,
            List<RewardPlan> rewards, List<CustomerPlan> customers, List<String> customersToDeactivate) {
    }

    private record UserPlan(String firstName, String lastName, String email, String password, UserRole role) {
    }

    private record ProgramPlan(String key, String name, String pointsPerDollar, String minimumPurchaseAmount) {
    }

    private record RewardPlan(String key, String programKey, String name, String description,
            String requiredPoints, int stock) {
    }

    private record CustomerPlan(String firstName, String lastName, String email, String phone,
            List<PurchasePlan> purchases, List<String> redeemedRewardKeys) {
    }

    private record PurchasePlan(String programKey, String amount) {
    }

    // ── Execution ─────────────────────────────────────────────────────────────

    /** Runs a TenantPlan through the business services. */
    private static final class TenantSeeder {

        private final AppUserRepository appUserRepository;
        private final TenantRepository tenantRepository;
        private final CustomerRepository customerRepository;
        private final PasswordEncoder passwordEncoder;
        private final ProgramConfigService programConfigService;
        private final CustomerService customerService;
        private final RewardService rewardService;
        private final PurchaseTransactionService purchaseTransactionService;
        private final RedemptionService redemptionService;
        private final JdbcTemplate jdbcTemplate;

        private TenantSeeder(
                AppUserRepository appUserRepository,
                TenantRepository tenantRepository,
                CustomerRepository customerRepository,
                PasswordEncoder passwordEncoder,
                ProgramConfigService programConfigService,
                CustomerService customerService,
                RewardService rewardService,
                PurchaseTransactionService purchaseTransactionService,
                RedemptionService redemptionService,
                JdbcTemplate jdbcTemplate) {
            this.appUserRepository = appUserRepository;
            this.tenantRepository = tenantRepository;
            this.customerRepository = customerRepository;
            this.passwordEncoder = passwordEncoder;
            this.programConfigService = programConfigService;
            this.customerService = customerService;
            this.rewardService = rewardService;
            this.purchaseTransactionService = purchaseTransactionService;
            this.redemptionService = redemptionService;
            this.jdbcTemplate = jdbcTemplate;
        }

        void seed(TenantPlan plan) {
            Tenant tenant = new Tenant();
            tenant.setName(plan.name());
            tenant.setCode(plan.code());
            tenant.setActive(true);
            tenant = tenantRepository.save(tenant);

            for (UserPlan userPlan : plan.users()) {
                AppUser user = new AppUser();
                user.setFirstName(userPlan.firstName());
                user.setLastName(userPlan.lastName());
                user.setEmail(userPlan.email());
                user.setPasswordHash(passwordEncoder.encode(userPlan.password()));
                user.setRole(userPlan.role());
                user.setActive(true);
                user.setTenant(tenant);
                appUserRepository.save(user);
            }

            // Business rows are created as the tenant's users: the first user is the
            // ADMIN; purchases alternate with the STAFF user when there is one, so the
            // created_by audit column shows both.
            String adminEmail = plan.users().get(0).email();
            String operatorEmail = plan.users().get(plan.users().size() - 1).email();

            Map<String, Long> programIds = new HashMap<>();
            for (ProgramPlan programPlan : plan.programs()) {
                CreateProgramConfigRequest request = new CreateProgramConfigRequest();
                request.setProgramName(programPlan.name());
                request.setPointsPerDollar(new BigDecimal(programPlan.pointsPerDollar()));
                request.setMinimumPurchaseAmount(new BigDecimal(programPlan.minimumPurchaseAmount()));
                request.setActive(Boolean.TRUE);
                programIds.put(programPlan.key(), programConfigService.createProgramConfig(request, adminEmail).getId());
            }

            Map<String, Long> rewardIds = new HashMap<>();
            for (RewardPlan rewardPlan : plan.rewards()) {
                CreateRewardRequest request = new CreateRewardRequest();
                request.setName(rewardPlan.name());
                request.setDescription(rewardPlan.description());
                request.setRequiredPoints(new BigDecimal(rewardPlan.requiredPoints()));
                request.setStock(rewardPlan.stock());
                request.setProgramConfigId(programIds.get(rewardPlan.programKey()));
                rewardIds.put(rewardPlan.key(), rewardService.createReward(request, adminEmail).getId());
            }

            // Build the whole activity timeline first and replay it chronologically, so
            // ledger ids follow business dates and each redemption sees the balance
            // earned before it.
            LocalDateTime today = LocalDateTime.now().truncatedTo(ChronoUnit.DAYS);
            List<SeedEvent> events = new ArrayList<>();
            Map<String, Long> customerIdsByEmail = new HashMap<>();

            for (int ci = 0; ci < plan.customers().size(); ci++) {
                CustomerPlan customerPlan = plan.customers().get(ci);
                CreateCustomerRequest request = new CreateCustomerRequest();
                request.setFirstName(customerPlan.firstName());
                request.setLastName(customerPlan.lastName());
                request.setEmail(customerPlan.email());
                request.setPhone(customerPlan.phone());
                CustomerResponse created = customerService.createCustomer(request, operatorEmail);
                Long customerId = created.getId();
                customerIdsByEmail.put(customerPlan.email(), customerId);

                // Spread each customer's purchases evenly between its first purchase
                // (112-118 days ago) and its last one (12-31 days ago), so every month
                // of the 4-month window, including the current one, has activity.
                int purchaseCount = customerPlan.purchases().size();
                int firstDaysAgo = OLDEST_PURCHASE_DAYS_AGO - (ci % 7);
                int lastDaysAgo = NEWEST_PURCHASE_DAYS_AGO + (ci * 5) % 20;
                int spacing = purchaseCount > 1 ? (firstDaysAgo - lastDaysAgo) / (purchaseCount - 1) : 0;
                for (int j = 0; j < purchaseCount; j++) {
                    PurchasePlan purchase = customerPlan.purchases().get(j);
                    LocalDateTime date = today
                            .minusDays(firstDaysAgo - (long) j * spacing)
                            .plusHours(9 + (ci * 3 + j) % 10)
                            .plusMinutes((ci * 7 + j * 13) % 60);
                    String createdBy = j % 2 == 0 ? operatorEmail : adminEmail;
                    events.add(SeedEvent.purchase(date, customerId, programIds.get(purchase.programKey()),
                            new BigDecimal(purchase.amount()), describe(purchase.programKey(), j), createdBy));
                }

                for (int k = 0; k < customerPlan.redeemedRewardKeys().size(); k++) {
                    LocalDateTime date = today
                            .minusDays(REDEMPTION_WINDOW_DAYS - ((ci + k * 3) % REDEMPTION_WINDOW_DAYS))
                            .plusHours(11 + k)
                            .plusMinutes((ci * 11) % 60);
                    events.add(SeedEvent.redemption(date, customerId,
                            rewardIds.get(customerPlan.redeemedRewardKeys().get(k)), operatorEmail));
                }
            }

            events.sort(Comparator.comparing(SeedEvent::date));
            for (SeedEvent event : events) {
                event.apply(purchaseTransactionService, redemptionService);
            }

            for (String email : plan.customersToDeactivate()) {
                customerService.deactivateCustomer(customerIdsByEmail.get(email), adminEmail);
            }

            backdateSeededRows(tenant.getId());

            log.info("Seeded tenant '{}': {} customers, {} programs, {} rewards, {} activity events.",
                    plan.code(), plan.customers().size(), plan.programs().size(), plan.rewards().size(), events.size());
        }

        private static String describe(String programKey, int index) {
            if (programKey.equals("P2") || programKey.equals("N")) {
                return index % 2 == 0 ? "Consumo en cafetería" : "Pedido para llevar";
            }
            return index % 3 == 0 ? "Compra en tienda" : index % 3 == 1 ? "Compra en línea" : "Compra de temporada";
        }

        /**
         * Aligns audit timestamps with the (past) business dates of this tenant's
         * seeded rows. Timestamps only — amounts, points, balances and stock are left
         * exactly as the services produced them.
         */
        private void backdateSeededRows(Long tenantId) {
            // Push pending JPA inserts to the database before touching the same rows via JDBC.
            customerRepository.flush();

            jdbcTemplate.update(
                    "UPDATE purchase_transactions SET created_at = transaction_date WHERE tenant_id = ?", tenantId);
            jdbcTemplate.update(
                    "UPDATE redemptions SET created_at = redemption_date WHERE tenant_id = ?", tenantId);
            jdbcTemplate.update("""
                    UPDATE points_movements pm SET created_at = pt.transaction_date
                    FROM purchase_transactions pt
                    WHERE pm.tenant_id = ? AND pm.reference_type = 'PURCHASE_TRANSACTION' AND pm.reference_id = pt.id
                    """, tenantId);
            jdbcTemplate.update("""
                    UPDATE points_movements pm SET created_at = r.redemption_date
                    FROM redemptions r
                    WHERE pm.tenant_id = ? AND pm.reference_type = 'REDEMPTION' AND pm.reference_id = r.id
                    """, tenantId);
            // "Member since": one week before the customer's first purchase.
            jdbcTemplate.update("""
                    UPDATE customers c SET created_at = first_purchase.first_date - INTERVAL '7 days'
                    FROM (SELECT customer_id, MIN(transaction_date) AS first_date
                          FROM purchase_transactions WHERE tenant_id = ? GROUP BY customer_id) first_purchase
                    WHERE c.id = first_purchase.customer_id
                    """, tenantId);
            // Programs, rewards and the tenant itself existed before the first customer.
            jdbcTemplate.update(
                    "UPDATE program_config SET created_at = now() - INTERVAL '130 days' WHERE tenant_id = ?", tenantId);
            jdbcTemplate.update(
                    "UPDATE rewards SET created_at = now() - INTERVAL '130 days' WHERE tenant_id = ?", tenantId);
            jdbcTemplate.update(
                    "UPDATE tenants SET created_at = now() - INTERVAL '135 days' WHERE id = ?", tenantId);
        }
    }

    /** One purchase or redemption in the seeded timeline. */
    private record SeedEvent(
            LocalDateTime date, Long customerId, Long programConfigId, BigDecimal amount,
            String description, Long rewardId, String createdByEmail) {

        static SeedEvent purchase(LocalDateTime date, Long customerId, Long programConfigId,
                BigDecimal amount, String description, String createdByEmail) {
            return new SeedEvent(date, customerId, programConfigId, amount, description, null, createdByEmail);
        }

        static SeedEvent redemption(LocalDateTime date, Long customerId, Long rewardId, String createdByEmail) {
            return new SeedEvent(date, customerId, null, null, null, rewardId, createdByEmail);
        }

        void apply(PurchaseTransactionService purchaseTransactionService, RedemptionService redemptionService) {
            if (rewardId == null) {
                CreatePurchaseTransactionRequest request = new CreatePurchaseTransactionRequest();
                request.setCustomerId(customerId);
                request.setProgramConfigId(programConfigId);
                request.setAmount(amount);
                request.setDescription(description);
                request.setTransactionDate(date);
                purchaseTransactionService.createPurchaseTransaction(request, createdByEmail);
            } else {
                CreateRedemptionRequest request = new CreateRedemptionRequest();
                request.setCustomerId(customerId);
                request.setRewardId(rewardId);
                request.setRedemptionDate(date);
                request.setNotes("Canje en mostrador");
                redemptionService.createRedemption(request, createdByEmail);
            }
        }
    }
}
