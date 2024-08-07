import config from 'config'
import { Command } from 'commander'
import mongoose from 'mongoose'
import graceful from 'node-graceful'
import { logger } from 'utils/logger.js'
import connectDb from 'app/store/connectdb.js'
import api from 'app/apiserver/index.js'
import launcher from 'app/launcher/index.js'

logger.info(`Start on mode:${config.get<string>('env')}`)

const program = new Command()
program
  .option('-H, --host <host>', `specify the host [${config.get<string>('host')}]`, config.get('host'))
  .option('-p, --port <port>', `specify the port [${config.get<number>('port')}]`, config.get('port'))
  .parse()
const options = program.opts()

// graceful.captureExceptions = true;
// graceful.captureRejections = true;
graceful.on('exit', (signal: string) => logger.info(`Recieve exit signal: ${signal}`))

// eslint-disable-next-line @typescript-eslint/no-floating-promises
;(async () => {
  try {
    await connectDb()
  } catch (error) {
    logger.error(error)
    throw new Error('Failed to Connect Database.')
  }
  graceful.on('exit', () => mongoose.connection.close())

  const appApi = api()

  const host = options.host as string
  const port = options.port as number

  const server = appApi
    .listen(port, host)
    .on('close', () => {
      logger.verbose(`Closed listening on ${host}:${port}`)
    })
    .on('error', (error) => {
      logger.error(error)
      graceful.exit()
    })
  graceful.on('exit', () => server.close())

  logger.verbose(`Start listening on ${host}:${port}`)

  const appLauncher = await launcher()
  appLauncher.start()
  graceful.on('exit', () => appLauncher.stop())
  // */
})()
