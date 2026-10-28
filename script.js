/* =========================================
   1. SELECT HTML ELEMENTS
========================================= */

const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const searchInput = document.getElementById("search-input");
const filterSelect = document.getElementById("filter-select");
const priorityInput = document.getElementById("task-priority");

const completedStat = document.getElementById("completed-stat");
const pendingStat = document.getElementById("pending-stat");
const focusStat = document.getElementById("focus-stat");
const rateStat = document.getElementById("rate-stat");

const completedBar = document.getElementById("completed-bar");
const pendingBar = document.getElementById("pending-bar");
const focusBar = document.getElementById("focus-bar");
const rateBar = document.getElementById("rate-bar");

const navCount = document.getElementById("nav-count");

const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");
const progressPercent = document.getElementById("progress-percent");


/* =========================================
   2. LOAD AND SAVE TASKS
========================================= */

let tasks = [];

try {
    const savedTasks = JSON.parse(
        localStorage.getItem("nexora-tasks")
    );

    if (Array.isArray(savedTasks)) {
        tasks = savedTasks.filter(task =>
            task &&
            typeof task.id === "string" &&
            typeof task.name === "string" &&
            typeof task.done === "boolean" &&
            ["High", "Medium", "Low"].includes(
                String(task.priority).charAt(0).toUpperCase() +
                String(task.priority).slice(1).toLowerCase()
            )
        );

        // Make older lowercase priorities consistent.
        tasks.forEach(task => {
            task.priority =
                task.priority.charAt(0).toUpperCase() +
                task.priority.slice(1).toLowerCase();
        });
    }
} catch (error) {
    tasks = [];
}

function saveTasks() {
    localStorage.setItem(
        "nexora-tasks",
        JSON.stringify(tasks)
    );
}


/* =========================================
   3. DISPLAY TASKS
========================================= */

function renderTasks() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedFilter = filterSelect.value;

    const visibleTasks = tasks.filter(task => {
        const matchesSearch = task.name
            .toLowerCase()
            .includes(searchTerm);

        const matchesFilter =
            selectedFilter === "all" ||
            (selectedFilter === "active" && !task.done) ||
            (selectedFilter === "completed" && task.done);

        return matchesSearch && matchesFilter;
    });

    taskList.replaceChildren();

    if (visibleTasks.length === 0) {
        const message = document.createElement("p");

        message.className = "empty-state";
        message.textContent = tasks.length === 0
            ? "✨ Your workspace is clear. Add your first task!"
            : "No matching tasks found.";

        taskList.appendChild(message);
    }

    visibleTasks.forEach(task => {
        const item = document.createElement("div");

        item.className = "task-item";
        if (task.done) {
            item.classList.add("done");
        }

        // Checkbox
        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";
        checkbox.className = "task-check";
        checkbox.checked = task.done;
        checkbox.setAttribute("aria-label", `Complete ${task.name}`);

        checkbox.addEventListener("change", () => {
            task.done = checkbox.checked;
            saveTasks();
            renderTasks();
        });

        // Task information
        const info = document.createElement("div");
        info.className = "task-info";

        const name = document.createElement("p");
        name.className = "task-name";
        name.textContent = task.name;

        const meta = document.createElement("p");
        meta.className = "task-meta";
        meta.textContent = task.done
            ? "Completed ✓"
            : "In progress";

        info.append(name, meta);

        // Priority label
        const priority = document.createElement("span");
        priority.className = "priority";
        priority.textContent = task.priority;

        // Delete button
        const deleteButton = document.createElement("button");

        deleteButton.className = "delete-btn";
        deleteButton.type = "button";
        deleteButton.textContent = "×";
        deleteButton.setAttribute("aria-label", `Delete ${task.name}`);

        deleteButton.addEventListener("click", () => {
            tasks = tasks.filter(item => item.id !== task.id);
            saveTasks();
            renderTasks();
        });

        item.append(checkbox, info, priority, deleteButton);
        taskList.appendChild(item);
    });

    updateDashboard();
}


/* =========================================
   4. ADD NEW TASKS
========================================= */

taskForm.addEventListener("submit", event => {
    event.preventDefault();

    const name = taskInput.value.trim();
    const priority = priorityInput.value;

    if (!name) {
        taskInput.focus();
        return;
    }

    tasks.unshift({
        id: crypto.randomUUID(),
        name: name,
        priority: priority.charAt(0).toUpperCase() +
            priority.slice(1).toLowerCase(),
        done: false
    });

    saveTasks();
    taskForm.reset();

    // Restore the default priority after resetting.
    priorityInput.value = "Medium";

    renderTasks();
    taskInput.focus();
});


/* =========================================
   5. SEARCH AND FILTER
========================================= */

searchInput.addEventListener("input", renderTasks);

filterSelect.addEventListener("change", renderTasks);


/* =========================================
   6. UPDATE DASHBOARD STATISTICS
========================================= */

function updateDashboard() {
    const total = tasks.length;

    const completed = tasks.filter(task => task.done).length;

    const pending = total - completed;

    const rate = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    completedStat.textContent = completed;
    pendingStat.textContent = pending;
    rateStat.textContent = `${rate}%`;

    navCount.textContent = pending;

    // Update progress bars.
    const completedWidth = total === 0 ? 0 : completed / total * 100;
    const pendingWidth = total === 0 ? 0 : pending / total * 100;

    completedBar.style.width = `${completedWidth}%`;
    pendingBar.style.width = `${pendingWidth}%`;
    rateBar.style.width = `${rate}%`;

    // Update the insights section.
    progressFill.style.width = `${rate}%`;
    progressText.textContent =
        `${completed} of ${total} tasks completed`;
    progressPercent.textContent = `${rate}%`;
}


/* =========================================
   7. FOCUS TIMER
========================================= */

const timerDisplay = document.getElementById("timer-display");
const timerRing = document.getElementById("timer-ring");
const timerLabel = document.getElementById("timer-label");
const startTimerButton = document.getElementById("start-timer");
const resetTimerButton = document.getElementById("reset-timer");
const sessionNote = document.getElementById("session-note");

const FOCUS_DURATION = 25 * 60;

let secondsLeft = FOCUS_DURATION;
let timerInterval = null;
let timerEndTime = null;

let sessions = Number(localStorage.getItem("nexora-sessions")) || 0;

function updateTimerDisplay() {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;

    timerDisplay.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    const percentage = secondsLeft / FOCUS_DURATION * 100;

    timerRing.style.setProperty("--progress", `${percentage}%`);
}

function updateFocusStats() {
    focusStat.textContent = `${sessions * 25} min`;

    const percentage = Math.min(sessions * 25 / 120 * 100, 100);
    focusBar.style.width = `${percentage}%`;
}

function pauseTimer() {
    if (timerInterval !== null) {
        secondsLeft = Math.max(
            0,
            Math.ceil((timerEndTime - Date.now()) / 1000)
        );

        clearInterval(timerInterval);
        timerInterval = null;
        timerEndTime = null;

        startTimerButton.textContent = "▶ Resume focus";

        updateTimerDisplay();
    }
}

function tickTimer() {
    secondsLeft = Math.max(
        0,
        Math.ceil((timerEndTime - Date.now()) / 1000)
    );

    updateTimerDisplay();

    if (secondsLeft === 0) {
        clearInterval(timerInterval);

        timerInterval = null;
        timerEndTime = null;

        sessions++;

        localStorage.setItem("nexora-sessions", sessions);

        updateFocusStats();

        startTimerButton.textContent = "▶ Start focus";
        timerLabel.textContent = "Completed";
        sessionNote.textContent =
            "🎉 Focus session complete! Take a break.";

        return;
    }

    sessionNote.textContent = "Stay focused. One step at a time.";
}

startTimerButton.addEventListener("click", () => {
    if (timerInterval !== null) {
        pauseTimer();
        return;
    }

    if (secondsLeft === 0) {
        secondsLeft = FOCUS_DURATION;
    }

    timerEndTime = Date.now() + secondsLeft * 1000;

    startTimerButton.textContent = "Ⅱ Pause";
    timerLabel.textContent = "Deep work";

    timerInterval = setInterval(tickTimer, 250);

    tickTimer();
});

resetTimerButton.addEventListener("click", () => {
    clearInterval(timerInterval);

    timerInterval = null;
    timerEndTime = null;
    secondsLeft = FOCUS_DURATION;

    startTimerButton.textContent = "▶ Start focus";
    timerLabel.textContent = "Deep work";
    sessionNote.textContent = "Ready when you are.";

    updateTimerDisplay();
});

updateTimerDisplay();
updateFocusStats();


/* =========================================
   8. DARK AND LIGHT THEMES
========================================= */

const themeButton = document.getElementById("theme-toggle");

function applyTheme(theme) {
    document.body.classList.toggle("light", theme === "light");

    themeButton.innerHTML = theme === "light"
        ? "☾ <span>Switch appearance</span>"
        : "☼ <span>Switch appearance</span>";

    localStorage.setItem("nexora-theme", theme);
}

applyTheme(localStorage.getItem("nexora-theme") || "dark");

themeButton.addEventListener("click", () => {
    const isLight = document.body.classList.contains("light");

    applyTheme(isLight ? "dark" : "light");
});


/* =========================================
   9. SIDEBAR NAVIGATION
========================================= */

const navButtons = document.querySelectorAll("[data-view]");
const pageName = document.getElementById("page-name");
const sidebar = document.getElementById("sidebar");

const mobileMenu = document.getElementById("mobile-menu");

function navigateTo(view) {
    const targets = {
        overview: document.querySelector(".welcome"),
        tasks: document.querySelector(".tasks-panel"),
        focus: document.getElementById("focus"),
        insights: document.getElementById("insights")
    };

    const names = {
        overview: "Overview",
        tasks: "My tasks",
        focus: "Focus room",
        insights: "Insights"
    };

    const target = targets[view];

    if (!target) return;

    navButtons.forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.view === view
        );
    });

    pageName.textContent = names[view];

    target.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    sidebar.classList.remove("open");
}

navButtons.forEach(button => {
    button.addEventListener("click", () => {
        navigateTo(button.dataset.view);
    });
});

// View all button
document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => {
        navigateTo(button.dataset.go);
    });
});

// Quick-add button
document.getElementById("quick-add").addEventListener("click", () => {
    navigateTo("tasks");
    taskInput.focus();
});

// Mobile navigation
mobileMenu.addEventListener("click", () => {
    sidebar.classList.toggle("open");
});


/* =========================================
   10. PERSONALIZED GREETING
========================================= */

const greeting = document.getElementById("greeting");
const todayLabel = document.getElementById("today-label");

const hour = new Date().getHours();

const greetingText = hour < 12
    ? "Good morning"
    : hour < 18
        ? "Good afternoon"
        : "Good evening";

greeting.innerHTML = `${greetingText} <span>— make today count.</span>`;

todayLabel.textContent = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric"
}).toUpperCase();


/* =========================================
   11. INITIALIZE THE APP
========================================= */

renderTasks();
