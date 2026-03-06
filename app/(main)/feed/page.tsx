"use client";

import { useCallback } from "react";
import PhotoFeed from "@/components/photos/PhotoFeed";
import { useFeedContext } from "@/app/(main)/layout";
import type { PhotoItem } from "@/lib/types/api";

export default function FeedPage() {
  const { registerAddPhoto } = useFeedContext();

  const handleRegister = useCallback(
    (fn: (photo: PhotoItem) => void) => {
      registerAddPhoto(fn);
    },
    [registerAddPhoto]
  );

  return <PhotoFeed onAddPhoto={handleRegister} />;
}
