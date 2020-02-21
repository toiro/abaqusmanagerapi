import Target from '../PowerShellRemote.js';
import AbaqusCommandBuilder from '../AbaqusCommandBuilder.js';
// jest.mock('~/apiserver/cruds/user.js');
// jest.mock('~/apiserver/cruds/job.js');

const psRemote = new Target();
beforeAll(async() => {
  psRemote
    .on('start', args => {
      console.log(args);
    })
    .on('stdout', data => {
      console.log(data);
    })
    .on('stderr', data => {
      console.log(data);
    })
    .on('error', error => {
      console.error(error);
    })
    .on('finish', (code, msg) => {
      console.log(`${code}: ${msg}`);
    });
});

afterAll(() => {
});

test('invoke job', async() => {
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
        filename: 'test.input',
        content: Buffer.alloc(0)
      }
    },
    priority: 3,
    status: {
      code: 'Waiting',
      at: now
    }
  };
  const abaqusCommand = new AbaqusCommandBuilder();
  abaqusCommand
    .setJobName(job.name)
    .setFileName(job.input.uploaded.filename)
    .setCpus(job.command.cpus);

  launcher.launch(job);
});
