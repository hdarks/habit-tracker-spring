package com.hdarks.habittracker.dto.habitLog;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class HabitLogResponse {
    private Long id;
    private Long habitId;
    private LocalDate logDate;
    private Boolean completed;
}
