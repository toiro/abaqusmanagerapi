import type { ObjectId } from "mongoose";
import type mongoose from "mongoose";

type Model<ISchema> = mongoose.Model<ISchema, {}, {}, {}, any>
type POJO<ISchema> = (mongoose.LeanDocument<ISchema> & ISchema & { _id: mongoose.Types.ObjectId })

/**
 * Mongoose への CRUD 操作を共通化するためのテンプレート
 * @param {Model} Model Mongoose のモデル
 * @param {string} idKey 一意名のキー。必須ではない
 * @returns {Object} CRUD 操作インターフェース
 */
export default <ISchema>(Model: Model<ISchema>, idKey: string) => ({
  /**
   * DB に新しいエントリーを追加する
   */
  addEntry: async (values: ISchema) => {
    const newEntry = new Model(values);
    await newEntry.save();
    return newEntry;
  },
  /**
   * DB からエントリーを取得する
   * @param {Object} filter 取得するエントリー条件。必須ではない
   * @returns {[Object]} 取得したエントリーのリスト
   */
  getEntrys: async (filter?: mongoose.FilterQuery<ISchema>) => {
    filter = filter || {};
    const docs = await Model.find(filter).exec();
    return docs.map(doc => doc.toObject() as POJO<ISchema>);
  },
  /**
   * DB からエントリーを一つ取得する
   * @param {Object} identifier エントリーを一意に指定できる条件
   * @returns {Object|null} 取得したエントリー
   */
  getEntry: async (identifier: mongoose.FilterQuery<ISchema>) => {
    const doc = await Model.findOne(identifier).exec();
    return doc ? doc.toObject() as POJO<ISchema> : null;
  },
  /**
   * DB からエントリーを一つ削除する
   * @param {Object} identifier エントリーを一意に指定できる条件
   * @returns {Object|null} 削除したエントリー
   */
  deleteEntry: async (identifier: mongoose.FilterQuery<ISchema>) => {
    const doc = await Model.findOneAndDelete(identifier).exec();
    return doc ? doc.toObject() : null;
  },
  /**
   * DB のエントリーを一つ更新する
   * @param {Object} identifier エントリーを一意に指定できる条件
   * @param {Object} updates エントリーを更新する値
   * @returns {Object|null} 削除したエントリー
   */
  updateEntry: async (identifier: mongoose.FilterQuery<ISchema>, updates: mongoose.UpdateQuery<ISchema>) => {
    const doc = await Model.findOneAndUpdate(identifier, updates, { new: true });
    return doc ? doc.toObject() : null;
  },
  /**
   * 一意な値を適切な名前を付けてラップする
   * @param {any} idValue 一意に指定するID
   * @returns {Object} IDを名前付きでラップしたオブジェクト
   */
  identifier: (idValue: string | ObjectId) => {
    const ret: { [key: string]: any } = {};
    idKey = idKey || '_id';
    ret[idKey] = idValue;
    return ret as mongoose.FilterQuery<ISchema>;
  }
});
