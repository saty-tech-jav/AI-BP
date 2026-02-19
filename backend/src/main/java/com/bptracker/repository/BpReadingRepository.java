package com.bptracker.repository;

import com.bptracker.model.BpReading;
import com.bptracker.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BpReadingRepository extends JpaRepository<BpReading, Long> {

    List<BpReading> findByUserOrderByRecordedAtDesc(User user);

    List<BpReading> findByUserAndRecordedAtBetweenOrderByRecordedAtAsc(
            User user, LocalDateTime start, LocalDateTime end);

    @Query("SELECT b FROM BpReading b WHERE b.user = :user AND b.recordedAt >= :since ORDER BY b.recordedAt ASC")
    List<BpReading> findByUserSince(@Param("user") User user, @Param("since") LocalDateTime since);

    @Query("SELECT b FROM BpReading b WHERE b.user = :user ORDER BY b.recordedAt DESC")
    List<BpReading> findLatestByUser(@Param("user") User user);

    long countByUser(User user);
}
