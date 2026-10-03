import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from '@/store/session';

describe('Zustand Session Store (Memory Only)', () => {
  beforeEach(() => {
    useSessionStore.getState().clearEverything();
  });

  it('initializes with default settings and empty files', () => {
    const state = useSessionStore.getState();
    expect(state.syllabus).toBeNull();
    expect(state.studyMaterials).toEqual([]);
    expect(state.settings.style).toBe('class_test');
    expect(state.paper).toBeNull();
  });

  it('updates syllabus and study materials', () => {
    const dummySyllabus = {
      id: 'syl-1',
      name: 'syllabus.pdf',
      size: 1024,
      type: '.pdf',
      status: 'ready' as const,
      chunks: [],
    };
    useSessionStore.getState().setSyllabus(dummySyllabus);
    expect(useSessionStore.getState().syllabus?.name).toBe('syllabus.pdf');

    const dummyMaterial = {
      id: 'mat-1',
      name: 'notes.pdf',
      size: 2048,
      type: '.pdf',
      status: 'ready' as const,
      chunks: [],
    };
    useSessionStore.getState().addStudyMaterials([dummyMaterial]);
    expect(useSessionStore.getState().studyMaterials.length).toBe(1);
  });

  it('clearEverything completely resets all state and erases study content', () => {
    // Populate store
    useSessionStore.getState().setSyllabus({
      id: 'syl-1',
      name: 'sensitive_syllabus.pdf',
      size: 1024,
      type: '.pdf',
      status: 'ready',
      text: 'Sensitive syllabus data',
      chunks: [],
    });
    useSessionStore.getState().addStudyMaterials([
      {
        id: 'mat-1',
        name: 'secret_notes.docx',
        size: 2048,
        type: '.docx',
        status: 'ready',
        text: 'Secret study notes',
        chunks: [],
      },
    ]);
    useSessionStore.getState().updateSettings({ subject: 'Mathematics' });
    useSessionStore.getState().setAttempt('q-1', 'Student answer');
    useSessionStore.getState().revealAnswer('q-1');

    // Call clearEverything
    useSessionStore.getState().clearEverything();

    const state = useSessionStore.getState();
    expect(state.syllabus).toBeNull();
    expect(state.studyMaterials).toEqual([]);
    expect(state.settings.subject).toBe('');
    expect(state.attempts).toEqual({});
    expect(state.revealedAnswers).toEqual({});
    expect(state.paper).toBeNull();
  });
});
