package com.puent.sifipro.config;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.puent.sifipro.customer.dto.CreateCustomerRequest;
import com.puent.sifipro.customer.dto.CustomerResponse;
import com.puent.sifipro.customer.repository.CustomerRepository;
import com.puent.sifipro.customer.service.CustomerService;
import com.puent.sifipro.loyalty.dto.CreateProgramConfigRequest;
import com.puent.sifipro.loyalty.dto.ProgramConfigResponse;
import com.puent.sifipro.loyalty.repository.ProgramConfigRepository;
import com.puent.sifipro.loyalty.service.ProgramConfigService;
import com.puent.sifipro.redemption.dto.CreateRedemptionRequest;
import com.puent.sifipro.redemption.repository.RedemptionRepository;
import com.puent.sifipro.redemption.service.RedemptionService;
import com.puent.sifipro.reward.dto.CreateRewardRequest;
import com.puent.sifipro.reward.dto.RewardResponse;
import com.puent.sifipro.reward.repository.RewardRepository;
import com.puent.sifipro.reward.service.RewardService;
import com.puent.sifipro.tenant.entity.Tenant;
import com.puent.sifipro.tenant.repository.TenantRepository;
import com.puent.sifipro.transaction.dto.CreatePurchaseTransactionRequest;
import com.puent.sifipro.transaction.repository.PurchaseTransactionRepository;
import com.puent.sifipro.transaction.service.PurchaseTransactionService;
import com.puent.sifipro.user.entity.AppUser;
import com.puent.sifipro.user.entity.UserRole;
import com.puent.sifipro.user.repository.AppUserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@Profile("dev")
public class DevDataSeederConfig {

        @Bean
        public CommandLineRunner seedDevData(
                        ProgramConfigRepository programConfigRepository,
                        CustomerRepository customerRepository,
                        RewardRepository rewardRepository,
                        PurchaseTransactionRepository purchaseTransactionRepository,
                        RedemptionRepository redemptionRepository,
                        AppUserRepository appUserRepository,
                        TenantRepository tenantRepository,
                        PasswordEncoder passwordEncoder,
                        ProgramConfigService programConfigService,
                        CustomerService customerService,
                        RewardService rewardService,
                        PurchaseTransactionService purchaseTransactionService,
                        RedemptionService redemptionService) {
                return args -> {
                        // Crea el operador de plataforma semilla si no existe. Independiente del
                        // resto del seeding de abajo (que es tenant-scoped): sin este paso, cada
                        // reset del volumen dev obliga a insertarlo a mano con SQL directo, que es
                        // exactamente lo que se busca evitar.
                        seedPlatformAdminIfMissing(appUserRepository, passwordEncoder);

                        // Crea tenant + usuarios demo si no existen, y devuelve el email del admin
                        String seedUserEmail = resolveOrCreateSeedUser(
                                        appUserRepository, tenantRepository, passwordEncoder);

                        if (seedUserEmail == null) {
                                return;
                        }

                        // Si ya hay datos de programa/clientes/recompensas, no seedear de nuevo
                        if (shouldSkipSeeding(
                                        programConfigRepository,
                                        customerRepository,
                                        rewardRepository,
                                        purchaseTransactionRepository,
                                        redemptionRepository)) {
                                return;
                        }

                        ProgramConfigResponse programConfig = seedProgramConfig(programConfigService, seedUserEmail);

                        CustomerResponse customerOne = seedCustomer(
                                        customerService, seedUserEmail,
                                        "Laura", "Mendoza",
                                        "laura.mendoza@sifipro.dev", "+503-7100-1001");
                        CustomerResponse customerTwo = seedCustomer(
                                        customerService, seedUserEmail,
                                        "Andres", "Lopez",
                                        "andres.lopez@sifipro.dev", "+503-7100-1002");
                        CustomerResponse customerThree = seedCustomer(
                                        customerService, seedUserEmail,
                                        "Sara", "Castillo",
                                        "sara.castillo@sifipro.dev", "+503-7100-1003");

                        RewardResponse rewardOne = seedReward(
                                        rewardService, seedUserEmail, programConfig.getId(),
                                        "15% Descuento en tienda",
                                        "Aplica un 15% de descuento en tu próxima compra.",
                                        new BigDecimal("120.0000"), 20, null);
                        seedReward(
                                        rewardService, seedUserEmail, programConfig.getId(),
                                        "Café Premium Gratis",
                                        "Canjea un café de especialidad en cualquier sucursal.",
                                        new BigDecimal("90.0000"), 15, null);
                        seedReward(
                                        rewardService, seedUserEmail, programConfig.getId(),
                                        "Caja de Bienvenida",
                                        "Kit exclusivo de temporada con productos seleccionados.",
                                        new BigDecimal("220.0000"), 8, null);

                        LocalDateTime now = LocalDateTime.now();
                        seedPurchaseTransaction(purchaseTransactionService, seedUserEmail,
                                        programConfig.getId(), customerOne.getId(),
                                        new BigDecimal("200.00"), "Compra inicial en tienda",
                                        now.minusDays(6));
                        seedPurchaseTransaction(purchaseTransactionService, seedUserEmail,
                                        programConfig.getId(), customerOne.getId(),
                                        new BigDecimal("80.00"), "Compra de seguimiento",
                                        now.minusDays(5));
                        seedPurchaseTransaction(purchaseTransactionService, seedUserEmail,
                                        programConfig.getId(), customerTwo.getId(),
                                        new BigDecimal("150.00"), "Compra en línea",
                                        now.minusDays(4));
                        seedPurchaseTransaction(purchaseTransactionService, seedUserEmail,
                                        programConfig.getId(), customerThree.getId(),
                                        new BigDecimal("30.00"), "Compra pequeña",
                                        now.minusDays(3));
                        seedPurchaseTransaction(purchaseTransactionService, seedUserEmail,
                                        programConfig.getId(), customerTwo.getId(),
                                        new BigDecimal("18.00"), "Compra bajo el mínimo",
                                        now.minusDays(2));

                        seedRedemption(redemptionService, seedUserEmail,
                                        customerOne.getId(), rewardOne.getId(),
                                        now.minusDays(1), "Canje demo para presentación");
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

        /**
         * Busca un usuario activo con tenant. Si no existe, crea el tenant demo
         * con usuarios ADMIN y STAFF, y devuelve el email del admin.
         */
        private String resolveOrCreateSeedUser(
                        AppUserRepository appUserRepository,
                        TenantRepository tenantRepository,
                        PasswordEncoder passwordEncoder) {

                // Buscar usuario existente activo con tenant
                String existing = appUserRepository.findAll()
                                .stream()
                                .filter(u -> Boolean.TRUE.equals(u.getActive()))
                                .filter(u -> u.getTenant() != null)
                                .map(AppUser::getEmail)
                                .findFirst()
                                .orElse(null);

                if (existing != null) {
                        return existing;
                }

                // No hay usuarios → crear tenant y usuarios demo
                Tenant tenant = new Tenant();
                tenant.setName("Demo Tenant");
                tenant.setCode("demo");
                tenant.setActive(true);
                tenant = tenantRepository.save(tenant);

                // Admin
                AppUser admin = new AppUser();
                admin.setEmail("admin@sifipro.com");
                admin.setPasswordHash(passwordEncoder.encode("Admin123!"));
                admin.setFirstName("Carlos");
                admin.setLastName("Puente");
                admin.setRole(UserRole.ADMIN);
                admin.setActive(true);
                admin.setTenant(tenant);
                appUserRepository.save(admin);

                // Staff
                AppUser staff = new AppUser();
                staff.setEmail("staff@sifipro.com");
                staff.setPasswordHash(passwordEncoder.encode("Staff123!"));
                staff.setFirstName("Ana");
                staff.setLastName("Lopez");
                staff.setRole(UserRole.STAFF);
                staff.setActive(true);
                staff.setTenant(tenant);
                appUserRepository.save(staff);

                return admin.getEmail();
        }

        private boolean shouldSkipSeeding(
                        ProgramConfigRepository programConfigRepository,
                        CustomerRepository customerRepository,
                        RewardRepository rewardRepository,
                        PurchaseTransactionRepository purchaseTransactionRepository,
                        RedemptionRepository redemptionRepository) {
                return programConfigRepository.count() > 0
                                || customerRepository.count() > 0
                                || rewardRepository.count() > 0
                                || purchaseTransactionRepository.count() > 0
                                || redemptionRepository.count() > 0;
        }

        private ProgramConfigResponse seedProgramConfig(
                        ProgramConfigService programConfigService, String currentUserEmail) {
                CreateProgramConfigRequest request = new CreateProgramConfigRequest();
                request.setProgramName("SIFIPRO MVP Program");
                request.setPointsPerDollar(new BigDecimal("1.5000"));
                request.setMinimumPurchaseAmount(new BigDecimal("25.00"));
                request.setActive(Boolean.TRUE);
                return programConfigService.createProgramConfig(request, currentUserEmail);
        }

        private CustomerResponse seedCustomer(
                        CustomerService customerService, String currentUserEmail,
                        String firstName, String lastName, String email, String phone) {
                CreateCustomerRequest request = new CreateCustomerRequest();
                request.setFirstName(firstName);
                request.setLastName(lastName);
                request.setEmail(email);
                request.setPhone(phone);
                return customerService.createCustomer(request, currentUserEmail);
        }

        private RewardResponse seedReward(
                        RewardService rewardService, String currentUserEmail, Long programConfigId,
                        String name, String description,
                        BigDecimal requiredPoints, Integer stock, String imageUrl) {
                CreateRewardRequest request = new CreateRewardRequest();
                request.setName(name);
                request.setDescription(description);
                request.setRequiredPoints(requiredPoints);
                request.setStock(stock);
                request.setProgramConfigId(programConfigId);
                request.setImageUrl(imageUrl);
                return rewardService.createReward(request, currentUserEmail);
        }

        private void seedPurchaseTransaction(
                        PurchaseTransactionService purchaseTransactionService,
                        String currentUserEmail, Long programConfigId, Long customerId,
                        BigDecimal amount, String description, LocalDateTime transactionDate) {
                CreatePurchaseTransactionRequest request = new CreatePurchaseTransactionRequest();
                request.setCustomerId(customerId);
                request.setProgramConfigId(programConfigId);
                request.setAmount(amount);
                request.setDescription(description);
                request.setTransactionDate(transactionDate);
                purchaseTransactionService.createPurchaseTransaction(request, currentUserEmail);
        }

        private void seedRedemption(
                        RedemptionService redemptionService, String currentUserEmail,
                        Long customerId, Long rewardId,
                        LocalDateTime redemptionDate, String notes) {
                CreateRedemptionRequest request = new CreateRedemptionRequest();
                request.setCustomerId(customerId);
                request.setRewardId(rewardId);
                request.setRedemptionDate(redemptionDate);
                request.setNotes(notes);
                redemptionService.createRedemption(request, currentUserEmail);
        }
}
