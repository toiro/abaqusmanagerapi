import connectDb, { getGridFSB } from 'app/store/connectdb.js'
import JobModel from 'app/store/model/job.js'
import mongoose from 'mongoose'
import type { IJob } from 'sharedDefinitions/model/job'
import gridfs from 'app/store/gridfs-promise.js'

async function main() {
  await connectDb()

  const bucket = getGridFSB()
  const files = await bucket.find({}).toArray()
  const allFilesDict = files.reduce(
    (d: { [key: string]: mongoose.mongo.GridFSFile }, file: mongoose.mongo.GridFSFile) => {
      // eslint-disable-next-line no-param-reassign
      d[file._id.toString()] = file
      return d
    },
    {}
  )

  const linkedFilesSet = (
    await JobModel.find({
      'input.type': 'upload',
    }).exec()
  ).map((job: IJob) => {
    if (job.input.type !== 'upload') throw new Error('something wrong.')
    return job.input.uploaded.toString()
  })

  console.log('GridFS files:')

  Object.entries(allFilesDict).forEach(([id, file]) => {
    console.log(`- ${file.filename} (${id})`)
  })

  console.log('With linked files:')
  linkedFilesSet.forEach((id) => {
    const file = allFilesDict[id]
    if (file) {
      console.log(`- ${file.filename} (${id})`)
    } else {
      console.log(`- ${id}`)
    }
  })

  const unlinkedFilesSet = Object.keys(allFilesDict).filter((id) => !linkedFilesSet.includes(id))
  console.log('Unlinked files:')
  unlinkedFilesSet.forEach((id) => {
    const file = allFilesDict[id]
    if (file) {
      console.log(`- ${file.filename} (${id})`)
    } else {
      console.log(`- ${id}`)
    }
  })

  console.log(`Total: ${Object.keys(allFilesDict).length} files`)
  console.log(`Linked: ${linkedFilesSet.length} files`)
  console.log(`Unlinked: ${unlinkedFilesSet.length} files`)

  const sum = Object.keys(allFilesDict).length - linkedFilesSet.length - unlinkedFilesSet.length
  if (sum !== 0) {
    console.warn('Something wrong.')
  } else {
    console.log('Check sum: OK')
  }

  await Promise.all(
    unlinkedFilesSet.map(async (id) => {
      const file = allFilesDict[id]
      if (!file) return
      console.log(`Delete: ${file.filename} (${id})`)
      await gridfs.delete(id)
    })
  )
}

main()
  .catch(console.error)
  .finally(() => process.exit(0))
