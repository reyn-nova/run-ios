#! /usr/bin/env node

const commander = require('commander')
const fs = require('fs-extra')

commander
  .version(require('./package.json').version)
  .description('Quick React-Native Run-IOS')
  .action(() => start())

commander.parse(process.argv)

function start() {
  if (require('os').platform() == 'darwin') {
    const inquirer = require('inquirer')
  
    const { spawn, exec } = require('child_process')
  
    const getIOSDeviceProcess = exec('xcrun simctl list --json devices available')
  
    let message = ''
  
    getIOSDeviceProcess.stdout.on('data', jsonString => message += jsonString)
  
    getIOSDeviceProcess.on('exit', () => {
      const json = JSON.parse(message)
  
      let choices = []
  
      for (const key of Object.keys(json.devices)) {
        if (key.startsWith('com.apple.CoreSimulator.SimRuntime.iOS')) {
          choices = json.devices[key].map(({ name }) => name)
        }
      }

      const userPickHistoryFilePath = __dirname + '/user-pick-history.json'

      let userPickHistory = []

      try {
        const lastUserPickHistory = require(userPickHistoryFilePath)

        userPickHistory = lastUserPickHistory
      } catch(err) { }
      
      for (let i = userPickHistory.length - 1; i >= 0; i--) {
        const item = userPickHistory[i]
        
        const itemIndex = choices.indexOf(item)

        if (itemIndex != -1) {
          choices.splice(choices.indexOf(item), 1)
          choices.unshift(item)
        }
      }
  
      inquirer.prompt([
        {
          type: 'list',
          name: 'device',
          message: 'Quick React-Native Run-IOS',
          choices
        }
      ])
      .then(({device}) => {
        const deviceIndex = userPickHistory.findIndex(item => item == device)

        if (deviceIndex != -1) {
          userPickHistory.splice(deviceIndex, 1)
        }

        userPickHistory.unshift(device)

        fs.writeFileSync(userPickHistoryFilePath, JSON.stringify(userPickHistory, null, 2))

        spawn('npx', [`react-native`, `run-ios`, `--simulator="${device}"`], {stdio: 'inherit', shell: true})
      })
    })
  } else {
    console.log('Sorry, run-ios is not supported with your operating system')
  }
}
  