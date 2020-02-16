import ConfigModel from '~/models/config.js';
import CONFIGKEY from '~/models/enums/config-key.js';

// DB に保存する設定を扱う
// DB に保存する設定の基準は、動作中に UI から設定を変更される、あるいは変更できることが望ましいこと

export const definitions = {};
definitions[CONFIGKEY.JobMaxForNodes] = { isJson: true, default: { node1: 10, node2: 20 } };
definitions[CONFIGKEY.AdminPass] = { isJson: false, default: 'passa' };
definitions[CONFIGKEY.PriorityPass] = { isJson: false, default: 'passp' };

async function get(key) {
  const doc = await ConfigModel.findOne({ key: key }).exec();
  if (doc === null) throw new Error(`No config exists for key: ${key}`);
  return doc.isJson ? JSON.parse(doc.value) : doc.value;
}

async function set(key, value) {
  const doc = await ConfigModel.findOne({ key: key }).exec();
  if (doc === null) throw new Error(`No config exists for key: ${key}`);
  doc.value = doc.isJson ? JSON.stringify(value) : value;
  await doc.save();
}

export async function createConfigsFromDef(appends) {
  Object.assign(definitions, appends);
  for (const key in Object.keys(definitions)) {
    if (await ConfigModel.exists({ key: key })) continue;
    await createConfig(key, definitions.key.isJson, definitions.key.value);
  }
}

async function createConfig(key, isJson, value) {
  const doc = new ConfigModel({
    key: key,
    isJson: isJson,
    value: isJson ? JSON.stringify(value) : value
  });
  await doc.save();
}

export default Object.freeze({
  get,
  set
});
