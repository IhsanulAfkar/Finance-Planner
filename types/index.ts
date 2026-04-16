export type TArticleCategory = {
  id: number;
  name: string;
};
export type TArticle = {
  id: number;
  uuid: string;
  category_id: number;
  slug: string;
  title: string;
  content: string;
  images: TArticleImage[];
  created_at: string;
  category: TArticleCategory;
};
export type TArticleImage = {
  id: number;
  article_id: number;
  url: string;
};

export type TResponseMeta<T = any> = {
  data: T;
  message: string;
  status: number;
};
export interface Todo {
  id: string;
  userId: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  category: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  aiSuggested?: {
    priority?: boolean;
    category?: boolean;
    dueDate?: boolean;
  };
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  action?: {
    type: "create" | "update" | "delete" | "query";
    todoId?: string;
    details?: string;
  };
}

export type TPaginationMeta = {
  total: number,
  page: number,
  limit: number,
  totalPages: number,
}
export type TPaginatedResponse<T = any> = {
  data: T[],
  meta: TPaginationMeta
}