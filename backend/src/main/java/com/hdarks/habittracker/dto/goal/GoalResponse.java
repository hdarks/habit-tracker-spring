package com.hdarks.habittracker.dto.goal;

import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

@Builder
public record GoalResponse(
        Long id,
        String title,
        LocalDate deadline,
        Boolean achieved,
        Set<Long> targetHabitIds,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
