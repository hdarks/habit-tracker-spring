CREATE TABLE users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE TABLE habits (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    user_id BIGINT NOT NULL,
    frequency VARCHAR(20) NOT NULL DEFAULT 'DAILY',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_habits PRIMARY KEY (id),
    CONSTRAINT fk_habits_users
                    FOREIGN KEY (user_id)
                    REFERENCES users(id)
                    ON DELETE CASCADE
);

CREATE TABLE habit_logs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    habit_id BIGINT NOT NULL,
    log_date DATE NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT pk_habit_logs PRIMARY KEY (id),
    CONSTRAINT fk_habit_logs
                        FOREIGN KEY (habit_id)
                        REFERENCES habits(id)
                        ON DELETE CASCADE,
    CONSTRAINT uk_habit_logs_habit_date UNIQUE (habit_id, log_date)
);

CREATE TABLE goals (
    id BIGINT NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    user_id BIGINT NOT NULL,
    deadline DATE,
    achieved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_goals PRIMARY KEY (id),
    CONSTRAINT fk_goals_user
                   FOREIGN KEY (user_id)
                   REFERENCES users(id)
                   ON DELETE CASCADE
);

CREATE TABLE goal_habits (
    goal_id BIGINT NOT NULL,
    habit_id BIGINT NOT NULL,

    CONSTRAINT pk_goal_habits PRIMARY KEY (goal_id, habit_id),
    CONSTRAINT fk_goal_habits_goal
                         FOREIGN KEY (goal_id)
                         REFERENCES goals(id)
                         ON DELETE CASCADE,
    CONSTRAINT fk_goal_habits_habit
                         FOREIGN KEY (habit_id)
                         REFERENCES habits(id)
                         ON DELETE CASCADE
);