package com.hdarks.habittracker.controller;

import com.hdarks.habittracker.dto.goal.CreateGoalRequest;
import com.hdarks.habittracker.dto.goal.GoalResponse;
import com.hdarks.habittracker.dto.goal.UpdateGoalRequest;
import com.hdarks.habittracker.service.GoalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class GoalController {
    private final GoalService goalService;

    @PostMapping
    public ResponseEntity<GoalResponse> createGoal(
            @Valid @RequestBody CreateGoalRequest request, Authentication authentication) {
        GoalResponse response = goalService.createGoal(request, authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<GoalResponse>> getGoals(Authentication authentication) {
        return ResponseEntity.ok(goalService.getGoals(authentication));
    }

    @GetMapping("/{goalId}")
    public ResponseEntity<GoalResponse> getGoalById(@PathVariable Long goalId, Authentication authentication) {
        return ResponseEntity.ok(goalService.getGoalById(goalId, authentication));
    }

    @PutMapping("/{goalId}")
    public ResponseEntity<GoalResponse> updateGoal(
            @PathVariable Long goalId, @Valid @RequestBody UpdateGoalRequest request, Authentication authentication
    ) {
        return ResponseEntity.ok(goalService.updateGoal(goalId, request, authentication));
    }

    @DeleteMapping("/{goalId}")
    public ResponseEntity<Void> deleteGoal(@PathVariable Long goalId, Authentication authentication) {
        goalService.deleteGoal(goalId, authentication);
        return ResponseEntity.noContent().build();
    }
}
