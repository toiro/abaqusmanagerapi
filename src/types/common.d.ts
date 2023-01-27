export type BaseDict<K, T> = { [key: K]: T }
export type BaseDataTree<K, T> = { [key: K]: DataTree<K, T> | T }

export type Dict<T> = BaseDict<string, T>
export type DataTree<T> = BaseDataTree<string, T>
