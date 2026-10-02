package com.hdarks.habittracker.dto.habitLog;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CreateHabitLogRequest(
        @NotNull
        LocalDate logDate,
        Boolean completed
) {
}
