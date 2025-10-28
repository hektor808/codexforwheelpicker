import { Fragment, useEffect, useMemo, useState } from 'react';
import { WheelList } from '../types.js';
import { deleteList, updateList, spinList } from '../lib/api.js';
import { Wheel } from './Wheel.js';
import { SpinHistory } from './SpinHistory.js';

interface ListWorkspaceProps {
  list: WheelList | null;
  onListChange(list: WheelList): void;
  onListDelete(id: string): void;
}

interface EditableItem {
  id?: string;
  label: string;
  weight: number;
}

const MIN_WEIGHT = 1;

function sanitizeWeight(weight: number): number {
  if (!Number.isFinite(weight)) {
    return MIN_WEIGHT;
  }
  return Math.max(MIN_WEIGHT, Math.round(weight));
}

function prepareItems(items: EditableItem[]) {
  return items
    .map((item) => {
      const label = item.label.trim();
      if (!label) {
        return null;
      }

      return {
        id: item.id,
        label,
        weight: sanitizeWeight(item.weight),
      };
    })
    .filter((item): item is { id?: string; label: string; weight: number } => item !== null);
}

function sanitizeNameInput(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : 'Untitled wheel';
}

function sanitizeDescriptionInput(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function ListWorkspace({ list, onListChange, onListDelete }: ListWorkspaceProps) {
  const [items, setItems] = useState<EditableItem[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastSpinItemId, setLastSpinItemId] = useState<string | null>(null);

  const preparedItems = useMemo(() => prepareItems(items), [items]);
  const sanitizedName = useMemo(() => sanitizeNameInput(name), [name]);
  const sanitizedDescription = useMemo(() => sanitizeDescriptionInput(description), [description]);

  const hasChanges = useMemo(() => {
    if (!list) return false;
    if (preparedItems.length !== list.items.length) return true;
    if (list.name !== sanitizedName) return true;
    if ((list.description ?? undefined) !== sanitizedDescription) return true;
    return preparedItems.some((item, index) => {
      const original = list.items[index];
      return original.label !== item.label || original.weight !== item.weight;
    });
  }, [preparedItems, sanitizedName, sanitizedDescription, list]);

  function syncFromList(current: WheelList | null) {
    setName(current?.name ?? '');
    setDescription(current?.description ?? '');
    setItems(current ? current.items.map((item) => ({ ...item })) : []);
    setLastSpinItemId(null);
  }

  useEffect(() => {
    syncFromList(list);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list?.id]);

  async function handleSave() {
    if (!list) return;

    const payload = {
      name: sanitizedName,
      description: sanitizedDescription,
      items: preparedItems,
    };

    try {
      setIsSaving(true);
      const updated = await updateList(list.id, payload);
      onListChange(updated);
      syncFromList(updated);
    } catch (err) {
      console.error(err);
      alert('Failed to save wheel.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!list) return;
    if (!confirm('Delete this wheel? This cannot be undone.')) {
      return;
    }

    try {
      await deleteList(list.id);
      onListDelete(list.id);
    } catch (err) {
      console.error(err);
      alert('Failed to delete wheel.');
    }
  }

  async function handleSpin() {
    if (!list || !list.items.length) {
      alert('Add at least one item before spinning.');
      return;
    }

    if (hasChanges) {
      const proceed = confirm('You have unsaved changes. Spin using the last saved items?');
      if (!proceed) {
        return;
      }
    }

    try {
      setIsSpinning(true);
      const result = await spinList(list.id);
      setLastSpinItemId(result.itemId);
      onListChange({
        ...list,
        spins: [result, ...list.spins].slice(0, 20),
        updatedAt: result.timestamp,
      });
    } catch (err) {
      console.error(err);
      alert('Failed to spin.');
    } finally {
      setIsSpinning(false);
    }
  }

  function handleItemChange(index: number, updater: (item: EditableItem) => EditableItem) {
    setItems((current) => {
      const next = [...current];
      next[index] = updater(next[index]);
      return next;
    });
  }

  function handleAddItem() {
    setItems((current) => [...current, { label: '', weight: 1 }]);
  }

  function handleRemoveItem(index: number) {
    setItems((current) => current.filter((_, i) => i !== index));
  }

  if (!list) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center p-10 text-center text-slate-300">
        <h2 className="text-2xl font-semibold">Select or create a wheel to get started</h2>
        <p className="mt-2 max-w-md text-sm text-slate-400">
          Build as many wheels as you like. Each wheel can hold custom items, optional weights, and keeps track of your last spins.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-10">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-300">Wheel name</label>
        <input
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-lg font-semibold text-white outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/40"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-300">Description (optional)</label>
        <textarea
          className="min-h-[80px] rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/40"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>
      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Wheel items</h3>
          <button
            onClick={handleAddItem}
            className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-secondary/20 transition hover:bg-secondary/90"
          >
            Add item
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {items.map((item, index) => (
            <Fragment key={item.id ?? index}>
              <div className="flex gap-3">
                <input
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
                  value={item.label}
                  placeholder={`Item ${index + 1}`}
                  onChange={(event) => handleItemChange(index, (current) => ({ ...current, label: event.target.value }))}
                />
                <input
                  type="number"
                  min={1}
                  className="w-28 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
                  value={item.weight}
                  onChange={(event) =>
                    handleItemChange(index, (current) => {
                      const parsed = Number.parseFloat(event.target.value);
                      const weight = sanitizeWeight(Number.isNaN(parsed) ? MIN_WEIGHT : parsed);
                      return {
                        ...current,
                        weight,
                      };
                    })
                  }
                />
                <button
                  className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/10"
                  onClick={() => handleRemoveItem(index)}
                >
                  Remove
                </button>
              </div>
            </Fragment>
          ))}
          {items.length === 0 && <p className="text-sm text-slate-400">Add a few items to start spinning.</p>}
        </div>
      </section>
      <div className="flex flex-wrap gap-4">
        <button
          className="rounded-full bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-xl shadow-primary/30 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleSpin}
          disabled={isSpinning || !list.items.length}
        >
          {isSpinning ? 'Spinning…' : 'Spin the wheel'}
        </button>
        <button
          className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? 'Saving…' : hasChanges ? 'Save changes' : 'Saved'}
        </button>
        <button
          className="rounded-full border border-red-500/40 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-red-300 transition hover:bg-red-500/10"
          onClick={handleDelete}
        >
          Delete wheel
        </button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <Wheel
          key={lastSpinItemId ?? list.id}
          items={(hasChanges ? preparedItems : list.items).map((item, index) => ({
            id: item.id ?? `unsaved-${index}`,
            label: item.label,
            weight: item.weight,
          }))}
          lastSpinItemId={lastSpinItemId}
        />
        <SpinHistory spins={list.spins} />
      </div>
    </div>
  );
}
