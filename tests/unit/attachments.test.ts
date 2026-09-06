import { describe, it, expect } from 'vitest';
import { formatFileSize, processSelectedFiles } from '@/lib/utils/attachments';

describe('Attachment Utilities', () => {
  it('formats file sizes correctly', () => {
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });

  it('validates total attachment size under 20MB limit', async () => {
    const fakeSmallFile = new File(['hello content'], 'test.txt', { type: 'text/plain' });
    const result = await processSelectedFiles([fakeSmallFile]);

    expect(result.error).toBeNull();
    expect(result.attachments).toHaveLength(1);
    expect(result.attachments[0].filename).toBe('test.txt');
    expect(result.attachments[0].mimeType).toBe('text/plain');
  });
});
