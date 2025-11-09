'use client';

import { useLocalStorage } from './useLocalStorage';
import { Board, Card, Column } from '@/types/kanban';
import { v4 as uuidv4 } from 'uuid';
import { useEffect } from 'react';

const initialBoard: Board = {
  columns: [],
  cards: {},
  columnOrder: [],
};

export function useKanban() {
  const [board, setBoard] = useLocalStorage<Board>('kanban-board', initialBoard);

  // Load from database on mount
  useEffect(() => {
    const loadFromDatabase = async () => {
      try {
        const res = await fetch('/api/board');
        if (res.ok) {
          const data = await res.json();
          setBoard(data);
        }
      } catch (error) {
        console.warn('Failed to load from database, using localStorage:', error);
      }
    };

    loadFromDatabase();
  }, [setBoard]);

  // Save to database whenever board changes
  useEffect(() => {
    const saveToDatabase = async () => {
      try {
        await fetch('/api/board', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(board),
        });
      } catch (error) {
        console.warn('Failed to save to database:', error);
      }
    };

    // Only save if board has data
    if (board.columns.length > 0) {
      const timer = setTimeout(saveToDatabase, 500); // Debounce saves
      return () => clearTimeout(timer);
    }
  }, [board]);

  const initializeBoard = () => {
    // Check if board is already initialized
    if (board.columns.length === 0) {
      const defaultColumns = ['To Do', 'In Progress', 'Completed'];
      const newBoard: Board = {
        columns: defaultColumns.map((title) => ({
          id: uuidv4(),
          title,
          cardIds: [],
          createdAt: Date.now(),
        })),
        cards: {},
        columnOrder: [],
      };
      newBoard.columnOrder = newBoard.columns.map((col) => col.id);
      setBoard(newBoard);
    }
  };

  const addCard = (columnId: string, title: string, notes: string = '') => {
    const newCard: Card = {
      id: uuidv4(),
      title,
      notes,
      createdAt: Date.now(),
    };

    setBoard((prevBoard) => ({
      ...prevBoard,
      cards: {
        ...prevBoard.cards,
        [newCard.id]: newCard,
      },
      columns: prevBoard.columns.map((col) =>
        col.id === columnId
          ? { ...col, cardIds: [...col.cardIds, newCard.id] }
          : col
      ),
    }));

    return newCard.id;
  };

  const updateCard = (cardId: string, title: string, notes: string) => {
    setBoard((prevBoard) => ({
      ...prevBoard,
      cards: {
        ...prevBoard.cards,
        [cardId]: {
          ...prevBoard.cards[cardId],
          title,
          notes,
        },
      },
    }));
  };

  const deleteCard = (cardId: string) => {
    setBoard((prevBoard) => {
      const { [cardId]: _, ...remainingCards } = prevBoard.cards;
      return {
        ...prevBoard,
        cards: remainingCards,
        columns: prevBoard.columns.map((col) => ({
          ...col,
          cardIds: col.cardIds.filter((id) => id !== cardId),
        })),
      };
    });
  };

  const addColumn = (title: string) => {
    const newColumn: Column = {
      id: uuidv4(),
      title,
      cardIds: [],
      createdAt: Date.now(),
    };

    setBoard((prevBoard) => ({
      ...prevBoard,
      columns: [...prevBoard.columns, newColumn],
      columnOrder: [...prevBoard.columnOrder, newColumn.id],
    }));

    return newColumn.id;
  };

  const updateColumn = (columnId: string, title: string) => {
    setBoard((prevBoard) => ({
      ...prevBoard,
      columns: prevBoard.columns.map((col) =>
        col.id === columnId ? { ...col, title } : col
      ),
    }));
  };

  const deleteColumn = (columnId: string) => {
    setBoard((prevBoard) => {
      const columnToDelete = prevBoard.columns.find((col) => col.id === columnId);
      const cardIdsToDelete = columnToDelete?.cardIds || [];

      const { ...remainingCards } = prevBoard.cards;
      cardIdsToDelete.forEach((cardId) => {
        delete remainingCards[cardId];
      });

      return {
        ...prevBoard,
        cards: remainingCards,
        columns: prevBoard.columns.filter((col) => col.id !== columnId),
        columnOrder: prevBoard.columnOrder.filter((id) => id !== columnId),
      };
    });
  };

  const moveCard = (cardId: string, fromColumnId: string, toColumnId: string, newIndex: number) => {
    setBoard((prevBoard) => {
      const newBoard = { ...prevBoard };

      // Remove from source column
      newBoard.columns = newBoard.columns.map((col) =>
        col.id === fromColumnId
          ? { ...col, cardIds: col.cardIds.filter((id) => id !== cardId) }
          : col
      );

      // Add to destination column
      newBoard.columns = newBoard.columns.map((col) => {
        if (col.id === toColumnId) {
          const newCardIds = [...col.cardIds];
          newCardIds.splice(newIndex, 0, cardId);
          return { ...col, cardIds: newCardIds };
        }
        return col;
      });

      return newBoard;
    });
  };

  const reorderColumns = (columnIds: string[]) => {
    setBoard((prevBoard) => ({
      ...prevBoard,
      columnOrder: columnIds,
      columns: columnIds.map((id) => prevBoard.columns.find((col) => col.id === id)!).filter(Boolean),
    }));
  };

  return {
    board,
    initializeBoard,
    addCard,
    updateCard,
    deleteCard,
    addColumn,
    updateColumn,
    deleteColumn,
    moveCard,
    reorderColumns,
  };
}
