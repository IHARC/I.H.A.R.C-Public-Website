'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
const MAX_SIZE = 8 * 1024 * 1024;
const MAX_FILES = 4;

export type AttachmentDraft = {
  id: string;
  file: File;
};

export function AttachmentUploader({
  attachments,
  onChange,
}: {
  attachments: AttachmentDraft[];
  onChange: (next: AttachmentDraft[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePick = () => {
    inputRef.current?.click();
  };

  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const existingCount = attachments.length;

    const accepted: AttachmentDraft[] = [];
    for (const file of files) {
      if (existingCount + accepted.length >= MAX_FILES) {
        toast({
          title: 'Attachment limit reached',
          description: `You can upload up to ${MAX_FILES} files per idea.`,
          variant: 'destructive',
        });
        break;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast({ title: 'Unsupported file type', description: file.name, variant: 'destructive' });
        continue;
      }
      if (file.size > MAX_SIZE) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds the 8 MB limit.`,
          variant: 'destructive',
        });
        continue;
      }
      accepted.push({ id: crypto.randomUUID(), file });
    }

    if (accepted.length) {
      onChange([...attachments, ...accepted]);
    }

    event.target.value = '';
  };

  const remove = (id: string) => {
    onChange(attachments.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        className="hidden"
        multiple
        onChange={handleFiles}
      />
      <Button type="button" variant="outline" onClick={handlePick}>
        Add attachments
      </Button>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Allowed: png, jpg, jpeg, webp, pdf. Max size 8 MB.
      </p>
      {attachments.length > 0 && (
        <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
          {attachments.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 rounded bg-slate-100 px-3 py-1 dark:bg-slate-800">
              <span className="truncate">{item.file.name}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => remove(item.id)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
