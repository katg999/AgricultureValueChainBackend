package com.ugaap.ugaap.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Periodically removes expired password reset records from the database.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PasswordResetCleanupJob {

    private final PasswordResetService passwordResetService;

    /** Runs every hour. */
    @Scheduled(fixedRate = 60 * 60 * 1000)
    public void cleanupExpiredResetTokens() {
        long deleted = passwordResetService.cleanupExpiredResetTokens();

        if (deleted > 0) {
            log.info("Deleted {} expired password reset token(s)", deleted);
        }
    }
}
