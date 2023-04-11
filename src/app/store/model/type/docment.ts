import type { LeanDocument, Document, Types } from 'mongoose';
import type { IConfig } from 'model/config';
import type { IJob } from 'model/job';
import type { INode } from 'model/node';
import type { IUser } from 'model/user';

type Entity<I> = Document<unknown, any, I> & I & { _id: Types.ObjectId };
type POJO<I> = LeanDocument<I>;

export type Config = Entity<IConfig>;
export type Job = Entity<IJob>;
export type Node = Entity<INode>;
export type User = Entity<IUser>;

export type ConfigObj = POJO<IConfig>;
export type JobObj = POJO<IJob>;
export type NodeObj = POJO<INode>;
export type UserObj = POJO<IUser>;

export function AsObj<I>(entityArray: Entity<I>[]) {
  return entityArray.map((e) => e.toObject());
}
