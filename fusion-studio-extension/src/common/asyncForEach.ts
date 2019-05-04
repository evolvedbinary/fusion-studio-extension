export async function asyncForEach<T, R>(array: T[], callback: (...args: any) => Promise<R>): Promise<R[]> {
  const result: R[] = [];
  for (let index = 0; index < array.length; index++) {
    result.push(await callback(array[index], index, array));
  }
  return result;
}