import connectDb from 'app/store/connectdb.js';
import { createConfigsFromDef } from 'app/junction/storedConfig.js';
import NodeModel from 'app/store/model/node.js';

// eslint-disable-next-line @typescript-eslint/no-floating-promises
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
        encryptedPassword: 'xxxx',
      },
    },
    {
      hostname: 'GREAT-SHUJI-X',
      maxConcurrentJob: 10,
      executeDirectoryRoot: 'C:\\temp',
      resultDirectoryRoot: 'C:\\temp',
      importDirectoryRoot: 'C:\\temp',
      winrmCredential: {
        user: 'lab',
        encryptedPassword: 'xxxx',
      },
    },
  ];
  await Promise.all(
    nodeDefs.map((def) => {
      const node = new NodeModel(def);
      return node.save();
    })
  );
})();
