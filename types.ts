export type MessageRole = 'user' | 'model';

export interface UploadedFile {
  previewUrl: string | null;
  name: string;
  isImage: boolean;
}

export interface Message {
  role: MessageRole;
  parts: string;
  imageUrl?: string; // For model-generated images
  uploadedFile?: UploadedFile; // For user-uploaded files
}
