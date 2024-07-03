import childProcess from 'child_process'
import path from 'path'
import iconv from 'iconv-lite'
// import PowerShellRemote from 'app/junction/powershell-remote/PowerShellRemote.js'
// import { testPath } from 'app/junction/powershell-remote/commands/index.js'

const SHELL_ENCODE = 'sjis'

const host = 'HYDRO-RIVER'
const user = 'lab'
const encryptedPassword =
  '01000000d08c9ddf0115d1118c7a00c04fc297eb0100000052d7baac7c4de2459bd2adf03f61254b00000000020000000000106600000001000020000000a161de54291f20ef9c231abb262402eb39d545b8f6fac433a436e5f21278dcdb000000000e80000000020000200000000b86e374bc0e1f0027258c68815c6211e5bf4c141e851d8f1024e86b24e2c3bd20000000f61f15fa456ab184dfdcc726b7fbd3e98f80a148a22ecd1a94985db758e5c28b400000008cc6bdfbbfb80b4b7b4c8163b44810306fa6d440af2cae2e85f078ecd65eb66ab3f0d24978f7a8d35000c3cd357875d97baa9d789bb7d5283a0cb3c1dae49b23'
const script: string = `{
    param ($Session)
    $comstr = Get-Content "C:\\Users\\SORAJI\\Documents\\project\\abaqusmanagerapi\\resources\\ps-scripts\\hostname.ps1" -Raw
    $command = {
      param($sbstr)
      $sb = [ScriptBlock]::Create($sbstr)
      &$sb @()
    }

    if ($Session) {
      Invoke-Command -Session $Session -ScriptBlock $command -ArgumentList $comstr
    } else {
      Invoke-Command -ScriptBlock $command -ArgumentList $comstr
    }

}`

// const node = {
//   hostname: 'HYDRO-RIVER',
//   availableCPUs: 10,
//   licenseTokenQuota: 30,
//   executeDirectoryRoot: 'C:\\temp\\abaqus',
//   resultDirectoryRoot: 'D:\\abaqus_results',
//   importDirectoryRoot: 'D:abaqus_jobs',
//   winrmCredential: {
//     user,
//     encryptedPassword,
//   },
//   isActive: true,
// }

const sessionScript = path.join(process.cwd(), '.\\resources\\ps-scripts\\winrm-session.ps1')
delete process.env.PSModulePath
const powerShell = childProcess.spawn('powershell', [sessionScript, host, user, encryptedPassword, script])
powerShell.stdout.on('data', (data: Buffer) => {
  console.log(iconv.decode(data, SHELL_ENCODE))
})
powerShell.stderr.on('data', (data: Buffer) => {
  console.log(iconv.decode(data, SHELL_ENCODE))
})
powerShell.on('close', (code) => {
  console.log(`finished at code:${String(code)}`)
})

// new PowerShellRemote(node.hostname, node.winrmCredential.user, node.winrmCredential.encryptedPassword, script)
//   .on('stdout', (line, _count) => {
//     console.log(line)
//   })
//   .invoke()

// console.log(await testPath(node, ['c:\\', 'c:\\apps']))
