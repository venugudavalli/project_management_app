'use client';

import { useEffect, useState, useRef } from 'react';
import { Board, Card, Column } from '@/types/kanban';
import { v4 as uuidv4 } from 'uuid';

const initialBoard: Board = {
  columns: [],
  cards: {},
  columnOrder: [],
};

export function useKanban() {
  const [board, setBoard] = useState<Board>(initialBoard);
  const [isLoaded, setIsLoaded] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');

  // Load board from database on mount
  useEffect(() => {
    const loadBoard = async () => {
      try {
        const response = await fetch('/api/board');
        if (response.ok) {
          const data = await response.json();
          if (data.columns && data.columns.length > 0) {
            const boardData = {
              columns: data.columns,
              cards: data.cards,
              columnOrder: data.columnOrder,
            };
            setBoard(boardData);
            lastSavedRef.current = JSON.stringify(data);
            setIsLoaded(true);
            return;
          }
        }
      } catch (error) {
        console.warn('Failed to load board from database, using defaults:', error);
      }

      // Initialize with default columns if database is empty
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

      // Set board first, then mark as loaded to trigger save effect
      setBoard(newBoard);
      // Schedule isLoaded to be set in next render to ensure board is set first
      setTimeout(() => {
        setIsLoaded(true);
      }, 0);
    };

    loadBoard();
  }, []);

  // Save board to database with debouncing
  useEffect(() => {
    if (!isLoaded || board.columns.length === 0) return;

    const boardString = JSON.stringify(board);

    // Only save if board has actually changed
    if (boardString === lastSavedRef.current) return;

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch('/api/board', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(board),
        });
        if (response.ok) {
          lastSavedRef.current = boardString;
          console.log('Board saved to database');
        } else {
          console.error('Failed to save board:', response.status);
        }
      } catch (error) {
        console.error('Failed to save board to database:', error);
      }
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [board, isLoaded]);

  // Initialize default columns on first load
  const initializeBoard = () => {
    // This function is kept for backward compatibility but is now handled in useEffect above
    if (!isLoaded) {
      setIsLoaded(true);
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
