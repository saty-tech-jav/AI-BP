package com.bptracker.controller;

import com.bptracker.dto.ReadingDtos.*;
import com.bptracker.service.ReadingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/readings")
public class ReadingController {

    @Autowired
    private ReadingService readingService;

    // Save a manual reading
    @PostMapping
    public ResponseEntity<?> saveReading(@RequestBody BpReadingRequest request,
                                          @AuthenticationPrincipal UserDetails user) {
        try {
            BpReadingResponse response = readingService.saveReading(request, user.getUsername());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Parse voice/text input only (preview before saving)
    @PostMapping("/parse")
    public ResponseEntity<?> parseVoice(@RequestBody VoiceInputRequest request,
                                         @AuthenticationPrincipal UserDetails user) {
        ParsedReadingResponse parsed = readingService.parseVoiceText(request.getText());
        return ResponseEntity.ok(parsed);
    }

    // Parse and save from voice/text in one step
    @PostMapping("/voice-save")
    public ResponseEntity<?> saveFromVoice(@RequestBody VoiceInputRequest request,
                                            @AuthenticationPrincipal UserDetails user) {
        try {
            BpReadingResponse response = readingService.saveFromVoice(request, user.getUsername());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Get readings for a range (1d, 3d, 5d, 1w, 1m, all)
    @GetMapping
    public ResponseEntity<List<BpReadingResponse>> getReadings(
            @RequestParam(defaultValue = "7d") String range,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(readingService.getReadings(range, user.getUsername()));
    }

    // Get all readings
    @GetMapping("/all")
    public ResponseEntity<List<BpReadingResponse>> getAllReadings(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(readingService.getAllReadings(user.getUsername()));
    }

    // Get graph data
    @GetMapping("/graph")
    public ResponseEntity<List<GraphPointResponse>> getGraphData(
            @RequestParam(defaultValue = "7d") String range,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(readingService.getGraphData(range, user.getUsername()));
    }

    // Get summary + suggestions
    @GetMapping("/summary")
    public ResponseEntity<SummaryResponse> getSummary(
            @RequestParam(defaultValue = "7d") String range,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(readingService.getSummary(range, user.getUsername()));
    }

    // Delete a reading
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReading(@PathVariable Long id,
                                            @AuthenticationPrincipal UserDetails user) {
        boolean deleted = readingService.deleteReading(id, user.getUsername());
        if (deleted) return ResponseEntity.ok(Map.of("message", "Reading deleted"));
        return ResponseEntity.badRequest().body(Map.of("error", "Reading not found or unauthorized"));
    }
}
