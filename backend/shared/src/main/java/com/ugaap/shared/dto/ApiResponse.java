package com.ugaap.shared.dto;




// ApiResponse.java  — generic wrapper for all responses
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;


@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private String  message;
    private T       data;
    private LocalDateTime timestamp;

    public static <T> ApiResponse<T> ok(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.parse(LocalDateTime.now().toString()))
                .build();
    }

    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .data(null)
                .timestamp(LocalDateTime.parse(LocalDateTime.now().toString()))
                .build();
    }
}