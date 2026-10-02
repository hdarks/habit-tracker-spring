package com.hdarks.habittracker.service;

import com.hdarks.habittracker.dto.habitLog.CreateHabitLogRequest;
import com.hdarks.habittracker.dto.habitLog.HabitLogResponse;
import com.hdarks.habittracker.dto.habitLog.UpdateHabitLogRequest;
import com.hdarks.habittracker.entity.Habit;
import com.hdarks.habittracker.entity.HabitLog;
import com.hdarks.habittracker.entity.User;
import com.hdarks.habittracker.exception.DuplicateResourceException;
import com.hdarks.habittracker.exception.ResourceNotFoundException;
import com.hdarks.habittracker.repository.HabitLogRepository;
import com.hdarks.habittracker.repository.HabitRepository;
import com.hdarks.habittracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HabitLogService {
    private final HabitLogRepository habitLogRepository;
    private final HabitRepository habitRepository;
    private final UserRepository userRepository;

    @Transactional
    public HabitLogResponse createLog(Long habitId, CreateHabitLogRequest request, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        Habit habit = habitRepository.findByIdAndUser_Id(habitId, user.getId()).orElseThrow(
                () -> new ResourceNotFoundException("Habit not found"));

        if (habitLogRepository.findByHabit_IdAndLogDateAndHabit_User_Id(habitId, request.logDate(), user.getId())
                .isPresent()) {
            throw new DuplicateResourceException("Habit log already exists for this date");
        }

        HabitLog habitLog = HabitLog.builder().habit(habit).logDate(request.logDate())
                .completed(request.completed() != null ? request.completed() : false).build();
        HabitLog savedLog = habitLogRepository.save(habitLog);
        return mapToResponse(savedLog);
    }

    @Transactional(readOnly = true)
    public List<HabitLogResponse> getLogsByHabit(Long habitId, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (!habitRepository.existsByIdAndUser_Id(habitId, user.getId()))
            throw new ResourceNotFoundException("Habit not found");
        return habitLogRepository.findByHabit_IdAndHabit_User_Id(habitId, user.getId()).stream()
                .map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public HabitLogResponse getLogById(Long logId, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        HabitLog habitLog = habitLogRepository.findByIdAndHabit_User_Id(logId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Habit log not found"));
        return mapToResponse(habitLog);
    }

    @Transactional
    public HabitLogResponse updateLog(Long logId, UpdateHabitLogRequest request, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        HabitLog habitLog = habitLogRepository.findByIdAndHabit_User_Id(logId, user.getId()).orElseThrow(() ->
                new ResourceNotFoundException("Habit log not found"));
        if (request.logDate() != null) {
            if (!request.logDate().equals(habitLog.getLogDate())) {
                if (habitLogRepository.findByHabit_IdAndLogDateAndHabit_User_Id(
                        habitLog.getHabit().getId(), request.logDate(), user.getId()
                ).isPresent()) {
                    throw new DuplicateResourceException("Habit log already exists for this date");
                }
                habitLog.setLogDate(request.logDate());
            }
        }
        if (request.completed() != null) {
            habitLog.setCompleted(request.completed());
        }
        HabitLog updatedLog = habitLogRepository.save(habitLog);
        return mapToResponse(updatedLog);
    }

    @Transactional
    public void deleteLog(Long logId, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        HabitLog habitLog = habitLogRepository.findByIdAndHabit_User_Id(logId, user.getId()).orElseThrow(() ->
                new ResourceNotFoundException("Habit log not found"));
        habitLogRepository.delete(habitLog);
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResourceNotFoundException("User is not authenticated");
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email).orElseThrow(() ->
                new ResourceNotFoundException("Authenticated user not found"));
    }

    private HabitLogResponse mapToResponse(HabitLog habitLog) {
        return HabitLogResponse.builder().id(habitLog.getId()).habitId(habitLog.getHabit().getId())
                .logDate(habitLog.getLogDate()).completed(habitLog.getCompleted()).build();
    }
}
