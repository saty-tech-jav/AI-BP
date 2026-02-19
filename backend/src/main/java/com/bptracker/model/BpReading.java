package com.bptracker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bp_readings")
public class BpReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Integer systolic;

    @Column(nullable = false)
    private Integer diastolic;

    private Integer pulse;
    private String notes;

    @Enumerated(EnumType.STRING)
    private ReadingType readingType = ReadingType.MANUAL;

    @Column(nullable = false)
    private LocalDateTime recordedAt;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (recordedAt == null) recordedAt = LocalDateTime.now();
    }

    public enum ReadingType { MANUAL, VOICE, TEXT }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Integer getSystolic() { return systolic; }
    public void setSystolic(Integer systolic) { this.systolic = systolic; }
    public Integer getDiastolic() { return diastolic; }
    public void setDiastolic(Integer diastolic) { this.diastolic = diastolic; }
    public Integer getPulse() { return pulse; }
    public void setPulse(Integer pulse) { this.pulse = pulse; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public ReadingType getReadingType() { return readingType; }
    public void setReadingType(ReadingType readingType) { this.readingType = readingType; }
    public LocalDateTime getRecordedAt() { return recordedAt; }
    public void setRecordedAt(LocalDateTime recordedAt) { this.recordedAt = recordedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}