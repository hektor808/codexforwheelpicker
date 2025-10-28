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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '..', 'data');
const DATA_FILE = join(DATA_DIR, 'lists.json');

async function ensureDataFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch (error) {
    const initial: DataFile = { lists: [] };
    await fs.writeFile(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
  }
}

async function readDataFile(): Promise<DataFile> {
  await ensureDataFile();
  const content = await fs.readFile(DATA_FILE, 'utf-8');
  return JSON.parse(content) as DataFile;
}

async function writeDataFile(data: DataFile): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function normalizeItems(items: Array<{ id?: string; label: string; weight?: number }>): WheelItem[] {
  return items
    .filter((item) => item.label.trim().length > 0)
    .map((item) => ({
      id: item.id ?? nanoid(),
      label: item.label.trim(),
      weight: Math.max(1, Math.round(item.weight ?? 1)),
    }));
}

export class WheelStore {
  async getLists(): Promise<WheelList[]> {
    const data = await readDataFile();
    return data.lists;
  }

  async getList(id: string): Promise<WheelList | undefined> {
    const data = await readDataFile();
    return data.lists.find((list) => list.id === id);
  }

  async createList(payload: CreateListPayload): Promise<WheelList> {
    const now = new Date().toISOString();
    const description = payload.description?.trim() ?? '';
    const name = payload.name.trim() || 'Untitled wheel';
    const list: WheelList = {
      id: nanoid(),
      name,
      description: description.length ? description : undefined,
      items: normalizeItems(payload.items ?? []),
      spins: [],
      createdAt: now,
      updatedAt: now,
    };

    const data = await readDataFile();
    data.lists.push(list);
    await writeDataFile(data);
    return list;
  }

  async updateList(id: string, payload: UpdateListPayload): Promise<WheelList | undefined> {
    const data = await readDataFile();
    const index = data.lists.findIndex((list) => list.id === id);
    if (index === -1) {
      return undefined;
    }

    const list = data.lists[index];
    const description = payload.description?.trim() ?? '';
    const updatedDescription =
      payload.description !== undefined ? (description.length ? description : undefined) : list.description;

    const updatedName = payload.name ? payload.name.trim() || 'Untitled wheel' : list.name;
    const updated: WheelList = {
      ...list,
      name: updatedName,
      description: updatedDescription,
      items: payload.items ? normalizeItems(payload.items) : list.items,
      updatedAt: new Date().toISOString(),
    };

    data.lists[index] = updated;
    await writeDataFile(data);
    return updated;
  }

  async deleteList(id: string): Promise<boolean> {
    const data = await readDataFile();
    const nextLists = data.lists.filter((list) => list.id !== id);
    const changed = nextLists.length !== data.lists.length;
    if (!changed) {
      return false;
    }

    await writeDataFile({ lists: nextLists });
    return true;
  }

  async recordSpin(id: string): Promise<SpinResult | undefined> {
    const data = await readDataFile();
    const index = data.lists.findIndex((list) => list.id === id);
    if (index === -1) {
      return undefined;
    }

    const list = data.lists[index];
    if (!list.items.length) {
      throw new Error('Cannot spin a wheel with no items');
    }

    const totalWeight = list.items.reduce((sum, item) => sum + item.weight, 0);
    const target = Math.random() * totalWeight;
    let running = 0;
    let selected: WheelItem | undefined;

    for (const item of list.items) {
      running += item.weight;
      if (target <= running) {
        selected = item;
        break;
      }
    }

    const chosen = selected ?? list.items[list.items.length - 1];
    const spin: SpinResult = {
      id: nanoid(),
      itemId: chosen.id,
      label: chosen.label,
      timestamp: new Date().toISOString(),
    };

    const updated: WheelList = {
      ...list,
      spins: [spin, ...list.spins].slice(0, 20),
      updatedAt: new Date().toISOString(),
    };

    data.lists[index] = updated;
    await writeDataFile(data);
    return spin;
  }
}

export const wheelStore = new WheelStore();
