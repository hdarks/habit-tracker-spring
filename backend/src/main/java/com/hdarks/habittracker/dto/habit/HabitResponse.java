package com.hdarks.habittracker.dto.habit;

import com.hdarks.habittracker.entity.Habit;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class HabitResponse {
    private Long id;
    private String name;
    private Habit.Frequency frequency;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
