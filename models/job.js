export default {
  createItem: async function(username) {
    users.push({ id: users.length, name: username });
  },
  getItems: async function(query) {
    query = query || {};
    return users;
  },
  getItem: async function(id) {
    return users[id];
  }
};

const users = [
  {
    id: 1,
    name: 'arai',
    owner: 'arai'
  },
  {
    id: 2,
    name: 'inoue',
    owner: 'arai'
  }
];
