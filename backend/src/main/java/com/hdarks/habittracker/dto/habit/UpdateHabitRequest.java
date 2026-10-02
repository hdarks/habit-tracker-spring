package com.hdarks.habittracker.dto.habit;

import com.hdarks.habittracker.entity.Habit;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateHabitRequest {
    @NotBlank
    @Size(max = 150)
    private String name;

    @NotNull
    private Habit.Frequency frequency;
}
