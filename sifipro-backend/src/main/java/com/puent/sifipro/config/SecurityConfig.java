package com.puent.sifipro.config;

import com.puent.sifipro.auth.security.CustomUserDetailsService;
import com.puent.sifipro.auth.security.JwtAuthenticationFilter;
import com.puent.sifipro.auth.security.RestAccessDeniedHandler;
import com.puent.sifipro.auth.security.RestAuthenticationEntryPoint;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthenticationFilter;
        private final CustomUserDetailsService customUserDetailsService;
        private final RestAuthenticationEntryPoint restAuthenticationEntryPoint;
        private final RestAccessDeniedHandler restAccessDeniedHandler;

        public SecurityConfig(
                        JwtAuthenticationFilter jwtAuthenticationFilter,
                        CustomUserDetailsService customUserDetailsService,
                        RestAuthenticationEntryPoint restAuthenticationEntryPoint,
                        RestAccessDeniedHandler restAccessDeniedHandler) {
                this.jwtAuthenticationFilter = jwtAuthenticationFilter;
                this.customUserDetailsService = customUserDetailsService;
                this.restAuthenticationEntryPoint = restAuthenticationEntryPoint;
                this.restAccessDeniedHandler = restAccessDeniedHandler;
        }

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                .csrf(AbstractHttpConfigurer::disable)
                                .cors(Customizer.withDefaults())
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .exceptionHandling(ex -> ex
                                                .authenticationEntryPoint(restAuthenticationEntryPoint)
                                                .accessDeniedHandler(restAccessDeniedHandler))
                                .authenticationProvider(authenticationProvider())
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers(
                                                                "/api/auth/onboarding",
                                                                "/api/auth/login",
                                                                "/api/health",
                                                                "/v3/api-docs/**",
                                                                "/swagger-ui.html",
                                                                "/swagger-ui/**",
                                                                "/actuator/health",
                                                                "/actuator/info")
                                                .permitAll()
                                                .requestMatchers("/api/users/**", "/api/program-config/**")
                                                .hasRole("ADMIN")
                                                .requestMatchers(
                                                                "/api/customers/**",
                                                                "/api/rewards/**",
                                                                "/api/transactions/**",
                                                                "/api/redemptions/**",
                                                                "/api/reports/**")
                                                .hasAnyRole("ADMIN", "STAFF")
                                                .anyRequest().authenticated())
                                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        @Bean
        public AuthenticationProvider authenticationProvider() {
                DaoAuthenticationProvider provider = new DaoAuthenticationProvider(customUserDetailsService);
                provider.setPasswordEncoder(passwordEncoder());
                return provider;
        }

        @Bean
        public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
                return configuration.getAuthenticationManager();
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }
}