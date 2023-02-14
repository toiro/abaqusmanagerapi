type Args<F> = F extends (...args: infer A) => any ? A : never;

export function asyncCallback<F extends CallableFunction>(fn: F): (...args: Args<F>) => void {
  return (...args) => {
    // eslint-disable-next-line no-void
    void fn(...args);
  };
}
