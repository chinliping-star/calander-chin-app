/** Preset interests offered at onboarding and in the profile interests editor. */
export const PRESET_INTERESTS = [
  '🎵 Music', '🎮 Gaming', '🍕 Food', '✈️ Travel', '⚽ Sports',
  '📚 Reading', '🎨 Art', '🎬 Movies', '🌿 Nature', '💻 Tech',
  '🧘 Wellness', '🐾 Pets', '📸 Photography', '🛍️ Shopping', '🎭 Theatre',
];

export const MAX_INTERESTS = 30;
export const MAX_INTEREST_LENGTH = 40;
export const MAX_NOTE_LENGTH = 300;

export interface InterestNote {
  tag: string;
  note: string;
}
