"use client";

import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Button,
  Empty,
  Form,
  Input,
  List,
  Spin,
  Typography,
} from "antd";
import { UserOutlined } from "@ant-design/icons";
import { getComments, postComment } from "@/lib/api/comments";
import { formatApiError } from "@/lib/api/client";
import type { Comment } from "@/lib/types/api";

const { Text } = Typography;
const { TextArea } = Input;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface CommentPanelProps {
  photoId: string;
  onCommentPosted?: () => void;
}

interface CommentFormValues {
  content: string;
}

export default function CommentPanel({ photoId, onCommentPosted }: CommentPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [form] = Form.useForm<CommentFormValues>();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getComments(photoId)
      .then(setComments)
      .catch((err) => setFetchError(formatApiError(err)))
      .finally(() => setLoading(false));
  }, [photoId]);

  const handleSubmit = async (values: CommentFormValues) => {
    const content = values.content.trim();
    if (!content) return; // guard — Ant Design rule also covers this

    setSubmitError(null);
    setSubmitting(true);
    try {
      const comment = await postComment(photoId, { content });
      setComments((prev) => [...prev, comment]);
      form.resetFields();
      onCommentPosted?.();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err) {
      setSubmitError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Text strong className="mb-3 block text-base">
        Comments
      </Text>

      {loading && (
        <div className="flex justify-center py-6">
          <Spin />
        </div>
      )}

      {fetchError && (
        <Alert
          message="Failed to load comments"
          description={fetchError}
          type="error"
          showIcon
          className="mb-4"
        />
      )}

      {!loading && !fetchError && comments.length === 0 && (
        <Empty
          description="No comments yet — be the first!"
          imageStyle={{ height: 48 }}
          className="my-4"
        />
      )}

      {comments.length > 0 && (
        <List
          itemLayout="horizontal"
          dataSource={comments}
          renderItem={(c) => (
            <List.Item key={c.id} className="!px-0">
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} size="small" />}
                title={
                  <span className="text-sm font-medium">{c.author.name}</span>
                }
                description={
                  <div>
                    <p className="mb-1 whitespace-pre-wrap text-sm text-gray-800">
                      {c.content}
                    </p>
                    <Text type="secondary" className="text-xs">
                      {formatDate(c.createdAt)}
                    </Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}

      <div ref={bottomRef} />

      <Form
        form={form}
        onFinish={handleSubmit}
        className="mt-4"
        requiredMark={false}
      >
        {submitError && (
          <Form.Item>
            <Alert message={submitError} type="error" showIcon />
          </Form.Item>
        )}
        <Form.Item
          name="content"
          rules={[
            { required: true, message: "Comment cannot be empty" },
            {
              validator: (_, value: string) =>
                value && value.trim().length === 0
                  ? Promise.reject("Comment cannot be blank")
                  : Promise.resolve(),
            },
            { max: 2000, message: "Comment must be 2000 characters or fewer" },
          ]}
        >
          <TextArea
            placeholder="Write a comment…"
            autoSize={{ minRows: 2, maxRows: 6 }}
            maxLength={2000}
            showCount
            disabled={submitting}
          />
        </Form.Item>
        <Form.Item className="mb-0 text-right">
          <Button type="primary" htmlType="submit" loading={submitting}>
            Post
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
