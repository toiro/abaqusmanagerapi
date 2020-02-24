import mongoose from 'mongoose';
import gridfs from 'mongoose-gridfs';

const name = 'InputFile';

/*
const schema = new mongoose.Schema({
  fileName: { type: String, required: true },
  content: { type: Buffer, required: true }
});

// export default mongoose.model(name, schema);
// */

export default gridfs.createModel({
  modelName: name,
  connection: mongoose.connection
});
