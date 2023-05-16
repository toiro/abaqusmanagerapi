import { testPath } from 'app/junction/powershell-remote/commands/index.js'

const node = {
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
}

console.log(await testPath(node, ['c:\\', 'c:\\apps']))
console.log(await testPath(node, []))
