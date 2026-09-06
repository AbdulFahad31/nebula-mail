import { EmailAttachment } from '@/lib/gmail/types';

export const MAX_ATTACHMENT_SIZE_BYTES = 20 * 1024 * 1024; // 20MB limit

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function processSelectedFiles(
  files: FileList | File[],
  existingAttachments: EmailAttachment[] = []
): Promise<{ attachments: EmailAttachment[]; error: string | null }> {
  let currentTotalSize = existingAttachments.reduce((sum, a) => sum + a.size, 0);
  const newAttachments: EmailAttachment[] = [];
  let error: string | null = null;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (currentTotalSize + file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      const excessMb = ((currentTotalSize + file.size) / (1024 * 1024)).toFixed(1);
      error = `Total attachment size (${excessMb} MB) exceeds the 20MB limit.`;
      break;
    }

    currentTotalSize += file.size;

    const base64 = await new Promise<string>((resolve) => {
      if (typeof FileReader !== 'undefined') {
        const reader = new FileReader();
        reader.onload = (evt) => resolve((evt.target?.result as string) || '');
        reader.readAsDataURL(file);
      } else {
        file.arrayBuffer().then((buf) => {
          const b64 = Buffer.from(buf).toString('base64');
          resolve(`data:${file.type || 'application/octet-stream'};base64,${b64}`);
        });
      }
    });

    newAttachments.push({
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      base64,
    });
  }

  return {
    attachments: [...existingAttachments, ...newAttachments],
    error,
  };
}
