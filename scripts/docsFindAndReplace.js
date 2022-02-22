const replaceInFiles = require('replace-in-files')

const replaces = [
  //   [/modules.md/g, 'modules'],
  //   [/calculate.md/g, ''],
  //   [/Namespace:/g, '']
]

const createOptions = (from, to) => {
  const options = {
    files: 'docs/md/**/*.md',
    from: from, // string or regex
    to: to, // string or fn  (fn: carrying last argument - path to replaced file)
    optionsForFiles: {
      ignore: ['**/node_modules/**']
    },
    saveOldFile: false,
    encoding: 'utf8',
    shouldSkipBinaryFiles: true,
    onlyFindPathsWithoutReplace: false,
    returnPaths: true,
    returnCountOfMatchesByPaths: true
  }
  return options
}

for (let index = 0; index < replaces.length; index++) {
  const element = replaces[index]
  replaceInFiles(createOptions(element[0], element[1]))
    .then(({ changedFiles, countOfMatchesByPaths }) => {
      console.log('Modified files:', changedFiles)
      console.log('Count of matches by paths:', countOfMatchesByPaths)
      console.log('was called with:', options)
    })
    .catch((error) => {
      console.error('Error occurred:', error)
    })
}
