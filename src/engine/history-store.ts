export interface HistoryRecord {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

export class HistoryStore {
  private entries: HistoryRecord[] = [];
  private readonly maxEntries: number = 100;

  public getEntries(): ReadonlyArray<HistoryRecord> {
    return [...this.entries];
  }

  public count(): number {
    return this.entries.length;
  }

  public addEntry(expression: string, result: string): HistoryRecord {
    const record: HistoryRecord = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      expression,
      result,
      timestamp: Date.now(),
    };

    // Prepend newest first
    this.entries.unshift(record);

    // FIFO pruning at maxEntries (100)
    if (this.entries.length > this.maxEntries) {
      this.entries.length = this.maxEntries;
    }

    return record;
  }

  public clear(): void {
    this.entries = [];
  }
}
