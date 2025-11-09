'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
} from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { useKanban } from '@/hooks/useKanban';
import { Column } from './Column';
import { Card } from './Card';
import { Plus } from 'lucide-react';
import { Card as CardType } from '@/types/kanban';

export function Board() {
  const { board, initializeBoard, addCard, updateCard, deleteCard, addColumn, updateColumn, deleteColumn, moveCard } = useKanban();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedCard, setDraggedCard] = useState<CardType | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      distance: 8,
    } as any)
  );

  const memoInitializeBoard = useCallback(() => {
    initializeBoard();
    setIsLoaded(true);
  }, [initializeBoard]);

  useEffect(() => {
    memoInitializeBoard();
  }, [memoInitializeBoard]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    const card = Object.values(board.cards).find((c) => c.id === active.id);
    if (card) {
      setDraggedCard(card);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setDraggedCard(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the card being dragged
    const card = Object.values(board.cards).find((c) => c.id === activeId);
    if (!card) return;

    // Find which column the card is in
    const fromColumn = board.columns.find((col) => col.cardIds.includes(activeId));
    if (!fromColumn) return;

    // Find the target - could be a column or another card
    const toColumn = board.columns.find((col) => col.id === overId);
    const overCard = Object.values(board.cards).find((c) => c.id === overId);
    
    // Determine target column
    let toColumnId: string | undefined = toColumn?.id;
    if (!toColumnId && overCard) {
      // If dragging over a card, find its column
      toColumnId = board.columns.find((col) => col.cardIds.includes(overId))?.id;
    }

    if (!toColumnId) return;

    // Move to end of target column (no reordering within columns)
    const targetColumn = board.columns.find((col) => col.id === toColumnId);
    if (!targetColumn) return;

    moveCard(activeId, fromColumn.id, toColumnId, targetColumn.cardIds.length);
  };

  const handleAddColumn = () => {
    if (newColumnTitle.trim()) {
      addColumn(newColumnTitle);
      setNewColumnTitle('');
      setIsAddingColumn(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-gray-600 border-t-blue-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Project Management
          </h1>
          <p className="text-gray-400">Organize your tasks with vibe</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-cols-max overflow-x-auto pb-4"
        >
          {board.columnOrder.map((columnId) => {
            const column = board.columns.find((col) => col.id === columnId);
            if (!column) return null;

            const cards = column.cardIds.map((cardId) => board.cards[cardId]).filter(Boolean);
            const isDraggedOverColumn = activeId !== null && board.columns.find((col) => col.id === columnId)?.id === activeId;

            return (
              <motion.div key={column.id} layout className="min-w-[350px] h-[600px]">
                <Column
                  column={column}
                  cards={cards}
                  onAddCard={addCard}
                  onEditCard={updateCard}
                  onDeleteCard={deleteCard}
                  onEditColumn={updateColumn}
                  onDeleteColumn={deleteColumn}
                  isDraggedOver={isDraggedOverColumn}
                />
              </motion.div>
            );
          })}

          {isAddingColumn ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="min-w-[350px] h-[600px]"
            >
              <div className="h-full bg-gradient-to-b from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <input
                    type="text"
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-semibold mb-4 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    placeholder="Column title"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddColumn}
                    className="flex-1 px-3 py-2 text-sm rounded-md bg-blue-500 text-white font-medium hover:bg-blue-600"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingColumn(false);
                      setNewColumnTitle('');
                    }}
                    className="flex-1 px-3 py-2 text-sm rounded-md bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAddingColumn(true)}
              className="min-w-[350px] h-32 rounded-xl border-2 border-dashed border-gray-600 hover:border-blue-400 bg-gray-800/50 hover:bg-gray-800 transition-all flex items-center justify-center gap-3 text-gray-400 hover:text-blue-400 font-medium group"
            >
              <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
              Add Column
            </motion.button>
          )}
        </motion.div>
      </div>

      <DragOverlay>
        {draggedCard ? (
          <motion.div className="opacity-90 scale-105">
            <Card
              card={draggedCard}
              isDragging={true}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          </motion.div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
