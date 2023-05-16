import connectDb from 'app/store/connectdb.js'
import NodeModel from 'app/store/model/node.js'
import SettingModel from 'app/store/model/setting.js'
import mongoose from 'mongoose'
import { INode } from 'sharedDefinitions/model/node.js'

await (async () => {
  await connectDb()

  // Settings
  const setting = new SettingModel({
    onApplying: true,
    availableTokenCount: 30,
    licenseServer: {
      hostname: 'HYDRO-RIVER',
    },
  })
  await setting.save()

  // Nodes
  const nodeDefs: INode[] = [
    {
      hostname: 'HYDRO-RIVER',
      availableCPUs: 10,
      licenseTokenQuota: 30,
      executeDirectoryRoot: 'C:\\temp\\abaqus',
      resultDirectoryRoot: 'D:\\abaqus_results',
      importDirectoryRoot: 'D:abaqus_jobs',
      winrmCredential: {
        user: 'lab',
        encryptedPassword:
          '01000000d08c9ddf0115d1118c7a00c04fc297eb01000000e2c094e7f6759c4db6ffc4c324de696f00000000020000000000106600000001000020000000e543cbc95cdca2828949c4283875a6447d403fd1260191fcc69df719d0ede026000000000e8000000002000020000000c588e62c753d7bb2998384fe93ac400bd8374af1405c3e92b2a4bd6d1794f3b9200000005da5d4c5ff73439c3fb8027e53cc7e86ecbe4c18008f0c8763bf2ef46703ffec400000006d80a0eb716717d83764820b0c142e2c1ee2108eddde4a03c0a5b4bbc7c06b369e9e6566d933b7bd7875b608e87909b7b2590f4492e98403119c41a5c7739828',
      },
      isActive: true,
    },
    {
      hostname: 'GREAT-SHUJI-X',
      availableCPUs: 10,
      licenseTokenQuota: 30,
      executeDirectoryRoot: 'C:\\temp',
      resultDirectoryRoot: 'C:\\temp',
      importDirectoryRoot: 'C:\\temp',
      winrmCredential: {
        user: 'lab',
        encryptedPassword:
          '01000000d08c9ddf0115d1118c7a00c04fc297eb01000000e2c094e7f6759c4db6ffc4c324de696f0000000002000000000010660000000100002000000083ee17294bb01a1ffb9648214961a9eddebdb233844dbc1dfb88418b035ce062000000000e8000000002000020000000a45cabd3eae8395c1971c84dbd2943c888f1639e89c01299e735931076e095983000000033f507f7ad6ece2258a6e898158b16132c98323bd9e8c80176830d0684183d7d75e5d4a2f2c5dc63116294c587af226540000000000396fc3aa12d1411621ace3c21925d17593bf5c557ffa3f7f6b57e6a84c8e900349240dc5138b402f6e7cdcca040f2fbf949e0a8c54e7b0e52d72904f02fe8',
      },
      isActive: true,
    },
    {
      hostname: 'DUMMY',
      availableCPUs: 10,
      licenseTokenQuota: 30,
      executeDirectoryRoot: 'C:\\temp',
      resultDirectoryRoot: 'C:\\temp',
      importDirectoryRoot: 'C:\\temp',
      winrmCredential: {
        user: 'lab',
        encryptedPassword: 'xxxx',
      },
      isActive: false,
    },
  ]
  await Promise.all(
    nodeDefs.map((def) => {
      const node = new NodeModel(def)
      return node.save()
    })
  )

  await mongoose.connection.createCollection('inputfiles.chunks')
  await mongoose.connection.createCollection('inputfiles.files')
})().catch((_e) => {})
