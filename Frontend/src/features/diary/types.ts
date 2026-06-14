export type DiaryVisibility = 'public' | 'friends' | 'private';

export interface DiaryEntryData {
  id: string;
  friend: string;
  friendAvatar: string;
  date: string;
  location: string;
  visibility: DiaryVisibility;
  text: string;
  photo?: string;
}

export interface NewDiaryEntryForm {
  friend: string;
  date: string;
  location: string;
  visibility: DiaryVisibility;
  text: string;
  photo: File | null;
}
