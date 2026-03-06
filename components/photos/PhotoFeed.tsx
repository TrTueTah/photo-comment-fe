"use client";

import { useEffect, useState } from "react";
import { Alert, Col, Empty, Row, Spin } from "antd";
import { getPhotos } from "@/lib/api/photos";
import { formatApiError } from "@/lib/api/client";
import PhotoCard from "./PhotoCard";
import type { PhotoItem } from "@/lib/types/api";

interface PhotoFeedProps {
  onAddPhoto?: (handler: (photo: PhotoItem) => void) => void;
}

export default function PhotoFeed({ onAddPhoto }: PhotoFeedProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPhotos()
      .then(setPhotos)
      .catch((err) => setError(formatApiError(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    onAddPhoto?.((photo) => setPhotos((prev) => [photo, ...prev]));
  }, [onAddPhoto]);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Failed to load photos"
        description={error}
        type="error"
        showIcon
        className="my-6"
      />
    );
  }

  if (photos.length === 0) {
    return (
      <Empty
        description="No photos yet — be the first to upload!"
        className="my-12"
      />
    );
  }

  return (
    <Row gutter={[16, 16]}>
      {photos.map((photo) => (
        <Col key={photo.id} xs={24} sm={12} md={8} lg={6}>
          <PhotoCard photo={photo} />
        </Col>
      ))}
    </Row>
  );
}
