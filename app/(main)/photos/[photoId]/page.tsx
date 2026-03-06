"use client";

import { use, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Alert, Badge, Button, Divider, Spin, Typography } from "antd";
import { ArrowLeftOutlined, MessageOutlined } from "@ant-design/icons";
import { getPhoto } from "@/lib/api/photos";
import { formatApiError } from "@/lib/api/client";
import CommentPanel from "@/components/photos/CommentPanel";
import type { PhotoItem } from "@/lib/types/api";

const { Title, Text } = Typography;

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500'%3E%3Crect width='800' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23bfbfbf' font-size='20' font-family='sans-serif'%3EImage unavailable%3C/text%3E%3C/svg%3E";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface PageProps {
  params: Promise<{ photoId: string }>;
}

export default function PhotoDetailPage({ params }: PageProps) {
  const { photoId } = use(params);
  const [photo, setPhoto] = useState<PhotoItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  // Incrementing this triggers a re-fetch (e.g. after a comment is posted)
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getPhoto(photoId)
      .then((p) => { if (!cancelled) { setPhoto(p); setError(null); } })
      .catch((err) => { if (!cancelled) setError(formatApiError(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [photoId, refreshKey]);

  const handleCommentPosted = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !photo) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link href="/feed">
          <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4 pl-0">
            Back to feed
          </Button>
        </Link>
        <Alert
          message="Failed to load photo"
          description={error ?? "Photo not found."}
          type="error"
          showIcon
        />
      </div>
    );
  }

  const imageSrc = imgError ? PLACEHOLDER : photo.url;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/feed">
        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4 pl-0">
          Back to feed
        </Button>
      </Link>

      {/* Photo */}
      <div className="mb-4 w-full overflow-hidden rounded-lg bg-gray-100">
        <Image
          src={imageSrc}
          alt={photo.caption ?? "Uploaded photo"}
          width={800}
          height={500}
          unoptimized
          className="w-full object-contain"
          style={{ maxHeight: 480, height: "auto" }}
          onError={() => setImgError(true)}
        />
      </div>

      {/* Metadata */}
      <div className="mb-2 flex items-start justify-between gap-4">
        <div>
          {photo.caption && (
            <Title level={5} className="!mb-1">
              {photo.caption}
            </Title>
          )}
          <Text type="secondary" className="text-sm">
            By {photo.uploader.name} · {formatDate(photo.createdAt)}
          </Text>
        </div>
        <Badge
          count={photo.commentCount ?? 0}
          showZero
          color="geekblue"
          overflowCount={999}
        >
          <MessageOutlined className="text-lg text-gray-400" />
        </Badge>
      </div>

      <Divider />

      <CommentPanel photoId={photoId} onCommentPosted={handleCommentPosted} />
    </div>
  );
}
