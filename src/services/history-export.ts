import type { HistoryRecord } from '../engine/history-store.ts';

export interface ExportPayload {
  format: 'text' | 'json';
  content: string;
  count: number;
}

export class HistoryExportService {
  public static formatAsText(records: ReadonlyArray<HistoryRecord>): string {
    if (!records || records.length === 0) {
      return 'Tape is empty';
    }

    const lines: string[] = [
      'StayCalc Calculation Tape',
      '-------------------------',
    ];

    for (const r of records) {
      lines.push(`${r.expression} = ${r.result}`);
    }

    lines.push('-------------------------');
    lines.push(`Total Entries: ${records.length}`);

    return lines.join('\n');
  }

  public static formatAsJson(records: ReadonlyArray<HistoryRecord>): string {
    if (!records || records.length === 0) {
      return '[]';
    }
    return JSON.stringify(records, null, 2);
  }

  public static getExportPayload(records: ReadonlyArray<HistoryRecord>, format: 'text' | 'json'): ExportPayload {
    const content = format === 'json' ? this.formatAsJson(records) : this.formatAsText(records);
    return {
      format,
      content,
      count: records.length,
    };
  }

  public static async copyToClipboard(text: string): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}
