export type PostVisibility = 'public' | 'friends' | 'private';

export interface Post {
  id: string; // UUID
  user_id: string; // UUID
  content: string;
  verse_ref: string; // e.g., "JHN.3.16"
  visibility: PostVisibility;
  created_at: string;
  updated_at: string;
}

export interface CreatePostDTO {
  content: string;
  verse_ref: string;
  visibility: PostVisibility;
}
