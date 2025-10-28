import { randomInt } from 'crypto';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';
import {
  CreateListPayload,
  DataFile,
  SpinResult,
  UpdateListPayload,
  WheelItem,
  WheelList,
} from './types.js';

export type WheelStoreErrorCode = 'NO_ITEMS' | 'DATA_CORRUPT';

export class WheelStoreError extends Error {
  constructor(
    public readonly code: WheelStoreErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'WheelStoreError';
    if (cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = cause;
    }
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '..', 'data');
const DATA_FILE = join(DATA_DIR, 'lists.json');
const DATA_FILE_ENCODING = 'utf-8';
const MAX_SPIN_HISTORY = 20;

let dataFileInitialization: Promise<void> | null = null;

async function ensureDataFile(): Promise<void> {
  if (!dataFileInitialization) {
    dataFileInitialization = (async () => {
      await fs.mkdir(DATA_DIR, { recursive: true });
      try {
        await fs.access(DATA_FILE);
      } catch {
        const initial: DataFile = { lists: [] };
        await fs.writeFile(DATA_FILE, JSON.stringify(initial, null, 2) + '\n', DATA_FILE_ENCODING);
      }
    })();
  }

  await dataFileInitialization;
}

async function readDataFile(): Promise<DataFile> {
  await ensureDataFile();
  const content = await fs.readFile(DATA_FILE, DATA_FILE_ENCODING);

  try {
    return JSON.parse(content) as DataFile;
  } catch (error) {
    throw new WheelStoreError('DATA_CORRUPT', 'Stored wheel data is unreadable', error);
  }
}

async function writeDataFile(data: DataFile): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2) + '\n', DATA_FILE_ENCODING);
}

type RawItemInput = { id?: string; label: string; weight?: number };

function normalizeItems(items: RawItemInput[]): WheelItem[] {
  return items.reduce<WheelItem[]>((acc, item) => {
    const label = item.label.trim();
    if (!label) {
      return acc;
    }

    acc.push({
      id: item.id ?? nanoid(),
      label,
      weight: normalizeWeight(item.weight),
    });

    return acc;
  }, []);
}

function normalizeWeight(weight: number | undefined): number {
  const parsed = Number(weight ?? 1);
  if (!Number.isFinite(parsed)) {
    return 1;
  }
  const rounded = Math.round(parsed);
  return Math.max(1, rounded);
}

function sanitizeName(name: string | undefined): string {
  const trimmed = name?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : 'Untitled wheel';
}

function sanitizeDescription(description: string | undefined): string | undefined {
  if (description === undefined) {
    return undefined;
  }

  const trimmed = description.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export class WheelStore {
  private queue: Promise<void> = Promise.resolve();

  private runSerial<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.queue.then(operation, operation);
    this.queue = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }

  async getLists(): Promise<WheelList[]> {
    const data = await readDataFile();
    return data.lists;
  }

  async getList(id: string): Promise<WheelList | undefined> {
    const data = await readDataFile();
    return data.lists.find((list) => list.id === id);
  }

  async createList(payload: CreateListPayload): Promise<WheelList> {
    return this.runSerial(async () => {
      const now = new Date().toISOString();
      const list: WheelList = {
        id: nanoid(),
        name: sanitizeName(payload.name),
        description: sanitizeDescription(payload.description),
        items: normalizeItems(payload.items ?? []),
        spins: [],
        createdAt: now,
        updatedAt: now,
      };

      const data = await readDataFile();
      data.lists.push(list);
      await writeDataFile(data);
      return list;
    });
  }

  async updateList(id: string, payload: UpdateListPayload): Promise<WheelList | undefined> {
    return this.runSerial(async () => {
      const data = await readDataFile();
      const index = data.lists.findIndex((list) => list.id === id);
      if (index === -1) {
        return undefined;
      }

      const list = data.lists[index];
      const updated: WheelList = {
        ...list,
        name: payload.name !== undefined ? sanitizeName(payload.name) : list.name,
        description: payload.description !== undefined ? sanitizeDescription(payload.description) : list.description,
        items: payload.items ? normalizeItems(payload.items) : list.items,
        updatedAt: new Date().toISOString(),
      };

      data.lists[index] = updated;
      await writeDataFile(data);
      return updated;
    });
  }

  async deleteList(id: string): Promise<boolean> {
    return this.runSerial(async () => {
      const data = await readDataFile();
      const nextLists = data.lists.filter((list) => list.id !== id);
      const changed = nextLists.length !== data.lists.length;
      if (!changed) {
        return false;
      }

      await writeDataFile({ lists: nextLists });
      return true;
    });
  }

  async recordSpin(id: string): Promise<SpinResult | undefined> {
    return this.runSerial(async () => {
      const data = await readDataFile();
      const index = data.lists.findIndex((list) => list.id === id);
      if (index === -1) {
        return undefined;
      }

      const list = data.lists[index];
      if (!list.items.length) {
        throw new WheelStoreError('NO_ITEMS', 'Cannot spin a wheel with no items');
      }

      const totalWeight = list.items.reduce((sum, item) => sum + item.weight, 0);
      if (totalWeight <= 0) {
        throw new WheelStoreError('NO_ITEMS', 'Cannot spin a wheel with items that have no weight');
      }

      const target = randomInt(totalWeight);
      let running = 0;
      let selected: WheelItem | undefined;

      for (const item of list.items) {
        running += item.weight;
        if (target < running) {
          selected = item;
          break;
        }
      }

      const chosen = selected ?? list.items[list.items.length - 1];
      const timestamp = new Date().toISOString();
      const spin: SpinResult = {
        id: nanoid(),
        itemId: chosen.id,
        label: chosen.label,
        timestamp,
      };

      const updated: WheelList = {
        ...list,
        spins: [spin, ...list.spins].slice(0, MAX_SPIN_HISTORY),
        updatedAt: timestamp,
      };

      data.lists[index] = updated;
      await writeDataFile(data);
      return spin;
    });
  }
}

export const wheelStore = new WheelStore();
