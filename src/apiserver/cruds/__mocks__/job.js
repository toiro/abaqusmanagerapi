export default {
  addItem: async username => {
    return { name: username, maxConcurrentJob: 2 };
  },
  getItems: async() => {
    return [
      { name: 'ando', maxConcurrentJob: 2 },
      { name: 'inoue', maxConcurrentJob: 2 }
    ];
  },
  getItem: async username => {
    return username === 'ando'
      ? { name: username, maxConcurrentJob: 2 }
      : null;
  },
  deleteItem: async username => {
    return username === 'ando'
      ? { name: username, maxConcurrentJob: 2 }
      : null;
  }
};
