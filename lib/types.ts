export type Category =
  | "gaming"
  | "technology"
  | "markets"
  | "automotive"
  | "sports"
  | "security";

export type Importance = "lead" | "main" | "regular";

export type Verification = "confirmed" | "reported" | "claim" | "unverified";

export interface SourceInput {
  name: string;
  url: string;
}

export interface Source extends SourceInput {
  id: string;
}

export interface ArticleInput {
  id?: string;
  slug?: string;
  headline: string;
  summary: string;
  content?: string | null;
  imageUrl?: string | null;
  importance?: Importance;
  verification?: Verification;
  sources?: SourceInput[];
}

export interface Article {
  id: string;
  editionId: string;
  slug: string;
  category: Category;
  headline: string;
  summary: string;
  content: string | null;
  imageUrl: string | null;
  importance: Importance;
  verification: Verification;
  sortOrder: number;
  sources: Source[];
  createdAt: string;
  updatedAt: string;
}

export interface SectionInput {
  category: Category;
  title: string;
  items: ArticleInput[];
}

export interface Section {
  category: Category;
  title: string;
  items: Article[];
}

export interface EditionInput {
  date: string;
  title: string;
  dailySummary: string;
  leadStoryId?: string | null;
  sections: SectionInput[];
}

export interface Edition {
  id: string;
  date: string;
  title: string;
  dailySummary: string;
  leadStoryId: string | null;
  sections: Section[];
  createdAt: string;
  updatedAt: string;
}

export interface EditionListItem {
  date: string;
  title: string;
}
