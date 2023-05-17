export const name = 'Node'

export interface INode {
  hostname: string
  availableCPUs: number
  licenseTokenQuota: number
  executeDirectoryRoot: string
  resultDirectoryRoot: string
  importDirectoryRoot: string
  winrmCredential: {
    user: string
    encryptedPassword: string
  }
  isActive: boolean
}
