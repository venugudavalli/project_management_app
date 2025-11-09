import { getDatabase } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = getDatabase();

    let columns = db.prepare('SELECT * FROM columns').all() as any[];
    let cards = db.prepare('SELECT * FROM cards').all() as any[];
    let boardState = db.prepare('SELECT columnOrder FROM board').get() as { columnOrder: string } | undefined;

    // If no columns exist, initialize with default columns
    if (columns.length === 0) {
      const { v4: uuidv4 } = require('uuid');
      const defaultColumns = ['To Do', 'In Progress', 'Completed'];
      const now = Date.now();

      const insertColumn = db.prepare('INSERT INTO columns (id, title, cardIds, createdAt) VALUES (?, ?, ?, ?)');
      const columnIds: string[] = [];

      defaultColumns.forEach((title: string) => {
        const id = uuidv4();
        columnIds.push(id);
        insertColumn.run(id, title, JSON.stringify([]), now);
      });

      // Clear and reinitialize board state with column order
      db.prepare('DELETE FROM board').run();
      db.prepare('INSERT INTO board (columnOrder) VALUES (?)').run(JSON.stringify(columnIds));

      columns = defaultColumns.map((title: string, index: number) => ({
        id: columnIds[index],
        title,
        cardIds: [],
        createdAt: now,
      }));
      boardState = { columnOrder: JSON.stringify(columnIds) };
    }

    const columnOrder = boardState ? JSON.parse(boardState.columnOrder) : [];

    const cardsObject: Record<string, any> = {};
    (cards as any[]).forEach(card => {
      cardsObject[card.id] = card;
    });

    const formattedColumns = (columns as any[]).map(col => ({
      ...col,
      cardIds: col.cardIds ? (typeof col.cardIds === 'string' ? JSON.parse(col.cardIds) : col.cardIds) : []
    }));

    return NextResponse.json({
      columns: formattedColumns,
      cards: cardsObject,
      columnOrder
    });
  } catch (error) {
    console.error('Error fetching board:', error);
    return NextResponse.json({ error: 'Failed to fetch board' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { columns, cards, columnOrder } = await req.json();
    const db = getDatabase();

    db.prepare('DELETE FROM columns').run();
    db.prepare('DELETE FROM cards').run();
    db.prepare('DELETE FROM board').run();

    const insertColumn = db.prepare('INSERT INTO columns (id, title, cardIds, createdAt) VALUES (?, ?, ?, ?)');
    columns.forEach((col: any) => {
      insertColumn.run(col.id, col.title, JSON.stringify(col.cardIds), col.createdAt);
    });

    const insertCard = db.prepare('INSERT INTO cards (id, title, notes, createdAt) VALUES (?, ?, ?, ?)');
    Object.entries(cards).forEach(([id, card]: [string, any]) => {
      insertCard.run(id, card.title, card.notes, card.createdAt);
    });

    db.prepare('INSERT INTO board (columnOrder) VALUES (?)').run(JSON.stringify(columnOrder));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving board:', error);
    return NextResponse.json({ error: 'Failed to save board' }, { status: 500 });
  }
}
