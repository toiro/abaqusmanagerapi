export function asyncCallback(fn) {
    return (...args) => {
        // eslint-disable-next-line no-void
        void fn(...args);
    };
}
