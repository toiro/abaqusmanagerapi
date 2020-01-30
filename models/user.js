
export default {
  addItem: async function(param) {
    users.push({ id: users.length, name: param.username });
  },
  getItems: async function(query) {
    return users;
  },
  getItem: async function(id) {
    return users[id];
  }
};

const users = [
  {
    id: 1,
    name: 'arai'
  },
  {
    id: 2,
    name: 'inoue'
  }
];
