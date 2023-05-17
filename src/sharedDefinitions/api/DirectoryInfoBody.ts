import { JobCommand } from '../model/jobCommand.js'
import { IJobInput, IJobInputExternal, IJobInputSharedDirectory } from '../model/jobInput.js'

type DirectoryInfoBody<JobInput extends IJobInputExternal | IJobInputSharedDirectory> = {
  name: string
  owner: string
  node: string
  config: string
  inputfiles: string[]
  command: Partial<JobCommand>
  input: IJobInput & Partial<JobInput>
  description: string
  error: string
}
export default DirectoryInfoBody
