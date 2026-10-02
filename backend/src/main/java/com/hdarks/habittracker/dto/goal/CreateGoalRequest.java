package com.hdarks.habittracker.dto.goal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.Set;

public record CreateGoalRequest(
        @NotBlank @Size(max = 255) String title,
        LocalDate deadline,
        Boolean achieved,
        Set<Long> targetHabitIds
) {
}
