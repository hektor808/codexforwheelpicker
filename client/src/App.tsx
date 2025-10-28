import { useEffect, useState } from 'react';
import { WheelList } from './types.js';
import { ListsSidebar } from './components/ListsSidebar.js';
import { ListWorkspace } from './components/ListWorkspace.js';
import { fetchLists } from './lib/api.js';

function App() {
  const [lists, setLists] = useState<WheelList[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const data = await fetchLists();
        setLists(data);
        if (!selectedId && data.length) {
          setSelectedId(data[0].id);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load lists');
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  const selectedList = lists.find((list) => list.id === selectedId) ?? null;

  return (
    <div className="flex min-h-screen">
      <ListsSidebar
        lists={lists}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onListsChange={setLists}
        isLoading={isLoading}
        error={error}
      />
      <main className="flex-1 overflow-y-auto">
        <ListWorkspace
          list={selectedList}
          onListChange={(updated) => {
            setLists((current) => current.map((list) => (list.id === updated.id ? updated : list)));
          }}
          onListDelete={(id) => {
            setLists((current) => {
              const next = current.filter((list) => list.id !== id);
              setSelectedId((selected) => {
                if (selected !== id) {
                  return selected;
                }
                return next.length ? next[0].id : null;
              });
              return next;
            });
          }}
        />
      </main>
    </div>
  );
}

export default App;
