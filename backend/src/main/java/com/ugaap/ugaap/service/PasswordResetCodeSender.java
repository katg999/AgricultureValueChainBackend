package com.ugaap.ugaap.service;

/**
 * Sends password reset instructions to the client.
 *
 * Keep this as an interface so the reset logic does not depend on one
 * email/SMS provider.
 */
public interface PasswordResetCodeSender {

    /**
     * Sends the reset id and secret code to the client.
     */
    void sendPasswordResetCode(String email, String resetId, String plainCode);
}
