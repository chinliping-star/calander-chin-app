import { Injectable } from '@nestjs/common';

export interface ScanResult {
  flagged: boolean;
  reason: 'inappropriate' | 'spam' | 'harassment' | null;
  detail: string;
}

/**
 * Lightweight, dependency-free content scanner. Keyword + heuristic based.
 * Not a replacement for real moderation — just auto-flags obvious cases for
 * a human to review in the admin Reports panel.
 */
@Injectable()
export class ModerationService {
  // Keep the list short and obvious; extend as needed.
  private readonly bannedWords = [
    'fuck', 'shit', 'bitch', 'bastard', 'asshole', 'cunt', 'nigger', 'faggot',
    'retard', 'whore', 'slut',
  ];
  private readonly harassmentPhrases = [
    'kill yourself', 'kys', 'go die', 'i will kill you', 'you should die',
  ];

  scan(text: string): ScanResult {
    const lower = (text ?? '').toLowerCase();

    for (const phrase of this.harassmentPhrases) {
      if (lower.includes(phrase)) {
        return { flagged: true, reason: 'harassment', detail: `Matched phrase: "${phrase}"` };
      }
    }

    for (const word of this.bannedWords) {
      // word-boundary match to avoid false positives inside other words
      if (new RegExp(`\\b${word}\\b`, 'i').test(lower)) {
        return { flagged: true, reason: 'inappropriate', detail: `Matched word: "${word}"` };
      }
    }

    // Link spam: 3+ URLs in one post
    const urls = lower.match(/https?:\/\/\S+/g) ?? [];
    if (urls.length >= 3) {
      return { flagged: true, reason: 'spam', detail: `Contains ${urls.length} links` };
    }

    return { flagged: false, reason: null, detail: '' };
  }
}
