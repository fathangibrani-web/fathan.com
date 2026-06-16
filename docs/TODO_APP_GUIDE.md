# 📋 Todo App - Complete Feature Guide

## Overview

A fully-featured task management application with local storage persistence, advanced filtering, and export/import capabilities.

## Features

### ✅ Core Features

- **Add Tasks** - Create tasks with title, description, priority, due date, and category
- **Edit Tasks** - Update any task details with inline editing
- **Delete Tasks** - Remove individual tasks
- **Complete Tasks** - Mark tasks as done with visual feedback
- **Local Storage** - Automatic persistence of all tasks

### 📊 Organization

- **Filter Tasks**
  - All Tasks
  - Active (incomplete)
  - Completed
  - High Priority Only

- **Sort Tasks**
  - By Date Created (newest first)
  - By Priority (high → medium → low)
  - Alphabetically

- **Search** - Real-time search across task titles, descriptions, and categories

### 📈 Statistics

- **Total Tasks** - Count of all tasks
- **Completed Tasks** - Count of finished tasks
- **Pending Tasks** - Count of incomplete tasks
- **High Priority** - Count of urgent incomplete tasks

### 🏷️ Task Properties

Each task contains:

```typescript
interface Todo {
  id: string;              // Unique identifier
  title: string;           // Required task name
  description?: string;    // Optional details
  completed: boolean;      // Status
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;        // Optional deadline
  category?: string;       // Optional grouping
  createdAt: number;       // Timestamp
  updatedAt: number;       // Last modified
}
```

### 💾 Data Management

#### Export
- Click "Export" button
- Downloads JSON file with all tasks
- Filename format: `todos-YYYY-MM-DD.json`

#### Import
- Click "Import" button
- Select previously exported JSON file
- Imports tasks and adds to existing list

#### Clear Completed
- Removes all completed tasks
- Only appears when there are completed tasks
- Requires confirmation

### 🎨 Visual Indicators

#### Priority Badges
- 🟢 **Low** - Green background
- 🟡 **Medium** - Yellow background
- 🔴 **High** - Red background

#### Status
- ✅ **Completed** - Strike-through text, grayed out
- ⚠️ **Overdue** - Red warning badge if past due date
- 📅 **Due Date** - Calendar icon with date

### 🔔 Notifications

- Success messages for:
  - Task added
  - Task updated
  - Task deleted
  - Tasks exported
  - Tasks imported
  - Completed tasks cleared

- Error messages for:
  - Missing task title
  - Import errors

## Usage Guide

### Adding a Task

1. Click **"+ Add Task"** button
2. Fill in task details:
   - **Title** (required)
   - **Description** (optional)
   - **Priority** (default: medium)
   - **Due Date** (optional)
   - **Category** (optional)
3. Click **"Add Task"** button

### Editing a Task

1. Click the ✏️ **Edit** icon on a task
2. Modify any fields
3. Click **"Update Task"**

### Completing a Task

1. Click the circle icon next to a task
2. Task moves to completed section
3. Can toggle back to active

### Deleting a Task

1. Click the 🗑️ **Delete** icon
2. Confirm deletion
3. Task is removed

### Searching Tasks

1. Type in the search box
2. Results filter in real-time
3. Searches across:
   - Task title
   - Task description
   - Category

### Filtering Tasks

1. Click the **Filter** dropdown
2. Select desired filter:
   - **All Tasks** - Show everything
   - **Active** - Only incomplete tasks
   - **Completed** - Only finished tasks
   - **High Priority** - Urgent incomplete tasks

### Sorting Tasks

1. Click the **Sort** dropdown
2. Choose sorting method:
   - **Date Created** - Newest first
   - **Priority** - Most urgent first
   - **Alphabetical** - A to Z

### Exporting Tasks

1. Click **"Export"** button
2. JSON file downloads automatically
3. File contains all task data

### Importing Tasks

1. Click **"Import"** button
2. Select a previously exported JSON file
3. Tasks are imported and added to list

## Storage Details

### LocalStorage Key

Tasks are stored under: `fathan_todos`

### Storage Capacity

- Typical limit: ~5-10MB
- Sufficient for ~10,000+ tasks
- Stored in browser (not synced)

### Data Persistence

- ✅ Survives browser refresh
- ✅ Persists between sessions
- ❌ Not synced across devices
- ❌ Lost if browser storage is cleared

## Performance Tips

1. **Regular Exports** - Backup your tasks monthly
2. **Clear Completed** - Remove finished tasks to keep list clean
3. **Categories** - Use them to organize by project/context
4. **Search** - Use search for quick task lookup

## Browser Compatibility

✅ Chrome/Chromium (latest)
✅ Firefox (latest)
✅ Safari (latest)
✅ Edge (latest)

## Keyboard Shortcuts

(Future enhancement)

## Roadmap

- [ ] Recurring tasks
- [ ] Task reminders/notifications
- [ ] Time tracking per task
- [ ] Cloud sync
- [ ] Shared tasks/collaboration
- [ ] Mobile app
- [ ] Dark mode
- [ ] Custom categories
- [ ] Tags system
- [ ] Advanced filtering (AND/OR)
- [ ] Subtasks
- [ ] Voice input

## Troubleshooting

### Tasks not saving?

1. Check browser storage is enabled
2. Clear browser cache
3. Try exporting tasks to backup
4. Check browser console for errors

### Can't import tasks?

1. Ensure JSON file is valid format
2. File should be from export button
3. Check file isn't corrupted

### App running slow?

1. Clear completed tasks
2. Export and reimport to clean up
3. Reduce number of tasks

## Technical Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **LocalStorage API** - Data persistence

## File Structure

```
src/
├── components/
│   └── TodoApp.tsx           # Main component
├── hooks/
│   └── useTodoStorage.ts     # Storage logic
├── pages/
│   └── TodoPage.tsx          # Page wrapper
└── docs/
    └── TODO_APP_GUIDE.md     # This file
```

## API Reference

### useTodoStorage Hook

```typescript
const {
  todos,              // Array of all todos
  isLoaded,          // Loading state
  addTodo,           // Add new todo
  updateTodo,        // Update existing todo
  deleteTodo,        // Delete todo
  toggleTodo,        // Mark as complete/incomplete
  clearCompleted,    // Remove all completed
  getStats,          // Get statistics
} = useTodoStorage();
```

## License

MIT
