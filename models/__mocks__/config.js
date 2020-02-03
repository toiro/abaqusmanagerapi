export default {
  addEntry: async newEntry => {
    return newEntry.key ? newEntry : null;
  },
  getEntrys: async() => {
    return [
      { key: 'adminpass', value: 'pass' }
    ];
  },
  getEntry: async identifier => {
    return identifier.key === 'adminpass'
      ? { key: identifier.key, value: 'pass' }
      : null;
  },
  deleteEntry: async identifier => {
    return identifier.key === 'xxxx'
      ? { key: identifier.key, value: 'xxxx' }
      : null;
  },
  identifier: key => ({ key: key })
};
