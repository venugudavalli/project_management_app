'use client';

import { useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { Column as ColumnType, Card as CardType } from '@/types/kanban';
import { Card } from './Card';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { useState } from 'react';

interface ColumnProps {
  column: ColumnType;
  cards: CardType[];
  onAddCard: (columnId: string, title: string, notes: string) => void;
  onEditCard: (cardId: string, title: string, notes: string) => void;
  onDeleteCard: (cardId: string) => void;
  onEditColumn: (columnId: string, title: string) => void;
  onDeleteColumn: (columnId: string) => void;
  isDraggedOver?: boolean;
}

export function Column({
  column,
  cards,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onEditColumn,
  onDeleteColumn,
  isDraggedOver = false,
}: ColumnProps) {
  const { setNodeRef } = useDroppable({ id: column.id });
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardNotes, setNewCardNotes] = useState('');
  const [isEditingColumn, setIsEditingColumn] = useState(false);
  const [editColumnTitle, setEditColumnTitle] = useState(column.title);

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      onAddCard(column.id, newCardTitle, newCardNotes);
      setNewCardTitle('');
      setNewCardNotes('');
      setIsAddingCard(false);
    }
  };

  const handleEditColumn = () => {
    if (editColumnTitle.trim()) {
      onEditColumn(column.id, editColumnTitle);
      setIsEditingColumn(false);
    }
  };

  return (
    <motion.div
      layout
      ref={setNodeRef}
      className={`flex flex-col h-full bg-gradient-to-b from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 transition-all duration-200 ${
        isDraggedOver ? 'ring-2 ring-blue-400 shadow-lg scale-[1.02]' : ''
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 group">
        {isEditingColumn ? (
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={editColumnTitle}
              onChange={(e) => setEditColumnTitle(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm font-semibold"
              placeholder="Column title"
              autoFocus
            />
            <button
              onClick={handleEditColumn}
              className="px-3 py-1 text-sm rounded-md bg-blue-500 text-white hover:bg-blue-600"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditColumnTitle(column.title);
                setIsEditingColumn(false);
              }}
              className="px-3 py-1 text-sm rounded-md bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{column.title}</h2>
              <span className="bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs font-semibold">
                {cards.length}
              </span>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setIsEditingColumn(true)}
                className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                title="Edit column"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => onDeleteColumn(column.id)}
                className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 hover:text-red-700"
                title="Delete column"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Cards Container */}
      <motion.div className="flex-1 space-y-3 overflow-y-auto pr-2 min-h-0">
        {cards.map((card) => (
          <Card
            key={card.id}
            card={card}
            onEdit={onEditCard}
            onDelete={onDeleteCard}
          />
        ))}
      </motion.div>

      {/* Add Task Section */}
      {isAddingCard ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mt-4 bg-white dark:bg-gray-700 rounded-lg p-3 shadow-md border border-gray-200 dark:border-gray-600"
        >
          <input
            type="text"
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            className="w-full mb-2 px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400"
            placeholder="Task title"
            autoFocus
          />
          <textarea
            value={newCardNotes}
            onChange={(e) => setNewCardNotes(e.target.value)}
            className="w-full mb-3 px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm resize-none placeholder:text-gray-500 dark:placeholder:text-gray-400"
            placeholder="Add notes (optional)"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddCard}
              className="flex-1 px-3 py-2 text-sm rounded-md bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
            >
              Add Task
            </button>
            <button
              onClick={() => {
                setIsAddingCard(false);
                setNewCardTitle('');
                setNewCardNotes('');
              }}
              className="flex-1 px-3 py-2 text-sm rounded-md bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsAddingCard(true)}
          className="mt-4 w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-white/50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 border-dashed text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all font-medium group"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-200" />
          Add Task
        </motion.button>
      )}
    </motion.div>
  );
}
