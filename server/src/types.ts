export interface WheelItem {
  id: string;
  label: string;
  weight: number;
}

export interface SpinResult {
  id: string;
  itemId: string;
  label: string;
  timestamp: string;
}

export interface WheelList {
  id: string;
  name: string;
  description?: string;
  items: WheelItem[];
  spins: SpinResult[];
  createdAt: string;
  updatedAt: string;
}

export interface DataFile {
  lists: WheelList[];
}

export interface CreateListPayload {
  name: string;
  description?: string;
  items?: Array<{ label: string; weight?: number }>;
}

export interface UpdateListPayload {
  name?: string;
  description?: string;
  items?: Array<{ id?: string; label: string; weight?: number }>;
}
