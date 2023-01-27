import connectDb from 'utils/connectdb.js';
import { createConfigsFromDef } from 'utils/storedConfig.js';
import NodeModel from 'model/node.js';

(async () => {
  await connectDb();

  // Configs
  await createConfigsFromDef();

  // Nodes
  const nodeDefs = [
    {
      hostname: 'UK-X',
      maxConcurrentJob: 10,
      executeDirectoryRoot: 'C:\\temp\\abaqus',
      resultDirectoryRoot: 'D:\\abaqus_results',
      importDirectoryRoot: 'C:\\Users\\lab\\Desktop\\AbaqusController\\abaqus_input',
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
