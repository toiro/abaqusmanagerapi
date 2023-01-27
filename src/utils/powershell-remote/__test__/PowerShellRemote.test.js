import Target from '../PowerShellRemote.js';
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
  const filepath = 'C:\\Users\\toiro\\.bash_history';
  psRemote._param = {
    host: 'localhost',
    user: 'remote',
    encriptedPassword: '01000000d08c9ddf0115d1118c7a00c04fc297eb010000008ba9550698dbd74d813eafba421808bf000000000200000000001066000000010000200000006408395926de1011d07f4f7409d33a85a31264d8d3f533b3f3a43ef620c47f32000000000e800000000200002000000011a8eded6f6e9c0fe066e6b865637a1a7e48aef4919a269e476186aeee853c822000000090caaa9481115e2e6c0a5232dbc9399586b71d52ec76a0a38875b1ef7e5e20f940000000d93a14e4ef72bd8180d8d7e66c03b272aa315875967a76710dcd0dd0ffed3899744ed9e19c7ad7f6fc3c20bb20085c4760cc417830dead09f7be2b7ecff09efe',
    script: `Get-Content -Tail 100 -Path ${filepath}`
  };

  const ret = await psRemote.invokePromise();

  console.log(ret);
});
