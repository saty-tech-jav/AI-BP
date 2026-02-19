package com.bptracker.service;

import com.bptracker.dto.ReadingDtos.*;
import com.bptracker.model.BpReading;
import com.bptracker.model.User;
import com.bptracker.repository.BpReadingRepository;
import com.bptracker.repository.UserRepository;
import com.bptracker.util.VoiceParserUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReadingService {

    @Autowired private BpReadingRepository readingRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private VoiceParserUtil voiceParser;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final DateTimeFormatter TIME_LABEL = DateTimeFormatter.ofPattern("MMM dd, HH:mm");

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    public BpReadingResponse saveReading(BpReadingRequest request, String username) {
        User user = getUser(username);

        BpReading reading = new BpReading();
        reading.setUser(user);
        reading.setSystolic(request.getSystolic());
        reading.setDiastolic(request.getDiastolic());
        reading.setPulse(request.getPulse());
        reading.setNotes(request.getNotes());

        if (request.getRecordedAt() != null && !request.getRecordedAt().isEmpty()) {
            try {
                reading.setRecordedAt(LocalDateTime.parse(request.getRecordedAt(),
                        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")));
            } catch (Exception e) {
                reading.setRecordedAt(LocalDateTime.now());
            }
        } else {
            reading.setRecordedAt(LocalDateTime.now());
        }

        if (request.getReadingType() != null) {
            try {
                reading.setReadingType(BpReading.ReadingType.valueOf(request.getReadingType()));
            } catch (Exception e) {
                reading.setReadingType(BpReading.ReadingType.MANUAL);
            }
        }

        BpReading saved = readingRepository.save(reading);
        return toResponse(saved);
    }

    public ParsedReadingResponse parseVoiceText(String text) {
        return voiceParser.parse(text);
    }

    public BpReadingResponse saveFromVoice(VoiceInputRequest request, String username) {
        ParsedReadingResponse parsed = voiceParser.parse(request.getText());
        if (!parsed.isSuccess()) {
            throw new RuntimeException(parsed.getMessage());
        }

        BpReadingRequest readingRequest = new BpReadingRequest();
        readingRequest.setSystolic(parsed.getSystolic());
        readingRequest.setDiastolic(parsed.getDiastolic());
        readingRequest.setPulse(parsed.getPulse());
        readingRequest.setNotes("Voice: " + request.getText());
        readingRequest.setReadingType("VOICE");

        return saveReading(readingRequest, username);
    }

    public List<BpReadingResponse> getReadings(String range, String username) {
        User user = getUser(username);
        LocalDateTime since = parseSince(range);
        List<BpReading> readings = readingRepository.findByUserSince(user, since);
        return readings.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<BpReadingResponse> getAllReadings(String username) {
        User user = getUser(username);
        return readingRepository.findByUserOrderByRecordedAtDesc(user)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<GraphPointResponse> getGraphData(String range, String username) {
        User user = getUser(username);
        LocalDateTime since = parseSince(range);
        List<BpReading> readings = readingRepository.findByUserSince(user, since);

        return readings.stream().map(r -> {
            GraphPointResponse gp = new GraphPointResponse();
            gp.setTimestamp(r.getRecordedAt().format(FORMATTER));
            gp.setTimeLabel(r.getRecordedAt().format(TIME_LABEL));
            gp.setSystolic(r.getSystolic());
            gp.setDiastolic(r.getDiastolic());
            gp.setPulse(r.getPulse() != null ? r.getPulse() : 0);
            gp.setCategory(classifyBP(r.getSystolic(), r.getDiastolic()));
            return gp;
        }).collect(Collectors.toList());
    }

    public SummaryResponse getSummary(String range, String username) {
        User user = getUser(username);
        LocalDateTime since = parseSince(range);
        List<BpReading> readings = readingRepository.findByUserSince(user, since);

        if (readings.isEmpty()) {
            SummaryResponse empty = new SummaryResponse();
            empty.setRange(range);
            empty.setTotalReadings(0);
            empty.setCategory("No Data");
            empty.setSuggestion("No readings found for this period. Start logging your BP!");
            empty.setAlerts(new ArrayList<>());
            return empty;
        }

        double avgSys = readings.stream().mapToInt(BpReading::getSystolic).average().orElse(0);
        double avgDia = readings.stream().mapToInt(BpReading::getDiastolic).average().orElse(0);
        double avgPulse = readings.stream()
                .filter(r -> r.getPulse() != null)
                .mapToInt(BpReading::getPulse).average().orElse(0);

        int maxSys = readings.stream().mapToInt(BpReading::getSystolic).max().orElse(0);
        int minSys = readings.stream().mapToInt(BpReading::getSystolic).min().orElse(0);
        int maxDia = readings.stream().mapToInt(BpReading::getDiastolic).max().orElse(0);
        int minDia = readings.stream().mapToInt(BpReading::getDiastolic).min().orElse(0);
        int maxPulse = readings.stream().filter(r -> r.getPulse() != null).mapToInt(BpReading::getPulse).max().orElse(0);
        int minPulse = readings.stream().filter(r -> r.getPulse() != null).mapToInt(BpReading::getPulse).min().orElse(0);

        String category = classifyBP(avgSys, avgDia);
        String suggestion = generateSuggestion(category, avgPulse, avgSys, avgDia);
        String trend = calculateTrend(readings);
        List<String> alerts = generateAlerts(readings, avgPulse);

        SummaryResponse summary = new SummaryResponse();
        summary.setAvgSystolic(Math.round(avgSys * 10.0) / 10.0);
        summary.setAvgDiastolic(Math.round(avgDia * 10.0) / 10.0);
        summary.setAvgPulse(Math.round(avgPulse * 10.0) / 10.0);
        summary.setMaxSystolic(maxSys);
        summary.setMinSystolic(minSys);
        summary.setMaxDiastolic(maxDia);
        summary.setMinDiastolic(minDia);
        summary.setMaxPulse(maxPulse);
        summary.setMinPulse(minPulse);
        summary.setCategory(category);
        summary.setSuggestion(suggestion);
        summary.setTrend(trend);
        summary.setTotalReadings(readings.size());
        summary.setRange(range);
        summary.setAlerts(alerts);

        return summary;
    }

    public boolean deleteReading(Long id, String username) {
        User user = getUser(username);
        Optional<BpReading> reading = readingRepository.findById(id);
        if (reading.isPresent() && reading.get().getUser().getId().equals(user.getId())) {
            readingRepository.deleteById(id);
            return true;
        }
        return false;
    }

    // ===== HELPER METHODS =====

    private LocalDateTime parseSince(String range) {
        return switch (range != null ? range.toLowerCase() : "7d") {
            case "1d" -> LocalDateTime.now().minusDays(1);
            case "3d" -> LocalDateTime.now().minusDays(3);
            case "5d" -> LocalDateTime.now().minusDays(5);
            case "1w", "7d" -> LocalDateTime.now().minusWeeks(1);
            case "2w" -> LocalDateTime.now().minusWeeks(2);
            case "1m" -> LocalDateTime.now().minusMonths(1);
            case "3m" -> LocalDateTime.now().minusMonths(3);
            case "all" -> LocalDateTime.now().minusYears(10);
            default -> LocalDateTime.now().minusWeeks(1);
        };
    }

    public String classifyBP(double sys, double dia) {
        if (sys > 180 || dia > 120) return "Hypertensive Crisis";
        if (sys >= 140 || dia >= 90) return "High BP Stage 2";
        if (sys >= 130 || dia >= 80) return "High BP Stage 1";
        if (sys >= 120 && dia < 80) return "Elevated";
        if (sys < 120 && dia < 80) return "Normal";
        return "Unknown";
    }

    private String generateSuggestion(String category, double pulse, double sys, double dia) {
        return switch (category) {
            case "Normal" -> "Excellent! Your blood pressure is in the optimal range. Keep up your healthy lifestyle with regular exercise and balanced diet.";
            case "Elevated" -> "Your BP is slightly elevated. Consider reducing sodium intake, staying hydrated, and monitoring more frequently. Lifestyle changes can help bring it to normal.";
            case "High BP Stage 1" -> "Your blood pressure is in Stage 1 Hypertension range. It is recommended to consult your doctor. Consider the DASH diet, regular aerobic exercise, and stress reduction techniques.";
            case "High BP Stage 2" -> "Your blood pressure is in Stage 2 Hypertension range. Please consult your doctor promptly. Medication may be required alongside lifestyle modifications.";
            case "Hypertensive Crisis" -> "URGENT: Your blood pressure readings indicate a hypertensive crisis. Seek immediate medical attention if you experience symptoms like chest pain, shortness of breath, or severe headache.";
            default -> "Please continue logging readings for better analysis.";
        };
    }

    private String calculateTrend(List<BpReading> readings) {
        if (readings.size() < 3) return "Insufficient data";

        int half = readings.size() / 2;
        double firstHalfAvg = readings.subList(0, half).stream()
                .mapToInt(BpReading::getSystolic).average().orElse(0);
        double secondHalfAvg = readings.subList(half, readings.size()).stream()
                .mapToInt(BpReading::getSystolic).average().orElse(0);

        double diff = secondHalfAvg - firstHalfAvg;
        if (diff > 5) return "Increasing ↑";
        if (diff < -5) return "Decreasing ↓";
        return "Stable →";
    }

    private List<String> generateAlerts(List<BpReading> readings, double avgPulse) {
        List<String> alerts = new ArrayList<>();

        long highReadings = readings.stream()
                .filter(r -> r.getSystolic() >= 140 || r.getDiastolic() >= 90).count();
        if (highReadings > 0) {
            alerts.add(highReadings + " reading(s) in hypertensive range detected");
        }

        long crisisReadings = readings.stream()
                .filter(r -> r.getSystolic() > 180 || r.getDiastolic() > 120).count();
        if (crisisReadings > 0) {
            alerts.add("⚠️ " + crisisReadings + " reading(s) in hypertensive crisis range!");
        }

        if (avgPulse > 100) {
            alerts.add("Average heart rate is elevated (" + Math.round(avgPulse) + " bpm)");
        } else if (avgPulse > 0 && avgPulse < 50) {
            alerts.add("Average heart rate is low (" + Math.round(avgPulse) + " bpm)");
        }

        return alerts;
    }

    private BpReadingResponse toResponse(BpReading r) {
        BpReadingResponse res = new BpReadingResponse();
        res.setId(r.getId());
        res.setSystolic(r.getSystolic());
        res.setDiastolic(r.getDiastolic());
        res.setPulse(r.getPulse());
        res.setNotes(r.getNotes());
        res.setRecordedAt(r.getRecordedAt().format(FORMATTER));
        res.setReadingType(r.getReadingType() != null ? r.getReadingType().name() : "MANUAL");
        res.setCategory(classifyBP(r.getSystolic(), r.getDiastolic()));
        return res;
    }
}
