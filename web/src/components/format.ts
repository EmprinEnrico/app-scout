// Formatting helpers shared by the presentational screens.
export const count = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;
