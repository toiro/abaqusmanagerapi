import SettingModel from 'app/store/model/setting.js';
import { ISetting } from 'sharedDefinitions/model/setting.js';

export async function useSettingDocument() {
  return SettingModel.findOne().exec();
}

export async function useSettingReadOnly() {
  return (await useSettingDocument())?.toObject() as Readonly<ISetting>;
}

