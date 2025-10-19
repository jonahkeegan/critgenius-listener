async function fetchData(id: number) {
  return Promise.resolve(id);
}

export async function process(ids: number[]) {
  for (const id of ids) {
    await fetchData(id);
  }

  console.log('processing complete');

  Math.max.apply(Math, ids);
}

process([1, 2, 3]);
