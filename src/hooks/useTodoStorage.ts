import { useState, useEffect, useCallback } from 'react';

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  category?: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'fathan_todos';

export const useTodoStorage = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load todos from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setTodos(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Error loading todos:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save todos to localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
      } catch (error) {
        console.error('Error saving todos:', error);
      }
    }
  }, [todos, isLoaded]);

  const addTodo = useCallback(
    (title: string, description?: string, priority: 'low' | 'medium' | 'high' = 'medium', dueDate?: string, category?: string) => {
      const newTodo: Todo = {
        id: Date.now().toString(),
        title,
        description,
        completed: false,
        priority,
        dueDate,
        category,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setTodos((prev) => [newTodo, ...prev]);
      return newTodo;
    },
    []
  );

  const updateTodo = useCallback((id: string, updates: Partial<Todo>) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id
          ? { ...todo, ...updates, updatedAt: Date.now() }
          : todo
      )
    );
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }, []);

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id
          ? { ...todo, completed: !todo.completed, updatedAt: Date.now() }
          : todo
      )
    );
  }, []);

  const clearCompleted = useCallback(() => {
    setTodos((prev) => prev.filter((todo) => !todo.completed));
  }, []);

  const getStats = useCallback(() => {
    return {
      total: todos.length,
      completed: todos.filter((t) => t.completed).length,
      pending: todos.filter((t) => !t.completed).length,
      highPriority: todos.filter((t) => t.priority === 'high' && !t.completed).length,
    };
  }, [todos]);

  return {
    todos,
    isLoaded,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    clearCompleted,
    getStats,
  };
};
