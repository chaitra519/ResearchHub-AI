export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Workspace {
  id: number;
  name: string;
  description?: string;
  user_id: number;
}

export interface Paper {
  id: number;
  title: string;
  authors?: string;
  abstract?: string;
  source?: string;
  pdf_url?: string;
  workspace_id: number;
}

export interface Conversation {
  id: number;
  workspace_id: number;
  question: string;
  answer: string;
  timestamp: string;
}

export interface Document {
  id: number;
  workspace_id: number;
  filename: string;
  content: string;
  summary?: string;
}

export interface ArXivPaper {
  title: string;
  authors: string;
  abstract: string;
  source: string;
  pdf_url: string;
  year: string;
}
