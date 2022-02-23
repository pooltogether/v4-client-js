const replaceInFiles = require('replace-in-files')

const replaces = [
  [/modules\/calculate/g, '/protocol/libraries/v4-utils-js/calculate'],
  [/modules\/compute/g, '/protocol/libraries/v4-utils-js/compute'],
  [/modules\/utils/g, '/protocol/libraries/v4-utils-js/utils'],
  [/modules.md/g, 'Exports'],
  [/.md#/g, '#'],
  [/.md/g, ' '],
  [/# @pooltogether\/v4-client-js/g, '# Exports'],
  [/interfaces\//g, 'Interfaces/'],
  [/classes\//g, 'Classes/'],
  [/Class:/g, ' '],
  [/Interface:/g, ' ']
]

const createOptions = (from, to) => {
  const options = {
    files: 'docs/md/**/*.md',
    from: from, // string or regex
    to: to, // string or fn  (fn: carrying last argument - path to replaced file)
    optionsForFiles: {
      ignore: ['**/node_modules/**']
    },
    allowEmptyPaths: true,
    saveOldFile: false,
    encoding: 'utf8',
    shouldSkipBinaryFiles: true,
    onlyFindPathsWithoutReplace: false,
    returnPaths: true,
    returnCountOfMatchesByPaths: true
  }
  return options
}

const doNextPromise = (index) => {
  const element = replaces[index]

  replaceInFiles(createOptions(element[0], element[1])).then(
    ({ changedFiles, countOfMatchesByPaths }) => {
      console.log('Modified files:', changedFiles)
      console.log('Count of matches by paths:', countOfMatchesByPaths)
      index++
      if (index < replaces.length) {
        doNextPromise(index)
      }
    }
  )
}

doNextPromise(0)
