package com.hdarks.habittracker.dto.habit;

import com.hdarks.habittracker.entity.Habit;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateHabitRequest {
    @NotBlank(message = "Habit name is required")
    @Size(max = 150, message = "Habit must not exceed 150 characters")
    private String name;

    @NotNull(message = "Habit frequency is required")
    private Habit.Frequency frequency;
}
