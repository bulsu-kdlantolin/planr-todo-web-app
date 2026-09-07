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

## Architecture & Experience Refinements
- **Zero Monetization & Subscription Friction**:
  - Removed all "Pro Upgrade" modals, locks, badge counters, and subscription cards. Planr is 100% free, local-first, and private.
- **Custom Sound Select Dropdown**:
  - Replaced browser-native unstyled `<select>` elements with dark-mode optimized custom `<Select>` components matching Planr design tokens, complete with instant preview triggers.
- **Modal Scrollbar Boundary Containment**:
  - Re-architected modal dialogs to use fixed outer containers with `overflow-hidden` and inner scrollable viewports (`.custom-scrollbar`), preventing scrollbar tracks from protruding beyond rounded card corners.
- **Autofocus Stability & Non-Jumping Arrow Adjustments**:
  - Isolated modal autofocus execution from render cycles so incrementing/decrementing time inputs (e.g. reminder or focus duration) does not hijack focus or scroll the viewport to the top.
- **Stacking Context & Popover Z-Index Elevation**:
  - Elevated DatePicker popovers (`z-[70]`) and isolated parent recurrence sections to ensure popover calendar date selectors sit firmly above all sibling form elements without clipping.
- **Autonomous "Today" Planning**:
  - Replaced manual "Plan for Today" buttons with automatic date-based grouping. Tasks scheduled for today are natively surfaced on Daily Overview and Today filters without manual intervention.
- **Hash Navigation Stability**:
  - Fixed an issue where submitting tasks could reset router state to Daily Overview; views now strictly maintain current view state during and after task creation.
- **Task-to-Reminder Cascade Deletion & Bidirectional Completion Sync**:
  - Reminders and tasks share a linked relationship where reminders optionally attach to tasks.
  - Marking a reminder as done (via Reminders view, Daily Overview, or alert toast action) automatically marks its connected task as completed.
  - Toggling a task in Tasks view or Daily Overview automatically syncs the completion state of any attached reminders.
- **Accurately Expressive Priority Tags**:
  - Priority levels are engineered with calibrated semantic palettes, distinct iconography, and actionable descriptions:
    - `⚡ Urgent` (P1 • Crimson/Rose alert): Immediate action required.
    - `▲ High` (P2 • Warm Amber): Important • Schedule today.
    - `◆ Medium` (P3 • Crisp Sky Blue): Standard priority.
    - `▼ Low` (P4 • Subtle Slate): Low urgency • When time permits.
  - Dropdowns in `TaskModal` and `QuickAddBar` render clear, clean labels (`⚡ Urgent`, `▲ High`, `◆ Medium`, `▼ Low`) without extra parenthetical words, while task cards and calendar inspect views display styled pill badges with descriptive tooltips.
- **Dedicated Read-Only Task Details Inspection**:
  - `TaskViewModal` is designed strictly for viewing, presenting all task details with clarity and zero accidental mutation risks:
    - Status badge (Completed with timestamp, Overdue with alert, or In Progress).
    - Expressive priority badge and category pill.
    - 4-Card Overview: Due date with relative calendar context, full recurrence cadence and end date, attached reminder notification with sound audition preview, and estimated focus duration with pomodoro session progress.
    - Notes & description formatted with preserved whitespace.
    - Subtasks summary counter, visual progress bar, and read-only checklist.
    - Creation and update audit timestamps.
    - Dedicated "Edit Task" button to seamlessly transition to the editor when changes are desired.
- **UI Simplifications**:
  - Removed "Tour" button and fields from Settings to keep preferences focused and minimal.
  - Removed "+15m" snooze button from reminder cards in Reminders view for a cleaner action bar.


