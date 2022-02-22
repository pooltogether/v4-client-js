#!/usr/bin/env node

const fs = require('fs')

// const path = './docs/md/modules.md'
// try {
//   fs.unlinkSync(path)
// } catch (err) {
//   console.error(err)
// }

const paths = [
  //   ['./docs/md/modules/calculate.md', './docs/md/calculate.md'],
  //   ['./docs/md/modules/compute.md', './docs/md/compute.md'],
  //   ['./docs/md/modules/utils.md', './docs/md/utils.md']
]

try {
  for (let index = 0; index < paths.length; index++) {
    const element = paths[index]
    fs.renameSync(element[0], element[1])
  }
} catch (err) {
  console.error(err)
}
