package com.ugaap.shared.util;

import com.ugaap.shared.config.AppProperties;
import io.minio.*;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class MinioService {

    private final MinioClient minioClient;
    private final AppProperties appProperties;

    /**
     * Upload member profile photo.
     * Path: members/{tenantId}/{memberId}/profile.jpg
     * Returns the public URL.
     */
    public String uploadProfilePhoto(
            MultipartFile file,
            String tenantId,
            String memberId) {

        try {
            String bucket = appProperties.getMinio().getBucket();
            String objectName = "members/" + tenantId + "/" + memberId + "/profile.jpg";

            ensureBucketExists(bucket);

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectName)
                            .stream(file.getInputStream(),
                                    file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );

            // Return public URL
            String url = appProperties.getMinio().getEndpoint()
                    + "/" + bucket
                    + "/" + objectName;

            log.info("Profile photo uploaded: {}", url);
            return url;

        } catch (Exception e) {
            log.error("Failed to upload profile photo", e);
            throw new RuntimeException("Photo upload failed: " + e.getMessage());
        }
    }

    /**
     * Delete a file from MinIO.
     */
    public void deleteFile(String objectName) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(appProperties.getMinio().getBucket())
                            .object(objectName)
                            .build()
            );
            log.info("File deleted from MinIO: {}", objectName);
        } catch (Exception e) {
            log.error("Failed to delete file from MinIO", e);
        }
    }

    /**
     * Generate default avatar URL using ui-avatars.com
     */
    public String generateDefaultAvatar(String fullName) {
        String encodedName = fullName.replace(" ", "+");
        return "https://ui-avatars.com/api/?name=" + encodedName
                + "&size=256&background=2D6A4F&color=ffffff&bold=true";
    }

    // ── Helpers ───────────────────────────────────────────────

    private void ensureBucketExists(String bucket) throws Exception {
        boolean exists = minioClient.bucketExists(
                BucketExistsArgs.builder().bucket(bucket).build()
        );
        if (!exists) {
            minioClient.makeBucket(
                    MakeBucketArgs.builder().bucket(bucket).build()
            );
            log.info("Created MinIO bucket: {}", bucket);
        }
    }
}