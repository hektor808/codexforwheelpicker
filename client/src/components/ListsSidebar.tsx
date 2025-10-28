import { FormEvent, useState } from 'react';
import { clsx } from 'clsx';
import { WheelList } from '../types.js';
import { createList, deleteList } from '../lib/api.js';

interface ListsSidebarProps {
  lists: WheelList[];
  selectedId: string | null;
  onSelect(id: string | null): void;
  onListsChange(nextLists: WheelList[]): void;
  isLoading: boolean;
  error: string | null;
}

export function ListsSidebar({ lists, selectedId, onSelect, onListsChange, isLoading, error }: ListsSidebarProps) {
  const [newListName, setNewListName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newListName.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await createList({ name: newListName.trim(), items: [] });
      onListsChange([created, ...lists]);
      onSelect(created.id);
      setNewListName('');
    } catch (err) {
      console.error(err);
      alert('Failed to create list.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this wheel? This cannot be undone.')) {
      return;
    }

    try {
      await deleteList(id);
      const nextLists = lists.filter((list) => list.id !== id);
      onListsChange(nextLists);
      if (selectedId === id) {
        onSelect(nextLists.length ? nextLists[0].id : null);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete list.');
    }
  }

  return (
    <aside className="w-80 border-r border-white/10 bg-slate-950/70 backdrop-blur">
      <div className="px-5 pb-4 pt-6">
        <h1 className="text-2xl font-semibold tracking-tight">Wheel Picker</h1>
        <p className="mt-1 text-sm text-slate-400">Create wheels, add options, and spin to decide anything.</p>
        <form onSubmit={handleCreate} className="mt-6 flex gap-2">
          <input
            type="text"
            placeholder="New wheel name"
            value={newListName}
            onChange={(event) => setNewListName(event.target.value)}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting}
          >
            Add
          </button>
        </form>
      </div>
      <div className="flex h-[calc(100vh-176px)] flex-col overflow-y-auto px-2">
        {isLoading ? (
          <p className="px-3 py-2 text-sm text-slate-400">Loading wheels…</p>
        ) : error ? (
          <p className="px-3 py-2 text-sm text-red-400">{error}</p>
        ) : lists.length === 0 ? (
          <p className="px-3 py-2 text-sm text-slate-400">Get started by creating your first wheel.</p>
        ) : (
          <ul className="space-y-1">
            {lists.map((list) => (
              <li key={list.id} className="group relative">
                <button
                  className={clsx(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition',
                    selectedId === list.id
                      ? 'bg-primary/20 text-white'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white',
                  )}
                  onClick={() => onSelect(list.id)}
                >
                  <span className="truncate">{list.name}</span>
                  <span className="text-xs text-slate-400">{list.items.length} items</span>
                </button>
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-xs text-slate-400 opacity-0 transition hover:bg-white/10 hover:text-red-300 group-hover:opacity-100"
                  onClick={() => handleDelete(list.id)}
                  aria-label={`Delete ${list.name}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
