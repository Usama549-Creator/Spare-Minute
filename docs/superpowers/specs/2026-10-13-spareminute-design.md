# SpareMinute Design

Date: 2026-10-13

## Purpose

SpareMinute helps a person choose a useful task that fits the time and energy they have available. The first version is a small, local-first web app intended to be easy to run, understand, and publish as a public code repository.

## Goals

- Let users add and maintain a short list of tasks.
- Match unfinished tasks against an available-time limit and energy level.
- Make the best time fit easy to identify.
- Keep task data in the user's browser without an account or server.
- Work on phone and desktop screens and support keyboard use.

## Non-goals

- Accounts, cloud sync, collaboration, or server-side storage.
- Calendar integration, notifications, or background scheduling.
- AI-generated task suggestions.
- Timers, analytics, recurring tasks, or project management in the first version.

## User experience

### Add and maintain tasks

Each task has a title, estimated duration in minutes, effort level (`Low`, `Medium`, or `High`), completion state, and stable ID. Users can add, edit, complete/reopen, and delete tasks.

Titles are trimmed and required. Duration must be a whole number from 1 to 240 minutes. Invalid input receives a clear inline message and is not saved.

### Find a task for now

The user chooses an available-time limit and current energy level. Preset time options are 5, 10, 15, 30, 45, and 60 minutes, with a custom whole-minute option from 1 to 240. Energy is `Low`, `Medium`, or `High`.

A task matches when it is unfinished, its duration is no greater than the selected time, and its effort rank is no greater than the selected energy rank (`Low` < `Medium` < `High`). Matching tasks are sorted by duration descending so the closest fit appears first; ties preserve task creation order.

The results area has three states:

1. **Matches:** show matching tasks in ranked order, with duration and effort visible. Completing a task removes it from the current matches.
2. **No matches:** explain that no unfinished task fits both choices and let the user change the time or energy filter.
3. **No tasks:** invite the user to add a first task.

Completed tasks remain available in a separate completed section where they can be reopened or deleted. Deletion is immediate; confirmation is not required for this low-risk local action.

### Layout and accessibility

The single page contains a short header, an add/edit task form, availability controls, matching results, and a completed-task section. On narrow screens these sections stack vertically; on wider screens the matching controls and results can sit beside each other.

All controls have visible labels. Forms can be completed with a keyboard, focus is visible, status messages are announced accessibly, and color contrast remains readable.

## Technical design

Use plain HTML, CSS, and JavaScript with no runtime dependencies or build step. The app can be served as static files. Keep the main responsibilities separated: markup for structure, CSS for responsive presentation, and JavaScript for task state, matching, validation, and persistence.

Persist the task list as JSON in browser `localStorage` under an app-specific key. Load it on startup and save after each successful change. If stored data is malformed, recover with an empty list and show a concise notice. If storage is unavailable or saving fails, keep the current session usable and tell the user that changes may not persist; never claim an unsuccessful save succeeded.

Task titles and estimates are user-provided text and numbers. Render titles as text, not executable HTML. Task data stays in this browser and is not sent to any server. Browser storage is not encrypted and can be lost if site data is cleared; users should avoid storing sensitive details.

## Repository contents

- `index.html` — accessible app structure.
- `styles.css` — responsive layout and visual styling.
- `app.js` — task management, matching, validation, and local persistence.
- `README.md` — purpose, features, local run instructions, data/privacy note, and contribution guidance.
- `LICENSE` — MIT license.

## Acceptance criteria

- A user can add a valid task and see it in the task list.
- Invalid or blank task entries are explained and not saved.
- Matching respects both time and energy limits and orders closest time fits first.
- Empty-task and no-match states offer a clear next action.
- Completing and reopening a task updates the matching lists correctly.
- Task changes survive a page reload when browser storage is available.
- The app remains usable at phone and desktop widths and with keyboard navigation.
- No task data is transmitted to a backend.

## Risks and tradeoffs

- Local-only storage is private from the app's server because there is no server, but is not encrypted and is shared with anyone using the same browser profile.
- Users may estimate duration or effort differently; the app provides a simple filter and ranking rather than claiming to make an objectively optimal decision.
- Data can be lost when browser storage is cleared. Export/import is intentionally outside the first version and can be considered later.
