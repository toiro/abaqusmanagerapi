export const name = 'Setting'

export interface ISetting {
  onApplying: boolean
  availableTokenCount: number
  licenseServer: {
    hostname: string
  }
  // adminPass: string;
  // priorityPass: string;
}
