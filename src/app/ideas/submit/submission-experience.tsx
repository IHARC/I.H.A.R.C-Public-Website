'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuickIdeaForm } from './quick-idea-form';
import { IdeaSubmissionForm } from './idea-form';
import { copyDeck } from '@/lib/copy';

const tabsCopy = copyDeck.ideas;

export function IdeaSubmissionExperience({
  rulesAcknowledged,
  displayNameConfirmed,
}: {
  rulesAcknowledged: boolean;
  displayNameConfirmed: boolean;
}) {
  const [activeTab, setActiveTab] = useState<'quick' | 'full'>('quick');

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'quick' | 'full')} className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="quick">{tabsCopy.quick.name}</TabsTrigger>
        <TabsTrigger value="full">Full proposal</TabsTrigger>
      </TabsList>
      <TabsContent value="quick">
        <QuickIdeaForm rulesAcknowledged={rulesAcknowledged} displayNameConfirmed={displayNameConfirmed} />
      </TabsContent>
      <TabsContent value="full">
        <IdeaSubmissionForm
          rulesAcknowledged={rulesAcknowledged}
          displayNameConfirmed={displayNameConfirmed}
        />
      </TabsContent>
    </Tabs>
  );
}
