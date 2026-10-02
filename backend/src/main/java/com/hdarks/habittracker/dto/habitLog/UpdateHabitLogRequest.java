package com.hdarks.habittracker.dto.habitLog;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record UpdateHabitLogRequest(
        LocalDate logDate, Boolean completed
) {
}
