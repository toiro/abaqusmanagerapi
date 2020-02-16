const iconv = require('iconv-lite');
const childProcess = require('child_process');

/*
(async () => {
  try {
    const ipconfig = childProcess.spawn('ipconfig')
    ipconfig.stdout.on('data', function (data) {
      console.log(iconv.decode(data, 'Shift_JIS'))
    })
  } finally {
  }
})();
*/

(async() => {
  try {
    const ipconfig = childProcess.spawn('ipconfig');
    ipconfig.stdout.on('data', data => {
      console.log(iconv.decode(data, 'Shift_JIS'));
    });
  } finally {
  }
})();
