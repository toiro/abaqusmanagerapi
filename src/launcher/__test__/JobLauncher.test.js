import Target from '../JobLauncher.js';
import logger from '~/utils/logger.js';
// jest.mock('~/apiserver/cruds/user.js');
// jest.mock('~/apiserver/cruds/job.js');

const launcher = new Target();
beforeAll(async() => {
  launcher
    .on('launch', (job, executeDir) => {
      logger.info(`Start ${job.owner}'s job: ${job.name}`);
    })
    .on('error', (job, error) => {
      logger.warn(`An error occured on launch ${job.owner}'s job: ${job.name}`, error);
    })
    .on('finish', (job, code, msg, resultDir) => {
      if (code === 0) {
        logger.info(`Completed ${job.owner}'s job: ${job.name}`);
      } else {
        logger.warn(`Aborted ${job.owner}'s job: ${job.name}`);
      }
    });
});

afterAll(() => {
});

test('invoke job', done => {
  const now = Date.now();
  const job = {
    name: 'test',
    owner: 'ztest',
    createdAt: now,
    node: 'UK-X',
    command: {
      cpus: 2
    },
    input: {
      uploaded: {
        fileName: 'test.input',
        content: Buffer.alloc(0)
      }
    },
    priority: 3,
    status: {
      code: 'Waiting',
      at: now
    },
    toObject: function() { return this; }
  };
  launcher
    .on('stderr', msg => {
      console.log(msg);
    })
    .on('error', (job, error) => {
      console.log(error);
    })
    .on('finish', (job, code) => {
      if (code === 0) {
        console.log('OK');
        done();
      }
    })
    .launch(job);
});
