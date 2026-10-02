package com.hdarks.habittracker.repository;

import com.hdarks.habittracker.entity.HabitLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface HabitLogRepository extends JpaRepository<HabitLog, Long> {
    Optional<HabitLog> findByIdAndHabit_User_Id(Long logId, Long userId);
    List<HabitLog> findByHabit_IdAndHabit_User_Id(Long habitId, Long userId);
    Optional<HabitLog> findByHabit_IdAndLogDateAndHabit_User_Id(Long habitId, LocalDate logDate, Long userId);
}
