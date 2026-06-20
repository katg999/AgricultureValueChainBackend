package com.ugaap.ugaap.CollectionService.Service;

import com.ugaap.ugaap.CollectionService.DTO.SessionConfigDTO;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SessionConfigService {

    // In-memory store per cooperative — replace with DB persistence later
    private final Map<String, List<SessionConfigDTO>> store = new ConcurrentHashMap<>();

    private List<SessionConfigDTO> defaults() {
        SessionConfigDTO morning = new SessionConfigDTO();
        morning.setId("morning"); morning.setLabel("Morning");
        morning.setStartHour(6); morning.setEndHour(9);

        SessionConfigDTO midday = new SessionConfigDTO();
        midday.setId("midday"); midday.setLabel("Midday");
        midday.setStartHour(11); midday.setEndHour(14);

        SessionConfigDTO afternoon = new SessionConfigDTO();
        afternoon.setId("afternoon"); afternoon.setLabel("Afternoon");
        afternoon.setStartHour(15); afternoon.setEndHour(18);

        return List.of(morning, midday, afternoon);
    }

    public List<SessionConfigDTO> getSessionConfig(String cooperativeId) {
        return store.getOrDefault(cooperativeId != null ? cooperativeId : "default", defaults());
    }

    public void updateSessionConfig(String cooperativeId, List<SessionConfigDTO> windows) {
        store.put(cooperativeId != null ? cooperativeId : "default", windows);
    }
}