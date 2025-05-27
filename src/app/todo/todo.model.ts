export type TodoPriority = 'Low' | 'Medium' | 'High';

export interface Todo {
  id: string;
  text: string;
  priority: TodoPriority;
  isCompleted: boolean;
  userId?: string;
}
