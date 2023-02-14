import mongoose from 'mongoose';
import { name } from '../../../model/config.js';
const schema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        match: /[a-z0-9_]+/,
        minlength: 2,
    },
    value: {
        type: String,
        required: true,
    },
});
export default mongoose.model(name, schema);
