import { JobCommand } from 'sharedDefinitions/model/jobCommand'

type JobConfig = {
  name?: string
  description?: string
  command: JobCommand
}
export default JobConfig
