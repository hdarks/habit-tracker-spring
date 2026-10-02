package com.hdarks.habittracker.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "goals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Goal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_goals_user"))
    private User user;

    @Column(name = "deadline")
    private LocalDate deadline;

    @Column(name = "achieved", nullable = false)
    @Builder.Default
    private Boolean achieved = false;

    @ManyToMany
    @JoinTable(
            name = "goal_habits",
            joinColumns = @JoinColumn(name = "goal_id", foreignKey = @ForeignKey(name = "fk_goal_habits_goal")),
            inverseJoinColumns = @JoinColumn(name = "habit_id", foreignKey = @ForeignKey(name = "fk_goal_habits_habit"))
    )
    @Builder.Default
    private Set<Habit> targetHabits = new HashSet<>();

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
