#! /usr/bin/env node

const commander = require('commander')
const fs = require('fs-extra')
const { exec, spawn } = require('child_process')

commander
  .version(require('./package.json').version)
  .description('Quick React-Native Run-IOS')
  .action(start)

commander
  .option('-l --latest', 'run latest used device')

commander.parse(process.argv)

function start({ latest }) {
  if (require('os').platform() == 'darwin') {
    const inquirer = require('inquirer')
  
    const getIOSDeviceProcess = exec('xcrun simctl list --json devices available')
  
    let message = ''
  
    getIOSDeviceProcess.stdout.on('data', jsonString => message += jsonString)
  
    getIOSDeviceProcess.on('exit', () => {
      const json = JSON.parse(message)
  
      let choices = [ 'Physical Device' ]
  
      for (const key of Object.keys(json.devices)) {
        if (key.startsWith('com.apple.CoreSimulator.SimRuntime.iOS')) {
          choices = choices.concat(json.devices[key].map(({ name }) => name))
        }
      }

      const userPickHistoryFilePath = __dirname + '/user-pick-history.json'

      let userPickHistory = []

      try {
        const lastUserPickHistory = require(userPickHistoryFilePath)

        userPickHistory = lastUserPickHistory
      } catch(err) { }
      
      for (let index = userPickHistory.length - 1; index >= 0; index--) {
        const item = userPickHistory[index]
        
        const itemIndex = choices.indexOf(item)

        if (itemIndex != -1) {
          choices.splice(choices.indexOf(item), 1)
          choices.unshift(item)
        }
      }

      if (latest) {
        runDevice(choices[0])
      } else {
        inquirer.prompt([
          {
            type: 'list',
            name: 'device',
            message: 'Quick React-Native Run-IOS',
            choices
          }
        ]).then(({device}) => {
          const deviceIndex = userPickHistory.indexOf(device)
  
          if (deviceIndex != -1) {
            userPickHistory.splice(deviceIndex, 1)
          }
  
          userPickHistory.unshift(device)
  
          fs.writeFileSync(userPickHistoryFilePath, JSON.stringify(userPickHistory, null, 2))

          runDevice(device)
        })
      }
    })
  } else {
    console.log('Sorry, run-ios is not supported with your operating system')
  }
}

function runDevice(device) {
  const deviceParameter = device == 'Physical Device' ? `--device` : `--simulator="${device}"`
  
  spawn('npx', [`react-native`, `run-ios`, deviceParameter], {stdio: 'inherit', shell: true})
}
  