import ConfigModel from '../model/config.js';
import { ConfigKey } from '../model/resources/enums.js';

// DB に保存する設定を扱う
// DB に保存する設定の基準は、動作中に UI から設定を変更される、あるいは変更できることが望ましいこと

const definitions: { [key: string]: { default: string } } = {};
definitions[ConfigKey.AdminPass] = { default: 'passa' };
definitions[ConfigKey.PriorityPass] = { default: 'passp' };
definitions[ConfigKey.AvailableTokenCount] = { default: '100' };

async function get(key: string) {
  const doc = await ConfigModel.findOne({ key }).exec();
  if (doc === null) throw new Error(`No config exists for key: ${key}`);
  return doc.value;
}

async function set(key: string, value: string) {
  const doc = await ConfigModel.findOne({ key }).exec();
  if (doc === null) throw new Error(`No config exists for key: ${key}`);
  doc.value = value;
  await doc.save();
}

export async function createConfigsFromDef(appends?: { [key: string]: any }) {
  async function createConfig(key: string, value: string) {
    const doc = new ConfigModel({
      key,
      value,
    });
    await doc.save();
  }
  Object.assign(definitions, appends);
  await Promise.all(
    Object.keys(definitions)
      .filter(async (k) => {
        await ConfigModel.exists({ k });
      })
      .map(async (k) => {
        await createConfig(k, definitions[k]?.default as string);
      })
  );
}

export default Object.freeze({
  get,
  set,
});
