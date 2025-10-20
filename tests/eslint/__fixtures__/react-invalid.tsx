import { useEffect, useState } from 'react';

type Item = { id: string; label: string };

export function BadList({ items }: { items: Item[] }) {
  return (
    <ul>
      {items.map(item => (
        <li>{item.label}</li>
      ))}
    </ul>
  );
}

export function HookTrouble() {
  const [count, setCount] = useState(0);

  if (count > 2) {
    useEffect(() => {
      setCount(0);
    }, []);
  }

  useEffect(() => {
    void count.toString();
  }, []);

  return (
    <button type='button' onClick={() => setCount(count + 1)}>
      Increment
    </button>
  );
}
