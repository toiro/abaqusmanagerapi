import { EventEmitter } from 'events';

const emitter = new EventEmitter();
emitter.on('update', (jobId, status, option) => {
  // TODO
});

export default emitter;
