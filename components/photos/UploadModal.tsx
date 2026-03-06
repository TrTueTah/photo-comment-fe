"use client";

import { useRef, useState } from "react";
import {
  Alert,
  Button,
  Form,
  Input,
  Modal,
  Typography,
  Upload,
} from "antd";
import type { UploadFile } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { uploadPhoto } from "@/lib/api/photos";
import { formatApiError } from "@/lib/api/client";
import type { PhotoItem } from "@/lib/types/api";
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/types/app";

const { Dragger } = Upload;
const { Text } = Typography;

const ACCEPTED_MIME = ACCEPTED_IMAGE_TYPES.join(",");
const MAX_MB = MAX_FILE_SIZE_BYTES / (1024 * 1024);

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (photo: PhotoItem) => void;
}

interface FormValues {
  caption?: string;
}

export default function UploadModal({
  open,
  onClose,
  onSuccess,
}: UploadModalProps) {
  const [form] = Form.useForm<FormValues>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<File | null>(null);

  const validateAndSetFile = (file: File): boolean => {
    setFileError(null);
    if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      setFileError(
        `Unsupported file type "${file.type}". Please upload a JPEG, PNG, GIF, or WebP image.`
      );
      return false;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(
        `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is ${MAX_MB} MB.`
      );
      return false;
    }
    fileRef.current = file;
    return true;
  };

  const handleSubmit = async (values: FormValues) => {
    if (!fileRef.current) {
      setFileError("Please select an image to upload.");
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const photo = await uploadPhoto(
        fileRef.current,
        values.caption?.trim() || undefined
      );
      onSuccess(photo);
      handleClose();
    } catch (err) {
      setUploadError(formatApiError(err));
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (uploading) return;
    form.resetFields();
    setFileList([]);
    setFileError(null);
    setUploadError(null);
    fileRef.current = null;
    onClose();
  };

  return (
    <Modal
      title="Upload a photo"
      open={open}
      onCancel={handleClose}
      footer={null}
      maskClosable={!uploading}
      closable={!uploading}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
      >
        <Form.Item>
          <Dragger
            accept={ACCEPTED_MIME}
            fileList={fileList}
            maxCount={1}
            beforeUpload={(file) => {
              const ok = validateAndSetFile(file);
              if (ok) {
                setFileList([file as unknown as UploadFile]);
              } else {
                setFileList([]);
                fileRef.current = null;
              }
              return false; // prevent antd's built-in upload
            }}
            onRemove={() => {
              setFileList([]);
              setFileError(null);
              fileRef.current = null;
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Click or drag an image here to upload
            </p>
            <p className="ant-upload-hint">
              Supports JPEG, PNG, GIF, WebP · Max {MAX_MB} MB
            </p>
          </Dragger>
          {fileError && (
            <Text type="danger" className="mt-1 block text-sm">
              {fileError}
            </Text>
          )}
        </Form.Item>

        <Form.Item
          label="Caption (optional)"
          name="caption"
          rules={[{ max: 500, message: "Caption must be 500 characters or fewer" }]}
        >
          <Input.TextArea
            placeholder="Add a caption…"
            autoSize={{ minRows: 2, maxRows: 4 }}
            maxLength={500}
            showCount
          />
        </Form.Item>

        {uploadError && (
          <Form.Item>
            <Alert message={uploadError} type="error" showIcon />
          </Form.Item>
        )}

        <Form.Item className="mb-0">
          <div className="flex justify-end gap-2">
            <Button onClick={handleClose} disabled={uploading}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={uploading}>
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}
