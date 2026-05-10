'use client';
import { use } from 'react';
import { ProjectApp } from '@/components/ProjectApp';

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ProjectApp projectId={id} />;
}
