package com.hdarks.habittracker.service;

import com.hdarks.habittracker.dto.habit.CreateHabitRequest;
import com.hdarks.habittracker.dto.habit.HabitResponse;
import com.hdarks.habittracker.dto.habit.UpdateHabitRequest;
import com.hdarks.habittracker.entity.Habit;
import com.hdarks.habittracker.entity.User;
import com.hdarks.habittracker.exception.ResourceNotFoundException;
import com.hdarks.habittracker.repository.HabitRepository;
import com.hdarks.habittracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HabitService {
    private final HabitRepository habitRepository;
    private final UserRepository userRepository;

    @Transactional
    public HabitResponse createHabit(String email, CreateHabitRequest request) {
        User user = userRepository.findByEmail(email).orElseThrow(() ->
                new ResourceNotFoundException("User not found"));
        Habit habit = Habit.builder().name(request.getName())
                .frequency(request.getFrequency()).user(user).build();
        Habit savedHabit = habitRepository.save(habit);
        return toResponse(savedHabit);
    }

    @Transactional(readOnly = true)
    public List<HabitResponse> getMyHabits(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() ->
                new ResourceNotFoundException("User not found"));
        return habitRepository.findByUser_Id(user.getId()).stream()
                .map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public HabitResponse getHabit(String email, Long habitId) {
        User user = userRepository.findByEmail(email).orElseThrow(() ->
                new ResourceNotFoundException("User not found"));
        Habit habit = habitRepository.findByIdAndUser_Id(habitId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Habit not found"));
        return toResponse(habit);
    }

    private HabitResponse toResponse(Habit habit) {
        return HabitResponse.builder().id(habit.getId()).name(habit.getName()).frequency(habit.getFrequency())
                .createdAt(habit.getCreatedAt()).updatedAt(habit.getUpdatedAt()).build();
    }

    @Transactional
    public HabitResponse updateHabit(String email, Long habitId, UpdateHabitRequest request) {
        User user = userRepository.findByEmail(email).orElseThrow(() ->
                new ResourceNotFoundException("User not found"));
        Habit habit = habitRepository.findByIdAndUser_Id(habitId, user.getId()).orElseThrow(() ->
                new ResourceNotFoundException("Habit not found"));
        habit.setName(request.getName());
        habit.setFrequency(request.getFrequency());
        Habit updatedHabit = habitRepository.save(habit);
        return toResponse(updatedHabit);
    }

    @Transactional
    public void deleteHabit(String email, Long habitId) {
        User user = userRepository.findByEmail(email).orElseThrow(() ->
                new ResourceNotFoundException("User not found"));
        Habit habit = habitRepository.findByIdAndUser_Id(habitId, user.getId()).orElseThrow(() ->
                new ResourceNotFoundException("Habit not found"));
        habitRepository.delete(habit);
    }
}
