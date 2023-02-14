export function arrayToUniquePropDict(list, id) {
    // TODO check id is unique
    return Object.assign({}, ...list.map((e) => ({ [e[id]]: e })));
}
