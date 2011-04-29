{exec} = require 'child_process'

# Run a CoffeeScript through our node/coffee interpreter.
run = (args) ->
  proc =         spawn 'bin/coffee', args
  proc.stderr.on 'data', (buffer) -> console.log buffer.toString()
  proc.on        'exit', (status) -> process.exit(1) if status != 0

# Log a message with a color.
log = (message, color, explanation) ->
  console.log color + message + reset + ' ' + (explanation or '')


task 'build', 'Build project from [.|lib]/*.coffee to [.|lib]/*.js', ->
  exec 'coffee --compile ./', (err, stdout, stderr) ->
    throw err if err
    console.log stdout + stderr