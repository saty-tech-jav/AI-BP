package com.bptracker.dto;

import java.util.List;

public class ReadingDtos {

    public static class BpReadingRequest {
        private Integer systolic;
        private Integer diastolic;
        private Integer pulse;
        private String notes;
        private String recordedAt;
        private String readingType;

        public Integer getSystolic() { return systolic; }
        public void setSystolic(Integer systolic) { this.systolic = systolic; }
        public Integer getDiastolic() { return diastolic; }
        public void setDiastolic(Integer diastolic) { this.diastolic = diastolic; }
        public Integer getPulse() { return pulse; }
        public void setPulse(Integer pulse) { this.pulse = pulse; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
        public String getRecordedAt() { return recordedAt; }
        public void setRecordedAt(String recordedAt) { this.recordedAt = recordedAt; }
        public String getReadingType() { return readingType; }
        public void setReadingType(String readingType) { this.readingType = readingType; }
    }

    public static class BpReadingResponse {
        private Long id;
        private Integer systolic;
        private Integer diastolic;
        private Integer pulse;
        private String notes;
        private String recordedAt;
        private String readingType;
        private String category;

        public BpReadingResponse() {}
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Integer getSystolic() { return systolic; }
        public void setSystolic(Integer systolic) { this.systolic = systolic; }
        public Integer getDiastolic() { return diastolic; }
        public void setDiastolic(Integer diastolic) { this.diastolic = diastolic; }
        public Integer getPulse() { return pulse; }
        public void setPulse(Integer pulse) { this.pulse = pulse; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
        public String getRecordedAt() { return recordedAt; }
        public void setRecordedAt(String recordedAt) { this.recordedAt = recordedAt; }
        public String getReadingType() { return readingType; }
        public void setReadingType(String readingType) { this.readingType = readingType; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
    }

    public static class VoiceInputRequest {
        private String text;
        public String getText() { return text; }
        public void setText(String text) { this.text = text; }
    }

    public static class ParsedReadingResponse {
        private Integer systolic;
        private Integer diastolic;
        private Integer pulse;
        private String rawText;
        private boolean success;
        private String message;

        public ParsedReadingResponse() {}
        public Integer getSystolic() { return systolic; }
        public void setSystolic(Integer systolic) { this.systolic = systolic; }
        public Integer getDiastolic() { return diastolic; }
        public void setDiastolic(Integer diastolic) { this.diastolic = diastolic; }
        public Integer getPulse() { return pulse; }
        public void setPulse(Integer pulse) { this.pulse = pulse; }
        public String getRawText() { return rawText; }
        public void setRawText(String rawText) { this.rawText = rawText; }
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    public static class SummaryResponse {
        private double avgSystolic;
        private double avgDiastolic;
        private double avgPulse;
        private int maxSystolic, minSystolic;
        private int maxDiastolic, minDiastolic;
        private int maxPulse, minPulse;
        private String category;
        private String suggestion;
        private String trend;
        private int totalReadings;
        private String range;
        private List<String> alerts;

        public SummaryResponse() {}
        public double getAvgSystolic() { return avgSystolic; }
        public void setAvgSystolic(double v) { this.avgSystolic = v; }
        public double getAvgDiastolic() { return avgDiastolic; }
        public void setAvgDiastolic(double v) { this.avgDiastolic = v; }
        public double getAvgPulse() { return avgPulse; }
        public void setAvgPulse(double v) { this.avgPulse = v; }
        public int getMaxSystolic() { return maxSystolic; }
        public void setMaxSystolic(int v) { this.maxSystolic = v; }
        public int getMinSystolic() { return minSystolic; }
        public void setMinSystolic(int v) { this.minSystolic = v; }
        public int getMaxDiastolic() { return maxDiastolic; }
        public void setMaxDiastolic(int v) { this.maxDiastolic = v; }
        public int getMinDiastolic() { return minDiastolic; }
        public void setMinDiastolic(int v) { this.minDiastolic = v; }
        public int getMaxPulse() { return maxPulse; }
        public void setMaxPulse(int v) { this.maxPulse = v; }
        public int getMinPulse() { return minPulse; }
        public void setMinPulse(int v) { this.minPulse = v; }
        public String getCategory() { return category; }
        public void setCategory(String v) { this.category = v; }
        public String getSuggestion() { return suggestion; }
        public void setSuggestion(String v) { this.suggestion = v; }
        public String getTrend() { return trend; }
        public void setTrend(String v) { this.trend = v; }
        public int getTotalReadings() { return totalReadings; }
        public void setTotalReadings(int v) { this.totalReadings = v; }
        public String getRange() { return range; }
        public void setRange(String v) { this.range = v; }
        public List<String> getAlerts() { return alerts; }
        public void setAlerts(List<String> v) { this.alerts = v; }
    }

    public static class GraphPointResponse {
        private String timestamp;
        private int systolic;
        private int diastolic;
        private int pulse;
        private String category;
        private String timeLabel;

        public GraphPointResponse() {}
        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String v) { this.timestamp = v; }
        public int getSystolic() { return systolic; }
        public void setSystolic(int v) { this.systolic = v; }
        public int getDiastolic() { return diastolic; }
        public void setDiastolic(int v) { this.diastolic = v; }
        public int getPulse() { return pulse; }
        public void setPulse(int v) { this.pulse = v; }
        public String getCategory() { return category; }
        public void setCategory(String v) { this.category = v; }
        public String getTimeLabel() { return timeLabel; }
        public void setTimeLabel(String v) { this.timeLabel = v; }
    }
}