export default {
  addEntry: async newEntry => {
    newEntry.maxConcurrentJob = 2;
    return newEntry;
  },
  getEntrys: async() => {
    return [
      { name: 'ando', maxConcurrentJob: 2 },
      { name: 'inoue', maxConcurrentJob: 2 }
    ];
  },
  getEntry: async identifier => {
    return identifier.name === 'ando'
      ? { name: identifier.name, maxConcurrentJob: 2 }
      : null;
  },
  deleteEntry: async identifier => {
    return identifier.name === 'ando'
      ? { name: identifier.name, maxConcurrentJob: 2 }
      : null;
  },
  identifier: username => ({ name: username })
};
