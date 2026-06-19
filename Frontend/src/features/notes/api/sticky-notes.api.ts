import { useApi } from '../../../lib/api.ts';

export type NoteColor = 'yellow' | 'pink' | 'blue' | 'green' | 'purple';

export interface StickyNote {
  _id: string;
  body: string;
  color: NoteColor;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  /** route the note is locked to; null = every page */
  pinned_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateStickyNotePayload {
  body?: string;
  color?: NoteColor;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  visible?: boolean;
  pinned_path?: string | null;
}

export function useStickyNotesApi() {
  const api = useApi();

  return {
    list: () => api.get<StickyNote[]>('/sticky-notes'),
    create: () => api.post<StickyNote>('/sticky-notes', {}),
    update: (id: string, payload: UpdateStickyNotePayload) =>
      api.patch<StickyNote>(`/sticky-notes/${id}`, payload),
    remove: (id: string) => api.delete<{ deleted: boolean }>(`/sticky-notes/${id}`),
  };
}
