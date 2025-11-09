'use client';

import { motion } from 'framer-motion';
import { Card as CardType } from '@/types/kanban';
import { Trash2, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface CardProps {
  card: CardType;
  isDragging?: boolean;
  onEdit: (cardId: string, title: string, notes: string) => void;
  onDelete: (cardId: string) => void;
}

export function Card({ card, isDragging = false, onEdit, onDelete }: CardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const [editNotes, setEditNotes] = useState(card.notes);

  const handleSave = () => {
    if (editTitle.trim()) {
      onEdit(card.id, editTitle, editNotes);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditTitle(card.title);
    setEditNotes(card.notes);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-600"
      >
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="w-full mb-2 px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md dark:bg-gray-600 dark:text-white text-sm font-medium"
          placeholder="Card title"
          autoFocus
        />
        <textarea
          value={editNotes}
          onChange={(e) => setEditNotes(e.target.value)}
          className="w-full mb-2 px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md dark:bg-gray-600 dark:text-white text-sm resize-none"
          placeholder="Notes"
          rows={3}
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={handleCancel}
            className="px-3 py-1 text-sm rounded-md bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1 text-sm rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            Save
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: isDragging ? 1 : 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`group bg-white dark:bg-gray-700 rounded-lg p-4 shadow-md hover:shadow-lg transition-all duration-200 cursor-grab active:cursor-grabbing border border-gray-200 dark:border-gray-600 ${
        isDragging ? 'opacity-50 shadow-xl scale-105' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex-1 break-words">{card.title}</h3>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            title="Edit card"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onDelete(card.id)}
            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 hover:text-red-700"
            title="Delete card"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {card.notes && (
        <div className="mb-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
          >
            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Notes
          </button>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 p-2 bg-gray-50 dark:bg-gray-600 rounded text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words"
            >
              {card.notes}
            </motion.div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-3">
        <time className="text-xs text-gray-400 dark:text-gray-500">
          {new Date(card.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </time>
      </div>
    </motion.div>
  );
}
