import type { Comment, PostCommentRequest } from "@/lib/types/api";
import { apiFetch } from "./client";

export async function getComments(photoId: string): Promise<Comment[]> {
  return apiFetch<Comment[]>(`/photos/${photoId}/comments`);
}

export async function postComment(
  photoId: string,
  data: PostCommentRequest
): Promise<Comment> {
  return apiFetch<Comment>(`/photos/${photoId}/comments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
