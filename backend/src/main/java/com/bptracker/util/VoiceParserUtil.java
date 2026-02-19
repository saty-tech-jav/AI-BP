package com.bptracker.util;

import com.bptracker.dto.ReadingDtos.ParsedReadingResponse;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class VoiceParserUtil {

    private static final Map<String, Integer> WORD_MAP = new HashMap<>();

    static {
        WORD_MAP.put("zero", 0); WORD_MAP.put("one", 1); WORD_MAP.put("two", 2);
        WORD_MAP.put("three", 3); WORD_MAP.put("four", 4); WORD_MAP.put("five", 5);
        WORD_MAP.put("six", 6); WORD_MAP.put("seven", 7); WORD_MAP.put("eight", 8);
        WORD_MAP.put("nine", 9); WORD_MAP.put("ten", 10); WORD_MAP.put("eleven", 11);
        WORD_MAP.put("twelve", 12); WORD_MAP.put("thirteen", 13); WORD_MAP.put("fourteen", 14);
        WORD_MAP.put("fifteen", 15); WORD_MAP.put("sixteen", 16); WORD_MAP.put("seventeen", 17);
        WORD_MAP.put("eighteen", 18); WORD_MAP.put("nineteen", 19); WORD_MAP.put("twenty", 20);
        WORD_MAP.put("thirty", 30); WORD_MAP.put("forty", 40); WORD_MAP.put("fifty", 50);
        WORD_MAP.put("sixty", 60); WORD_MAP.put("seventy", 70); WORD_MAP.put("eighty", 80);
        WORD_MAP.put("ninety", 90); WORD_MAP.put("hundred", 100);
    }

    public ParsedReadingResponse parse(String rawText) {
        ParsedReadingResponse response = new ParsedReadingResponse();
        response.setRawText(rawText);

        if (rawText == null || rawText.trim().isEmpty()) {
            response.setSuccess(false);
            response.setMessage("No input provided");
            return response;
        }

        // Convert words to numbers first
        String normalized = convertWordsToDigits(rawText.toLowerCase().trim());

        try {
            Integer systolic = extractSystolic(normalized);
            Integer diastolic = extractDiastolic(normalized);
            Integer pulse = extractPulse(normalized);

            if (systolic == null || diastolic == null) {
                response.setSuccess(false);
                response.setMessage("Could not find BP values. Try saying: '120 over 80 pulse 72'");
                return response;
            }

            if (systolic < 60 || systolic > 250 || diastolic < 40 || diastolic > 150) {
                response.setSuccess(false);
                response.setMessage("BP values seem out of range. Please check: systolic=" + systolic + ", diastolic=" + diastolic);
                return response;
            }

            response.setSystolic(systolic);
            response.setDiastolic(diastolic);
            response.setPulse(pulse);
            response.setSuccess(true);
            response.setMessage("Successfully parsed: " + systolic + "/" + diastolic + (pulse != null ? " pulse " + pulse : ""));

        } catch (Exception e) {
            response.setSuccess(false);
            response.setMessage("Parse error: " + e.getMessage());
        }

        return response;
    }

    private Integer extractSystolic(String text) {
        // Pattern: 120 over 80, 120/80, 120 by 80
        Pattern p1 = Pattern.compile("(\\d{2,3})\\s*(?:over|by|/)\\s*(\\d{2,3})");
        Matcher m1 = p1.matcher(text);
        if (m1.find()) return Integer.parseInt(m1.group(1));

        // Pattern: systolic 120 or systolic is 120
        Pattern p2 = Pattern.compile("systolic\\s+(?:is\\s+)?(\\d{2,3})");
        Matcher m2 = p2.matcher(text);
        if (m2.find()) return Integer.parseInt(m2.group(1));

        return null;
    }

    private Integer extractDiastolic(String text) {
        // Pattern: 120 over 80, 120/80
        Pattern p1 = Pattern.compile("(\\d{2,3})\\s*(?:over|by|/)\\s*(\\d{2,3})");
        Matcher m1 = p1.matcher(text);
        if (m1.find()) return Integer.parseInt(m1.group(2));

        // Pattern: diastolic 80
        Pattern p2 = Pattern.compile("diastolic\\s+(?:is\\s+)?(\\d{2,3})");
        Matcher m2 = p2.matcher(text);
        if (m2.find()) return Integer.parseInt(m2.group(1));

        return null;
    }

    private Integer extractPulse(String text) {
        // Pattern: pulse 72, heart rate 72, pulse rate 72
        Pattern p1 = Pattern.compile("(?:pulse|heart rate|pulse rate|hr)\\s+(?:is\\s+)?(\\d{2,3})");
        Matcher m1 = p1.matcher(text);
        if (m1.find()) return Integer.parseInt(m1.group(1));

        // Trailing number after BP: 120/80 72 OR 120 over 80 72
        Pattern p2 = Pattern.compile("(\\d{2,3})\\s*(?:over|by|/)\\s*(\\d{2,3})\\s+(\\d{2,3})");
        Matcher m2 = p2.matcher(text);
        if (m2.find()) return Integer.parseInt(m2.group(3));

        return null;
    }

    public String convertWordsToDigits(String text) {
        String[] words = text.split("\\s+");
        StringBuilder result = new StringBuilder();
        int accumulated = 0;
        boolean inNumber = false;

        for (String word : words) {
            String clean = word.replaceAll("[^a-z]", "");
            if (WORD_MAP.containsKey(clean)) {
                int val = WORD_MAP.get(clean);
                if (val == 100) {
                    accumulated = accumulated == 0 ? 100 : accumulated * 100;
                } else {
                    accumulated += val;
                }
                inNumber = true;
            } else {
                if (inNumber) {
                    result.append(accumulated).append(" ");
                    accumulated = 0;
                    inNumber = false;
                }
                result.append(word).append(" ");
            }
        }
        if (inNumber) result.append(accumulated);

        return result.toString().trim();
    }
}
