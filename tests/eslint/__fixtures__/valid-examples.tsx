import { useEffect, useMemo, useState } from 'react';

type Item = { id: string; label: string; description: string };

type Props = { items: Item[] };

export function AccessibleList({ items }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId && items.length > 0) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId]);

  const selected = useMemo(
    () => items.find(item => item.id === selectedId) ?? null,
    [items, selectedId]
  );

  return (
    <section aria-live='polite'>
      <ul>
        {items.map(item => (
          <li key={item.id}>
            <button
              type='button'
              onClick={() => setSelectedId(item.id)}
              aria-pressed={item.id === selectedId}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
      {selected ? <p>{selected.description}</p> : null}
    </section>
  );
}
