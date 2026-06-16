import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Edit2,
  X,
  Zap,
  Filter,
  Download,
  Upload,
  Trash,
} from 'lucide-react';
import { useTodoStorage, Todo } from '../hooks/useTodoStorage';

type FilterType = 'all' | 'active' | 'completed' | 'high';
type SortType = 'date' | 'priority' | 'alphabetical';

export default function TodoApp() {
  const { todos, isLoaded, addTodo, updateTodo, deleteTodo, toggleTodo, clearCompleted, getStats } =
    useTodoStorage();
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    dueDate: '',
    category: '',
  });
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: 'success' | 'error' }>>([
  ]);

  const stats = getStats();

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showNotification('Task title is required', 'error');
      return;
    }

    if (editingId) {
      updateTodo(editingId, {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        dueDate: formData.dueDate,
        category: formData.category,
      });
      showNotification('Task updated');
      setEditingId(null);
    } else {
      addTodo(
        formData.title,
        formData.description,
        formData.priority,
        formData.dueDate,
        formData.category
      );
      showNotification('Task added');
    }

    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      category: '',
    });
    setShowForm(false);
  };

  const handleEditTodo = (todo: Todo) => {
    setFormData({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      dueDate: todo.dueDate || '',
      category: todo.category || '',
    });
    setEditingId(todo.id);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      category: '',
    });
    setShowForm(false);
  };

  // Filter todos
  const filteredTodos = useMemo(() => {
    let result = todos;

    // Apply filter
    if (filter === 'active') {
      result = result.filter((t) => !t.completed);
    } else if (filter === 'completed') {
      result = result.filter((t) => t.completed);
    } else if (filter === 'high') {
      result = result.filter((t) => t.priority === 'high' && !t.completed);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.category?.toLowerCase().includes(query)
      );
    }

    // Apply sort
    result.sort((a, b) => {
      if (sort === 'date') {
        return b.createdAt - a.createdAt;
      } else if (sort === 'priority') {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      } else if (sort === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }, [todos, filter, sort, searchQuery]);

  const exportTodos = () => {
    const dataStr = JSON.stringify(todos, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `todos-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Todos exported');
  };

  const importTodos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data)) {
          data.forEach((todo) => {
            addTodo(
              todo.title,
              todo.description,
              todo.priority || 'medium',
              todo.dueDate,
              todo.category
            );
          });
          showNotification(`${data.length} todos imported`);
        }
      } catch (error) {
        showNotification('Error importing todos', 'error');
      }
    };
    reader.readAsText(file);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      {/* Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`p-4 rounded-lg shadow-lg text-white ${
              notif.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          >
            {notif.message}
          </div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">📋 My Tasks</h1>
          <p className="text-slate-600">Stay organized and productive</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total" value={stats.total} color="bg-blue-100 text-blue-700" />
          <StatCard label="Completed" value={stats.completed} color="bg-emerald-100 text-emerald-700" />
          <StatCard label="Pending" value={stats.pending} color="bg-amber-100 text-amber-700" />
          <StatCard label="High Priority" value={stats.highPriority} color="bg-red-100 text-red-700" />
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="🔍 Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-fit">
                <label className="text-sm text-slate-600 mb-1 block">Filter:</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as FilterType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Tasks</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              <div className="flex-1 min-w-fit">
                <label className="text-sm text-slate-600 mb-1 block">Sort:</label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="date">Date Created</option>
                  <option value="priority">Priority</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus size={20} />
                <span>Add Task</span>
              </button>

              {stats.completed > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Clear all completed tasks?')) {
                      clearCompleted();
                      showNotification('Completed tasks cleared');
                    }
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
                >
                  <Trash size={20} />
                  <span>Clear Completed</span>
                </button>
              )}

              <button
                onClick={exportTodos}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
              >
                <Download size={20} />
                <span>Export</span>
              </button>

              <label className="flex items-center space-x-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors cursor-pointer">
                <Upload size={20} />
                <span>Import</span>
                <input type="file" accept=".json" onChange={importTodos} hidden />
              </label>
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-2 border-indigo-200">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              {editingId ? '✏️ Edit Task' : '➕ Add New Task'}
            </h2>
            <form onSubmit={handleAddTodo} className="space-y-4">
              <input
                type="text"
                placeholder="Task title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <textarea
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-20"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Category</label>
                  <input
                    type="text"
                    placeholder="e.g., Work, Personal"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                >
                  {editingId ? 'Update Task' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Todo List */}
        <div className="space-y-3">
          {filteredTodos.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Zap size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg">
                {searchQuery ? 'No tasks match your search' : 'No tasks yet. Add one to get started!'}
              </p>
            </div>
          ) : (
            filteredTodos.map((todo) => <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} onEdit={handleEditTodo} onDelete={deleteTodo} />)
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`${color} rounded-lg shadow p-4 text-center`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function TodoItem({
  todo,
  onToggle,
  onEdit,
  onDelete,
}: {
  todo: Todo;
  onToggle: (id: string) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
}) {
  const priorityColors = {
    low: 'bg-green-50 border-green-200',
    medium: 'bg-yellow-50 border-yellow-200',
    high: 'bg-red-50 border-red-200',
  };

  const priorityBadge = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700',
  };

  const priorityEmoji = {
    low: '🟢',
    medium: '🟡',
    high: '🔴',
  };

  const isOverdue =
    todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed;

  return (
    <div
      className={`${
        priorityColors[todo.priority]
      } border-2 rounded-lg p-4 transition-all hover:shadow-md`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(todo.id)}
          className="flex-shrink-0 mt-1 focus:outline-none"
        >
          {todo.completed ? (
            <CheckCircle2 size={24} className="text-emerald-600" />
          ) : (
            <Circle size={24} className="text-slate-400 hover:text-indigo-600" />
          )}
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={`text-lg font-semibold ${
                todo.completed
                  ? 'text-slate-400 line-through'
                  : 'text-slate-800'
              }`}
            >
              {todo.title}
            </h3>
            <span className={`${priorityBadge[todo.priority]} px-2 py-1 rounded text-xs font-semibold`}>
              {priorityEmoji[todo.priority]} {todo.priority}
            </span>
            {todo.category && (
              <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-medium">
                {todo.category}
              </span>
            )}
            {isOverdue && (
              <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">
                ⚠️ Overdue
              </span>
            )}
          </div>

          {todo.description && (
            <p className={`text-sm mt-2 ${
              todo.completed ? 'text-slate-400 line-through' : 'text-slate-600'
            }`}>
              {todo.description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            {todo.dueDate && (
              <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                📅 {new Date(todo.dueDate).toLocaleDateString()}
              </span>
            )}
            <span>Created {formatDate(new Date(todo.createdAt))}</span>
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => onEdit(todo)}
            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={() => {
              if (confirm('Delete this task?')) {
                onDelete(todo.id);
              }
            }}
            className="p-2 text-slate-600 hover:text-red-600 hover:bg-white rounded-lg transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDate(date: Date): string {
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}
