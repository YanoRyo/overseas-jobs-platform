'use client';

import { Suspense } from 'react';
import { MentorRegistration } from '@/features/mentor/components/MentorRegistration';

function MentorRegisterContent() {
  return <MentorRegistration />;
}

export default function MentorRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <MentorRegisterContent />
    </Suspense>
  );
}
