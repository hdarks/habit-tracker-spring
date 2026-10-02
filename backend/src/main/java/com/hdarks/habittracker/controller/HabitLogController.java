package com.hdarks.habittracker.controller;

import com.hdarks.habittracker.dto.habitLog.CreateHabitLogRequest;
import com.hdarks.habittracker.dto.habitLog.HabitLogResponse;
import com.hdarks.habittracker.dto.habitLog.UpdateHabitLogRequest;
import com.hdarks.habittracker.service.HabitLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class HabitLogController {
    private final HabitLogService habitLogService;

    @PostMapping("/habits/{habitId}/logs")
    public ResponseEntity<HabitLogResponse> createLog(
            @PathVariable Long habitId, @Valid @RequestBody CreateHabitLogRequest request, Authentication authentication
    ) {
        HabitLogResponse response = habitLogService.createLog(habitId, request, authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/habits/{habitId}/logs")
    public ResponseEntity<List<HabitLogResponse>> getLogsByHabit(@PathVariable Long habitId, Authentication authentication) {
        List<HabitLogResponse> response = habitLogService.getLogsByHabit(habitId, authentication);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/habit-logs/{logId}")
    public ResponseEntity<HabitLogResponse> getLogById(@PathVariable Long logId, Authentication authentication) {
        HabitLogResponse response = habitLogService.getLogById(logId, authentication);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/habit-logs/{logId}")
    public ResponseEntity<HabitLogResponse> updateLog(
            @PathVariable Long logId, @Valid @RequestBody UpdateHabitLogRequest request, Authentication authentication
    ) {
        HabitLogResponse response = habitLogService.updateLog(logId, request, authentication);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/habit-logs/{logId}")
    public ResponseEntity<Void> deleteLog(@PathVariable Long logId, Authentication authentication) {
        habitLogService.deleteLog(logId, authentication);
        return ResponseEntity.noContent().build();
    }
}
