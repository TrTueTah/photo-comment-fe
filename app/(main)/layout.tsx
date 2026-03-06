"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout, Spin } from "antd";
import { useAuth } from "@/lib/auth/context";
import AppNav from "@/components/shared/AppNav";
import UploadModal from "@/components/photos/UploadModal";
import type { PhotoItem } from "@/lib/types/api";

const { Content } = Layout;

interface FeedContextValue {
  registerAddPhoto: (fn: (photo: PhotoItem) => void) => void;
}

const FeedContext = createContext<FeedContextValue | null>(null);

export function useFeedContext() {
  const ctx = useContext(FeedContext);
  if (!ctx) throw new Error("useFeedContext must be used inside (main) layout");
  return ctx;
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [uploadOpen, setUploadOpen] = useState(false);
  const addPhotoRef = useRef<((photo: PhotoItem) => void) | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  const registerAddPhoto = useCallback((fn: (photo: PhotoItem) => void) => {
    addPhotoRef.current = fn;
  }, []);

  const handleUploadSuccess = (photo: PhotoItem) => {
    // POST /photos response has no commentCount — default to 0 at creation
    addPhotoRef.current?.({ ...photo, commentCount: 0 });
    setUploadOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <FeedContext.Provider value={{ registerAddPhoto }}>
      <Layout className="min-h-screen" style={{ minHeight: "100vh" }}>
        <AppNav onUploadClick={() => setUploadOpen(true)} />
        <Content className="mx-auto w-full max-w-6xl px-4 py-6">
          {children}
        </Content>
      </Layout>
      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </FeedContext.Provider>
  );
}
