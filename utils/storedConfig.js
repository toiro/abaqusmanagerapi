import ConfigModel from '~/models/config.js';
import CONFIGKEY from '~/models/enums/config-key.js';

// DB に保存する設定を扱う
// DB に保存する設定の基準は、動作中に UI から設定を変更される、あるいは変更できることが望ましいこと

const definitions = {};
definitions[CONFIGKEY.AdminPass] = { default: 'passa' };
definitions[CONFIGKEY.PriorityPass] = { default: 'passp' };
definitions[CONFIGKEY.AvailableTokenCount] = { default: '100' };

async function get(key) {
  const doc = await ConfigModel.findOne({ key: key }).exec();
  if (doc === null) throw new Error(`No config exists for key: ${key}`);
  return doc.value;
}

async function set(key, value) {
  const doc = await ConfigModel.findOne({ key: key }).exec();
  if (doc === null) throw new Error(`No config exists for key: ${key}`);
  doc.value = value;
  await doc.save();
}

export async function createConfigsFromDef(appends) {
  Object.assign(definitions, appends);
  for (const key of Object.keys(definitions)) {
    if (await ConfigModel.exists({ key: key })) continue;
    await createConfig(key, definitions[key].default);
  }
}

async function createConfig(key, value) {
  const doc = new ConfigModel({
    key: key,
    value: value
  });
  await doc.save();
}

export default Object.freeze({
  get,
  set
});
