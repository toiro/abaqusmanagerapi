export type Dict<K extends string | number | symbol, T> = {
  [key in K]: T;
};

export type UniquePropDict<
  UniqueProp extends keyof T,
  T extends { [k in UniqueProp]: string | number | symbol }
> = T[UniqueProp] extends string
  ? {
      [key in T[UniqueProp]]: T;
    }
  : never;

export function arrayToUniquePropDict<
  T extends { [k in UniqueProp]: string | number | symbol },
  UniqueProp extends keyof T
>(list: T[], id: UniqueProp) {
  // TODO check id is unique
  return Object.assign({}, ...list.map((e) => ({ [e[id]]: e } as Record<UniqueProp, T>))) as UniquePropDict<
    UniqueProp,
    T
  >;
}
