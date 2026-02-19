-- ============================================
-- BP TRACKER - MySQL Database Schema
-- Run this ONCE before starting the application
-- ============================================

-- Create the database
CREATE DATABASE IF NOT EXISTS bp_tracker
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bp_tracker;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    full_name   VARCHAR(100),
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_username (username),
    INDEX idx_email    (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BP READINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bp_readings (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT       NOT NULL,
    systolic      INT          NOT NULL COMMENT 'Upper BP value (mmHg)',
    diastolic     INT          NOT NULL COMMENT 'Lower BP value (mmHg)',
    pulse         INT          COMMENT 'Heart rate (bpm)',
    notes         VARCHAR(500) COMMENT 'Optional notes',
    reading_type  ENUM('MANUAL','VOICE','TEXT') DEFAULT 'MANUAL',
    recorded_at   DATETIME     NOT NULL COMMENT 'When the reading was taken',
    created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_user_id    (user_id),
    INDEX idx_recorded   (user_id, recorded_at DESC),
    INDEX idx_range      (user_id, recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SAMPLE DATA (optional - remove if not needed)
-- ============================================
-- Password for demo user is: demo123
INSERT IGNORE INTO users (username, email, password, full_name)
VALUES (
    'demo',
    'demo@bptracker.com',
    '$2a$10$NuyFWUaRtVNT4eDjpSUt8.VZr6m.8VDjlFdEHp8vJbQf2d5m8Q4Wy',
    'Demo User'
);

-- Some sample readings for the demo user (last 7 days)
INSERT IGNORE INTO bp_readings (user_id, systolic, diastolic, pulse, notes, reading_type, recorded_at)
SELECT u.id, 122, 78, 72, 'Morning reading', 'MANUAL', DATE_SUB(NOW(), INTERVAL 6 DAY)
FROM users u WHERE u.username = 'demo';

INSERT IGNORE INTO bp_readings (user_id, systolic, diastolic, pulse, notes, reading_type, recorded_at)
SELECT u.id, 135, 85, 78, 'After work, slightly stressed', 'MANUAL', DATE_SUB(NOW(), INTERVAL 5 DAY)
FROM users u WHERE u.username = 'demo';

INSERT IGNORE INTO bp_readings (user_id, systolic, diastolic, pulse, notes, reading_type, recorded_at)
SELECT u.id, 118, 76, 68, 'Morning, after walk', 'VOICE', DATE_SUB(NOW(), INTERVAL 4 DAY)
FROM users u WHERE u.username = 'demo';

INSERT IGNORE INTO bp_readings (user_id, systolic, diastolic, pulse, notes, reading_type, recorded_at)
SELECT u.id, 128, 82, 74, 'Afternoon', 'TEXT', DATE_SUB(NOW(), INTERVAL 3 DAY)
FROM users u WHERE u.username = 'demo';

INSERT IGNORE INTO bp_readings (user_id, systolic, diastolic, pulse, notes, reading_type, recorded_at)
SELECT u.id, 115, 74, 66, 'Evening, after meditation', 'MANUAL', DATE_SUB(NOW(), INTERVAL 2 DAY)
FROM users u WHERE u.username = 'demo';

INSERT IGNORE INTO bp_readings (user_id, systolic, diastolic, pulse, notes, reading_type, recorded_at)
SELECT u.id, 120, 80, 70, 'Morning', 'MANUAL', DATE_SUB(NOW(), INTERVAL 1 DAY)
FROM users u WHERE u.username = 'demo';

INSERT IGNORE INTO bp_readings (user_id, systolic, diastolic, pulse, notes, reading_type, recorded_at)
SELECT u.id, 117, 77, 69, 'Today morning', 'MANUAL', NOW()
FROM users u WHERE u.username = 'demo';

-- ============================================
-- VERIFY
-- ============================================
SELECT 'Database setup complete!' AS status;
SELECT COUNT(*) AS user_count FROM users;
SELECT COUNT(*) AS reading_count FROM bp_readings;
