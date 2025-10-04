'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const RULES = [
  'Keep the conversation respectful and solution-focused.',
  'Do not share personal identifying information (PII) about yourself or others.',
  'Do not accuse or target identifiable individuals or groups.',
  'Stay on topic—focus on community safety, health, and housing solutions.',
  'Report concerning content so moderators can review swiftly.',
];

export function RulesModal({
  open,
  onAcknowledge,
}: {
  open: boolean;
  onAcknowledge: () => Promise<void> | void;
}) {
  const [isOpen, setIsOpen] = useState(open);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleConfirm = async () => {
    setPending(true);
    await onAcknowledge();
    setPending(false);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => setIsOpen(true)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Community Rules</DialogTitle>
          <DialogDescription>
            Acknowledge the guidelines below before posting your first idea or comment.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-64 space-y-3 pr-3">
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-200">
            {RULES.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={handleConfirm} disabled={pending} className="w-full">
            I understand the rules
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
