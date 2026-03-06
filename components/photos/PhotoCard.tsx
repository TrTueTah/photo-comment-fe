"use client";

import { Badge, Card, Image, Typography } from "antd";
import { MessageOutlined } from "@ant-design/icons";
import Link from "next/link";
import type { PhotoItem } from "@/lib/types/api";

const { Text } = Typography;

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23bfbfbf' font-size='16' font-family='sans-serif'%3EImage unavailable%3C/text%3E%3C/svg%3E";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PhotoCard({ photo }: { photo: PhotoItem }) {
  return (
    <Link href={`/photos/${photo.id}`} className="block">
      <Card
        hoverable
        cover={
          <Image
            src={photo.url}
            alt={photo.caption ?? "Uploaded photo"}
            fallback={PLACEHOLDER}
            preview={false}
            style={{ maxHeight: 280, width: "100%", objectFit: "cover" }}
          />
        }
        className="h-full"
      >
        {photo.caption && (
          <Text className="mb-2 block text-sm text-gray-700">
            {photo.caption}
          </Text>
        )}
        <div className="flex items-center justify-between">
          <Text type="secondary" className="text-xs">
            {photo.uploader.name} · {formatDate(photo.createdAt)}
          </Text>
          <Badge
            count={photo.commentCount ?? 0}
            showZero
            color="geekblue"
            overflowCount={999}
          >
            <MessageOutlined className="text-gray-400" />
          </Badge>
        </div>
      </Card>
    </Link>
  );
}
