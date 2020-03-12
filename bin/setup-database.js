import connectDb from '~/utils/connectdb.js';
import storedConfig from '~/utils/storedConfig.js';
import ConfigModel from '~/models/config.js';
import NodeModel from '~/models/node.js';

(async() => {
  await connectDb();

  // Configs
  for (const key of Object.keys(storedConfig.definitions)) {
    const definition = storedConfig.definitions.key;
    const config = new ConfigModel();
    config.key = key;
    config.isJson = definition.isJson;
    config.value = definition.default;
    await config.save();
  }

  // Nodes
  const nodeDefs = [
    {
      hostname: 'UK-X',
      maxConcurrentJob: 10,
      executeDirectoryRoot: 'C:\\temp',
      resultDirectoryRoot: 'C:\\temp',
      importDirectoryRoot: 'C:\\temp',
      winrmCredential: {
        user: 'lab',
        encryptedPassword: 'xxxx'
      }
    },
    {
      hostname: 'GREAT-SHUJI-X',
      maxConcurrentJob: 10,
      executeDirectoryRoot: 'C:\\temp',
      resultDirectoryRoot: 'C:\\temp',
      importDirectoryRoot: 'C:\\temp',
      winrmCredential: {
        user: 'lab',
        encryptedPassword: 'xxxx'
      }
    }
  ];
  for (const nodeDef of nodeDefs) {
    const node = new NodeModel(nodeDef);
    await node.save();
  }
})();
