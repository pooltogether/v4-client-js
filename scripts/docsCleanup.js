#!/usr/bin/env node

const fs = require('fs')

// Delete files
let paths = []
try {
  for (let index = 0; index < paths.length; index++) {
    const element = paths[index]
    fs.unlinkSync(element)
  }
} catch (err) {
  console.error(err)
}

// Move files
paths = [
  ['./docs/md/classes', './docs/md/Classes'],
  ['./docs/md/interfaces', './docs/md/Interfaces'],
  ['./docs/md/modules.md', './docs/md/Exports.md']
]
try {
  for (let index = 0; index < paths.length; index++) {
    const element = paths[index]
    fs.renameSync(element[0], element[1])
  }
} catch (err) {
  console.error(err)
}

// Delete folders
paths = ['./docs/md/modules']
try {
  for (let index = 0; index < paths.length; index++) {
    const element = paths[index]
    fs.rmdirSync(element, { recursive: true })
  }
} catch (err) {
  console.error(err)
}
