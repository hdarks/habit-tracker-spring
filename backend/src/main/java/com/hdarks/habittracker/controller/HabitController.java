package com.hdarks.habittracker.controller;

import com.hdarks.habittracker.dto.habit.CreateHabitRequest;
import com.hdarks.habittracker.dto.habit.HabitResponse;
import com.hdarks.habittracker.dto.habit.UpdateHabitRequest;
import com.hdarks.habittracker.service.HabitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/habits")
@RequiredArgsConstructor
public class HabitController {
    private final HabitService habitService;

    @PostMapping
    public ResponseEntity<HabitResponse> createHabit(@Valid @RequestBody CreateHabitRequest request,
                                                     Authentication authentication) {
        String email = authentication.getName();
        HabitResponse response = habitService.createHabit(email, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<HabitResponse>> getMyHabits(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(habitService.getMyHabits(email));
    }

    @GetMapping("/{habitId}")
    public ResponseEntity<HabitResponse> getHabit(@PathVariable Long habitId, Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(habitService.getHabit(email, habitId));
    }

    @PutMapping("/{habitId}")
    public ResponseEntity<HabitResponse> updateHabit(
            @PathVariable Long habitId, @Valid @RequestBody UpdateHabitRequest request, Authentication authentication) {
        String email = authentication.getName();
        HabitResponse response = habitService.updateHabit(email, habitId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{habitId}")
    public ResponseEntity<Void> deleteHabit(@PathVariable Long habitId, Authentication authentication) {
        String email = authentication.getName();
        habitService.deleteHabit(email, habitId);
        return ResponseEntity.noContent().build();
    }
}
