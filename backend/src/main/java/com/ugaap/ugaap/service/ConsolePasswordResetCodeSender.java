package com.ugaap.ugaap.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Temporary sender for local Postman testing.
 *
 * Replace this with a real email/SMS sender before production because it logs
 * the reset code.
 */
@Slf4j
@Service
public class ConsolePasswordResetCodeSender implements PasswordResetCodeSender {

    @Override
    public void sendPasswordResetCode(String email, String resetId, String plainCode) {
        log.warn("DEV PASSWORD RESET for email={} resetId={} code={}", email, resetId, plainCode);
    }
}
