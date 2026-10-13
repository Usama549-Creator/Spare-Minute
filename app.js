(() => {
  "use strict";

  const STORAGE_KEY = "spareminute.tasks.v1";
  const EFFORT_RANK = { low: 1, medium: 2, high: 3 };
  const VALID_EFFORTS = new Set(Object.keys(EFFORT_RANK));

  const elements = {
    timeLimit: document.querySelector("#time-limit"),
    customTimeWrap: document.querySelector("#custom-time-wrap"),
    customTime: document.querySelector("#custom-time"),
    customTimeError: document.querySelector("#custom-time-error"),
    taskForm: document.querySelector("#task-form"),
    taskTitle: document.querySelector("#task-title"),
    taskMinutes: document.querySelector("#task-minutes"),
    taskEffort: document.querySelector("#task-effort"),
    titleError: document.querySelector("#title-error"),
    minutesError: document.querySelector("#minutes-error"),
    submitTask: document.querySelector("#submit-task"),
    cancelEdit: document.querySelector("#cancel-edit"),
    formStatus: document.querySelector("#form-status"),
    storageNotice: document.querySelector("#storage-notice"),
    matchesSubtitle: document.querySelector("#matches-subtitle"),
    matchCount: document.querySelector("#match-count"),
    matchList: document.querySelector("#match-list"),
    emptyState: document.querySelector("#empty-state"),
    emptyTitle: document.querySelector("#empty-title"),
    emptyCopy: document.querySelector("#empty-copy"),
    addExamples: document.querySelector("#add-examples"),
    completedSection: document.querySelector("#completed-section"),
    completedCount: document.querySelector("#completed-count"),
    completedList: document.querySelector("#completed-list"),
  };

  let tasks = loadTasks();
  let editingTaskId = null;

  function isValidTask(task) {
    return Boolean(
      task &&
      typeof task.id === "string" &&
      task.id.length > 0 &&
      typeof task.title === "string" &&
      task.title.trim().length > 0 &&
      Number.isInteger(task.minutes) &&
      task.minutes >= 1 &&
      task.minutes <= 240 &&
      VALID_EFFORTS.has(task.effort) &&
      typeof task.completed === "boolean" &&
      Number.isFinite(task.createdAt)
    );
  }

  function loadTasks() {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === null) return [];

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed) || parsed.some((task) => !isValidTask(task))) {
        throw new Error("Saved task data has an unexpected format.");
      }

      return parsed.map((task) => ({ ...task, title: task.title.trim() }));
    } catch (_error) {
      showStorageNotice("Saved tasks could not be read. You can continue with a fresh list; your existing browser data was left untouched.");
      return [];
    }
  }

  function showStorageNotice(message) {
    elements.storageNotice.textContent = message;
    elements.storageNotice.hidden = false;
  }

  function hideStorageNotice() {
    elements.storageNotice.textContent = "";
    elements.storageNotice.hidden = true;
  }

  function saveTasks() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      hideStorageNotice();
      return true;
    } catch (_error) {
      showStorageNotice("Your changes are available for this session, but this browser could not save them on this device.");
      return false;
    }
  }

  function announce(message) {
    elements.formStatus.textContent = "";
    window.requestAnimationFrame(() => {
      elements.formStatus.textContent = message;
    });
  }

  function clearFieldError(input, errorElement) {
    input.removeAttribute("aria-invalid");
    errorElement.textContent = "";
    errorElement.hidden = true;
    input.closest(".form-field")?.classList.remove("has-error");
  }

  function showFieldError(input, errorElement, message) {
    input.setAttribute("aria-invalid", "true");
    errorElement.textContent = message;
    errorElement.hidden = false;
    input.closest(".form-field")?.classList.add("has-error");
  }

  function currentAvailableMinutes() {
    if (elements.timeLimit.value !== "custom") return Number(elements.timeLimit.value);

    const minutes = Number(elements.customTime.value);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 240) return null;
    return minutes;
  }

  function currentEnergy() {
    return document.querySelector('input[name="energy"]:checked')?.value ?? "medium";
  }

  function getMatches() {
    const availableMinutes = currentAvailableMinutes();
    if (availableMinutes === null) return [];

    const energy = currentEnergy();
    const energyRank = EFFORT_RANK[energy] ?? EFFORT_RANK.medium;

    return tasks
      .map((task, index) => ({ task, index }))
      .filter(({ task }) => !task.completed && task.minutes <= availableMinutes && EFFORT_RANK[task.effort] <= energyRank)
      .sort((a, b) => b.task.minutes - a.task.minutes || a.index - b.index)
      .map(({ task }) => task);
  }

  function formatDuration(minutes) {
    if (minutes === 60) return "1 hour";
    if (minutes > 60 && minutes % 60 === 0) return `${minutes / 60} hours`;
    if (minutes > 60) return `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
    return `${minutes} min`;
  }

  function makeActionButton(action, label, symbol, className = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `task-action ${className}`.trim();
    button.dataset.action = action;
    button.setAttribute("aria-label", label);
    button.title = label;
    button.textContent = symbol;
    return button;
  }

  function makeTaskCard(task, options = {}) {
    const { featured = false, completed = false } = options;
    const item = document.createElement("li");
    item.className = `task-card${featured ? " task-card--featured" : ""}${completed ? " task-card--completed" : ""}`;
    item.dataset.taskId = task.id;

    const main = document.createElement("div");
    main.className = "task-card-main";

    if (featured) {
      const kicker = document.createElement("span");
      kicker.className = "task-kicker";
      kicker.textContent = "✦ Best fit for right now";
      main.append(kicker);
    }

    const title = document.createElement("h3");
    title.className = "task-title";
    title.textContent = task.title;
    main.append(title);

    const meta = document.createElement("div");
    meta.className = "task-meta";
    const duration = document.createElement("span");
    duration.textContent = formatDuration(task.minutes);
    const separator = document.createElement("span");
    separator.className = "task-meta-separator";
    separator.setAttribute("aria-hidden", "true");
    const effort = document.createElement("span");
    effort.textContent = `${task.effort[0].toUpperCase()}${task.effort.slice(1)} effort`;
    meta.append(duration, separator, effort);
    main.append(meta);

    const controls = document.createElement("div");
    controls.className = "task-controls";
    if (completed) {
      controls.append(makeActionButton("reopen", `Reopen ${task.title}`, "↶", "task-action-complete"));
    } else {
      controls.append(makeActionButton("complete", `Mark ${task.title} complete`, "✓", "task-action-complete"));
    }
    controls.append(makeActionButton("edit", `Edit ${task.title}`, "✎"));
    controls.append(makeActionButton("delete", `Delete ${task.title}`, "×", "task-action-delete"));

    item.append(main, controls);
    return item;
  }

  function setEmptyState(title, copy, showExamples = false) {
    elements.emptyTitle.textContent = title;
    elements.emptyCopy.textContent = copy;
    elements.addExamples.hidden = !showExamples;
    elements.emptyState.hidden = false;
    elements.matchList.hidden = true;
    elements.matchList.replaceChildren();
  }

  function render() {
    const activeTasks = tasks.filter((task) => !task.completed);
    const completedTasks = tasks.filter((task) => task.completed);
    const matches = getMatches();
    const availableMinutes = currentAvailableMinutes();

    elements.matchCount.textContent = String(matches.length);
    elements.matchCount.setAttribute("aria-label", `${matches.length} matching ${matches.length === 1 ? "task" : "tasks"}`);
    elements.completedCount.textContent = String(completedTasks.length);
    elements.completedSection.hidden = completedTasks.length === 0;
    elements.matchesSubtitle.textContent = matches.length === 1 ? "One task fits your moment." : matches.length > 1 ? `${matches.length} tasks fit your moment.` : "A task that fits your moment.";

    const customTimeInvalid = elements.timeLimit.value === "custom" && availableMinutes === null;
    elements.customTimeError.hidden = !customTimeInvalid;
    elements.customTimeError.textContent = customTimeInvalid ? "Choose a whole number from 1 to 240." : "";
    elements.customTime.setAttribute("aria-invalid", customTimeInvalid ? "true" : "false");

    if (customTimeInvalid) {
      setEmptyState("Check your time amount", "Choose a whole number between 1 and 240 minutes to see tasks that fit.");
    } else if (tasks.length === 0) {
      setEmptyState("Make room for a small win", "Add a few tasks and we’ll find one that fits the time and energy you have.", true);
    } else if (activeTasks.length === 0) {
      setEmptyState("All caught up.", "Your tasks are done for now. Add another small win whenever you’re ready.");
    } else if (matches.length === 0) {
      setEmptyState("Nothing fits this moment yet", "Try giving yourself a little more time or choosing a higher energy level.");
    } else {
      elements.emptyState.hidden = true;
      elements.matchList.hidden = false;
      elements.matchList.replaceChildren(...matches.map((task, index) => makeTaskCard(task, { featured: index === 0 })));
    }

    elements.completedList.replaceChildren(...completedTasks.map((task) => makeTaskCard(task, { completed: true })));
  }

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function resetForm() {
    editingTaskId = null;
    elements.taskForm.reset();
    elements.taskMinutes.value = "15";
    elements.taskEffort.value = "medium";
    elements.submitTask.querySelector("span:last-child").textContent = "Add task";
    elements.submitTask.querySelector(".button-plus").hidden = false;
    elements.cancelEdit.hidden = true;
    clearFieldError(elements.taskTitle, elements.titleError);
    clearFieldError(elements.taskMinutes, elements.minutesError);
  }

  function beginEdit(task) {
    editingTaskId = task.id;
    elements.taskTitle.value = task.title;
    elements.taskMinutes.value = String(task.minutes);
    elements.taskEffort.value = task.effort;
    elements.submitTask.querySelector("span:last-child").textContent = "Save changes";
    elements.submitTask.querySelector(".button-plus").hidden = true;
    elements.cancelEdit.hidden = false;
    clearFieldError(elements.taskTitle, elements.titleError);
    clearFieldError(elements.taskMinutes, elements.minutesError);
    elements.taskTitle.focus();
  }

  function handleTaskSubmit(event) {
    event.preventDefault();
    clearFieldError(elements.taskTitle, elements.titleError);
    clearFieldError(elements.taskMinutes, elements.minutesError);

    const title = elements.taskTitle.value.trim();
    const minutesValue = elements.taskMinutes.value.trim();
    const minutes = Number(minutesValue);
    let valid = true;

    if (!title) {
      showFieldError(elements.taskTitle, elements.titleError, "Give your task a short name.");
      valid = false;
    }
    if (!minutesValue || !Number.isInteger(minutes) || minutes < 1 || minutes > 240) {
      showFieldError(elements.taskMinutes, elements.minutesError, "Choose a whole number from 1 to 240 minutes.");
      valid = false;
    }

    if (!valid) {
      (elements.taskTitle.getAttribute("aria-invalid") === "true" ? elements.taskTitle : elements.taskMinutes).focus();
      return;
    }

    if (editingTaskId) {
      tasks = tasks.map((task) => task.id === editingTaskId ? { ...task, title, minutes, effort: elements.taskEffort.value } : task);
      resetForm();
      saveTasks();
      render();
      announce(`${title} updated.`);
      return;
    }

    tasks.push({ id: makeId(), title, minutes, effort: elements.taskEffort.value, completed: false, createdAt: Date.now() });
    saveTasks();
    render();
    elements.taskForm.reset();
    elements.taskMinutes.value = "15";
    elements.taskEffort.value = "medium";
    elements.taskTitle.focus();
    announce(`${title} added to your list.`);
  }

  function handleTaskAction(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const taskCard = button.closest("[data-task-id]");
    const task = tasks.find((entry) => entry.id === taskCard?.dataset.taskId);
    if (!task) return;

    switch (button.dataset.action) {
      case "complete":
        task.completed = true;
        saveTasks();
        render();
        announce(`${task.title} marked complete.`);
        break;
      case "reopen":
        task.completed = false;
        saveTasks();
        render();
        announce(`${task.title} reopened.`);
        break;
      case "edit":
        beginEdit(task);
        break;
      case "delete":
        tasks = tasks.filter((entry) => entry.id !== task.id);
        if (editingTaskId === task.id) resetForm();
        saveTasks();
        render();
        announce(`${task.title} deleted.`);
        break;
      default:
        break;
    }
  }

  function addExamples() {
    if (tasks.length > 0) return;
    const now = Date.now();
    tasks = [
      { title: "Water the plants", minutes: 8, effort: "low" },
      { title: "Clear one surface", minutes: 12, effort: "low" },
      { title: "Reply to one message", minutes: 10, effort: "medium" },
      { title: "Prep tomorrow’s lunch", minutes: 20, effort: "medium" },
      { title: "Take a short walk", minutes: 25, effort: "low" },
    ].map((task, index) => ({ ...task, id: makeId(), completed: false, createdAt: now + index }));
    saveTasks();
    render();
    announce("Example tasks added. Edit or delete any of them.");
  }

  elements.timeLimit.addEventListener("change", () => {
    elements.customTimeWrap.hidden = elements.timeLimit.value !== "custom";
    render();
    if (elements.timeLimit.value === "custom") elements.customTime.focus();
  });
  elements.customTime.addEventListener("input", render);
  document.querySelectorAll('input[name="energy"]').forEach((input) => input.addEventListener("change", render));
  elements.taskForm.addEventListener("submit", handleTaskSubmit);
  elements.taskTitle.addEventListener("input", () => clearFieldError(elements.taskTitle, elements.titleError));
  elements.taskMinutes.addEventListener("input", () => clearFieldError(elements.taskMinutes, elements.minutesError));
  elements.cancelEdit.addEventListener("click", () => {
    resetForm();
    elements.taskTitle.focus();
    announce("Edit cancelled.");
  });
  elements.matchList.addEventListener("click", handleTaskAction);
  elements.completedList.addEventListener("click", handleTaskAction);
  elements.addExamples.addEventListener("click", addExamples);

  elements.customTimeWrap.hidden = elements.timeLimit.value !== "custom";
  render();
})();
