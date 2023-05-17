import mongoose from 'mongoose'
import { ISetting, name } from 'sharedDefinitions/model/setting.js'

const schema = new mongoose.Schema<ISetting>({
  onApplying: { type: Boolean },
  availableTokenCount: { type: Number, required: true, min: 0 },
  licenseServer: {
    hostname: { type: String, required: true },
  },
})

export default mongoose.model<ISetting>(name, schema)
