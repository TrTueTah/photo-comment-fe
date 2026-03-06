import type {
  ConfirmPhotoRequest,
  PhotoItem,
  PresignResponse,
} from "@/lib/types/api";
import { apiFetch } from "./client";

export async function getPhotos(): Promise<PhotoItem[]> {
  return apiFetch<PhotoItem[]>("/photos");
}

export async function getPhoto(id: string): Promise<PhotoItem> {
  return apiFetch<PhotoItem>(`/photos/${id}`);
}

export async function presignUpload(
  filename: string,
  contentType: string
): Promise<PresignResponse> {
  return apiFetch<PresignResponse>("/photos/presign", {
    method: "POST",
    body: JSON.stringify({ filename, contentType }),
  });
}

export async function putFileToS3(
  presignedUrl: string,
  file: File,
  contentType: string
): Promise<void> {
  const res = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });
  if (!res.ok) {
    throw new Error(
      `Upload to storage failed (${res.status}). Please try again.`
    );
  }
}

export async function confirmPhoto(
  data: ConfirmPhotoRequest
): Promise<PhotoItem> {
  return apiFetch<PhotoItem>("/photos", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function uploadPhoto(
  file: File,
  caption?: string
): Promise<PhotoItem> {
  const presign = await presignUpload(file.name, file.type);
  await putFileToS3(presign.presignedUrl, file, file.type);
  return confirmPhoto({ key: presign.key, caption: caption ?? null });
}
