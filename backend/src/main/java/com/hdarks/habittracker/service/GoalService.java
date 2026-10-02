package com.hdarks.habittracker.service;

import com.hdarks.habittracker.dto.goal.CreateGoalRequest;
import com.hdarks.habittracker.dto.goal.GoalResponse;
import com.hdarks.habittracker.dto.goal.UpdateGoalRequest;
import com.hdarks.habittracker.entity.Goal;
import com.hdarks.habittracker.entity.Habit;
import com.hdarks.habittracker.entity.User;
import com.hdarks.habittracker.exception.ResourceNotFoundException;
import com.hdarks.habittracker.repository.GoalRepository;
import com.hdarks.habittracker.repository.HabitRepository;
import com.hdarks.habittracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GoalService {
    private final GoalRepository goalRepository;
    private final HabitRepository habitRepository;
    private final UserRepository userRepository;

    @Transactional
    public GoalResponse createGoal(CreateGoalRequest request, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        Set<Habit> targetHabits = getUserHabits(request.targetHabitIds(), user.getId());
        Goal goal = Goal.builder().title(request.title()).user(user).deadline(request.deadline())
                .achieved(request.achieved() != null ? request.achieved() : false)
                .targetHabits(targetHabits).build();
        Goal savedGoal = goalRepository.save(goal);
        return mapToResponse(savedGoal);
    }

    @Transactional(readOnly = true)
    public List<GoalResponse> getGoals(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return goalRepository.findByUser_Id(user.getId()).stream()
                .map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public GoalResponse getGoalById(Long goalId, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        Goal goal = goalRepository.findByIdAndUser_Id(goalId, user.getId()).orElseThrow(() ->
                new ResourceNotFoundException("Goal not found"));
        return mapToResponse(goal);
    }

    @Transactional
    public GoalResponse updateGoal(Long goalId, UpdateGoalRequest request, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        Goal goal = goalRepository.findByIdAndUser_Id(goalId, user.getId()).orElseThrow(() ->
                new ResourceNotFoundException("Goal not found"));
        if (request.title() != null)
            goal.setTitle(request.title());
        if (request.deadline() != null)
            goal.setDeadline(request.deadline());
        if (request.achieved() != null)
            goal.setAchieved(request.achieved());
        if (request.targetHabitIds() != null) {
            Set<Habit> targetHabits = getUserHabits(request.targetHabitIds(), user.getId());
            goal.setTargetHabits(targetHabits);
        }
        Goal updatedGoal = goalRepository.save(goal);
        return mapToResponse(updatedGoal);
    }

    @Transactional
    public void deleteGoal(Long goalId, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        Goal goal = goalRepository.findByIdAndUser_Id(goalId, user.getId()).orElseThrow(() ->
                new ResourceNotFoundException("Goal not found"));
        goalRepository.delete(goal);
    }

    private Set<Habit> getUserHabits(Set<Long> habitIds, Long userId) {
        if (habitIds == null || habitIds.isEmpty())
            return new HashSet<>();
        List<Habit> habits = habitRepository.findAllByIdInAndUser_Id(habitIds, userId);
        Set<Long> foundHabitIds = habits.stream().map(Habit::getId).collect(Collectors.toSet());
        if (!foundHabitIds.containsAll(habitIds))
            throw new ResourceNotFoundException("Habit not found");
        return new HashSet<>(habits);
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated())
            throw new ResourceNotFoundException("User is not authenticated");
        String email = authentication.getName();
        return userRepository.findByEmail(email).orElseThrow(() ->
                new ResourceNotFoundException("Authenticated user not found"));
    }

    private GoalResponse mapToResponse(Goal goal) {
        Set<Long> habitIds = goal.getTargetHabits().stream().map(Habit::getId)
                .collect(Collectors.toSet());
        return GoalResponse.builder().id(goal.getId()).title(goal.getTitle()).deadline(goal.getDeadline())
                .achieved(goal.getAchieved()).targetHabitIds(habitIds).createdAt(goal.getCreatedAt())
                .updatedAt(goal.getUpdatedAt()).build();
    }
}
