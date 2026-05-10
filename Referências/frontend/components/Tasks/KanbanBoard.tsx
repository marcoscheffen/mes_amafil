import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import type { Task, TaskStatus } from '../../types';
import * as tasksService from '../../services/tasksService';

interface KanbanBoardProps {
  statuses: TaskStatus[];
  tasks: Task[];
  onAddTask: (statusId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onTasksChange: (tasks: Task[]) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  statuses,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onTasksChange,
}) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const getTasksByStatus = (statusId: string) =>
    tasks
      .filter(t => t.status_id === statusId)
      .sort((a, b) => a.position - b.position);

  const findStatusByTaskId = (taskId: string) =>
    tasks.find(t => t.id === taskId)?.status_id;

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    const activeStatusId = findStatusByTaskId(activeId);
    // over could be a status column id or another task id
    const overStatusId = statuses.find(s => s.id === overId)?.id
      ?? findStatusByTaskId(overId);

    if (!activeStatusId || !overStatusId) return;

    const activeItems = getTasksByStatus(activeStatusId);
    const overItems = getTasksByStatus(overStatusId);

    let newTasks: Task[];
    let newPosition: number;

    if (activeStatusId === overStatusId) {
      // Reorder within same column
      const oldIdx = activeItems.findIndex(t => t.id === activeId);
      const newIdx = activeItems.findIndex(t => t.id === overId);
      if (oldIdx === -1 || newIdx === -1) return;

      const reordered = arrayMove(activeItems, oldIdx, newIdx) as Task[];
      newPosition = newIdx + 1;
      newTasks = tasks.map(t => {
        const found = reordered.find(r => r.id === t.id);
        if (found) return { ...t, position: reordered.indexOf(found) + 1 };
        return t;
      });
    } else {
      // Move to different column
      const overIdx = overItems.findIndex(t => t.id === overId);
      newPosition = overIdx >= 0 ? overIdx + 1 : overItems.length + 1;
      newTasks = tasks.map(t => {
        if (t.id === activeId) return { ...t, status_id: overStatusId, position: newPosition };
        return t;
      });
    }

    onTasksChange(newTasks);

    try {
      await tasksService.moveTask(activeId, overStatusId, newPosition);
    } catch (err) {
      console.error('Erro ao mover tarefa:', err);
      onTasksChange(tasks); // rollback
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        {statuses.map(status => (
          <KanbanColumn
            key={status.id}
            status={status}
            tasks={getTasksByStatus(status.id)}
            onAddTask={onAddTask}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
          />
        ))}

        {statuses.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
            <div className="text-center">
              <span className="material-symbols-outlined text-4xl block mb-2">view_kanban</span>
              Nenhuma etapa configurada.
            </div>
          </div>
        )}
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="rotate-2 scale-105 opacity-90">
            <KanbanCard
              task={activeTask}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
