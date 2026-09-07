# Planr Product & Feature Specifications

## Recurrence Engine & Series Management
- **Recurrence Options**: Once, Daily, Weekdays, Weekly, Monthly, Custom.
- **Customization**:
  - Custom interval support (e.g. Every N days, weeks, months).
  - Weekday picker buttons for multi-day recurrence (M, T, W, T, F, S, S).
  - Optional end date for finite recurrence rules.
- **Idempotent Completion Engine**:
  - Toggling a repeating task complete checks for existing uncompleted occurrences in the series to prevent duplicates.
  - Unchecking a completed repeating task automatically rolls back the pending future occurrence created by that task.
- **Batch Deletion & Stop Recurrence**:
  - Deleting a repeating task prompts between "Delete Only This" and "Delete Entire Series".
  - "Stop Repeating" action converts repeating tasks into standalone tasks without deleting past history.

## Calendar View Interactions
- **Task Chip Sliding Actions**:
  - Clicking on a task chip in any date cell smoothly reveals an action bar with three buttons:
    1. **View** (Eye icon): Opens the Task Details modal.
    2. **Edit** (Edit2 icon): Opens the Task Modal.
    3. **Delete** (Trash2 icon): Opens delete confirmation dialog.
- **Day Inspector**:
  - Unified actions on each task row: View, Edit, Delete.

## Task Details (View Mode)
- **TaskViewModal**:
  - Replaces timer focus button on task cards with a dedicated "View" (Eye) action.
  - Displays full task properties: status badge, title with completion toggle, priority, category, due date, human-readable recurrence rule with "Stop Repeating", notes/details, subtasks progress with interactive checkboxes, and estimated focus time.

## Audio Chimes & Reminder Sound Options
- **Multi-Tone Procedural DSP Synthesizer**:
  - 100% offline, Web Audio API synthesis without external audio files:
    1. **Gentle Chime**: Solfeggio harmonic overtone chime (warm meditative resonance).
    2. **Zen Bell**: Singing bowl / temple bell with 440Hz fundamental and exponential decay shimmer.
    3. **Warm Marimba**: Dual-strike melodic acoustic wood tones (C5 -> G5).
    4. **Digital Beep**: Snappy dual-tone electronic chime (880Hz -> 1175Hz).
    5. **Soft Harp**: Plucked string ascending arpeggio chord (C5, E5, G5, B5).
- **In-Modal Audition Preview**:
  - Instant "Test" button beside the sound dropdown in `ReminderModal` and `TaskModal` to audition sounds prior to saving.
- **Reminder Card Audio Badge**:
  - Displays selected sound tag on reminder cards with one-click preview testing.
- **Global Audio Alerts Hook**:
  - `useReminderAlerts` watches active reminders and triggers sound + system notification + interactive toast upon scheduled time.

## Task Creation & Scheduling Enhancements
- **Spacious Repeat Bar**:
  - Full-width grid container with comfortable padding (`p-1.5`) and generous gap (`gap-2`) allowing multi-letter options like "Weekdays" and "Monthly" to breathe cleanly without text squeezing.
- **Add to Reminders in Task Creation**:
  - Built-in toggle inside `TaskModal` to seamlessly schedule a corresponding reminder with customized time and sound choice upon creating or editing a task.
