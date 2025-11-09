import { getDatabase } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = getDatabase();

    const columns = db.prepare('SELECT * FROM columns').all();
    const cards = db.prepare('SELECT * FROM cards').all();
    const boardState = db.prepare('SELECT columnOrder FROM board').get() as { columnOrder: string } | undefined;
    const columnOrder = boardState ? JSON.parse(boardState.columnOrder) : [];

    const cardsObject: Record<string, any> = {};
    (cards as any[]).forEach(card => {
      cardsObject[card.id] = card;
    });

    const formattedColumns = (columns as any[]).map(col => ({
      ...col,
      cardIds: JSON.parse(col.cardIds)
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
