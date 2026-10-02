package com.hdarks.habittracker.dto.goal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.Set;

public record UpdateGoalRequest(
        @NotBlank(message = "Goal title is required")
        @Size(max = 255, message = "Goal title must not exceed 255 characters")
        String title,
        LocalDate deadline,
        Boolean achieved,
        Set<Long> targetHabitIds
) {
}
