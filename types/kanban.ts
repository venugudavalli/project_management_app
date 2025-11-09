export interface Card {
  id: string;
  title: string;
  notes: string;
  createdAt: number;
}

export interface Column {
  id: string;
  title: string;
  cardIds: string[];
  createdAt: number;
}

export interface Board {
  columns: Column[];
  cards: Record<string, Card>;
  columnOrder: string[];
}
