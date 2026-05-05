package com.ugaap.ugaap.service;

import com.ugaap.ugaap.Exception.AuthException;
import com.ugaap.ugaap.Repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private static final String OTP_PREFIX = "otp:";
    private static final int OTP_EXPIRY_MINUTES = 5;
    private final StringRedisTemplate redisTemplate;
    private final ClientRepository clientRepository;
    private final PasswordEncoder passwordEncoder;

    public void generateAndSendOtp(String email) {
        // 1. Ensure user exists
        var client = clientRepository.findByEmail(email)
                .orElseThrow(() -> new AuthException("User not found"));

        // 2. Generate 6-digit OTP
        String otp = String.format("%06d", new SecureRandom().nextInt(999999));

        // 3. Store in Redis
        redisTemplate.opsForValue().set(
                OTP_PREFIX + email,
                otp,
                OTP_EXPIRY_MINUTES,
                TimeUnit.MINUTES
        );

        // 4. Send Email (Integration Placeholder)
        log.info("OTP for {}: {}", email, otp);
        // TODO: Call your EmailService.send(email, "Your OTP is: " + otp);
    }

    public void verifyAndResetPassword(String email, String otp, String newPassword) {
        String storedOtp = redisTemplate.opsForValue().get(OTP_PREFIX + email);

        if (storedOtp == null || !storedOtp.equals(otp)) {
            throw new AuthException("Invalid or expired OTP");
        }

        // OTP is valid, update password
        var client = clientRepository.findByEmail(email)
                .orElseThrow(() -> new AuthException("User not found"));

        client.setPasswordHash(passwordEncoder.encode(newPassword));
        clientRepository.save(client);

        // Remove OTP from Redis so it can't be reused
        redisTemplate.delete(OTP_PREFIX + email);

        log.info("Password successfully reset for user: {}", email);
    }
}