package com.hdarks.habittracker.repository;

import com.hdarks.habittracker.entity.Habit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface HabitRepository extends JpaRepository<Habit, Long> {
    List<Habit> findByUser_Id(Long userId);
    Optional<Habit> findByIdAndUser_Id(Long habitId, Long userId);
    List<Habit> findAllByIdInAndUser_Id(Set<Long> habitIds, Long userId);
    boolean existsByIdAndUser_Id(Long habitId, Long userId);
}
