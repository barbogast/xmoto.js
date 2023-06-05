// Convert replay from object to minified string to be send to the server
// And vice versa

import LZString from 'lz-string'

import Constants from '../constants.js'
import { ReplayInputs } from '../moto/replay.js'

// String is like : "keyA:199,240,569|keyB:29,40,55..."
export function inputs_to_string(inputs: ReplayInputs) {
  let string = ''
  const keys = [
    'up_down',
    'up_up',
    'down_down',
    'down_up',
    'left_down',
    'left_up',
    'right_down',
    'right_up',
    'space_pressed',
  ] as const
  for (const key of keys) {
    string += key + ':'
    for (const step of inputs[key]) {
      string += step + ','
    }
    if (string[string.length - 1] === ',') {
      string = string.slice(0, -1) // remove last ',' if any
    }
    string += '|'
  }
  string = string.slice(0, -1) // remove last '|'
  return LZString.compressToBase64(string)
}

export function string_to_inputs(string: string): ReplayInputs {
  const inputs: ReplayInputs = {
    up_down: [],
    up_up: [],
    down_down: [],
    down_up: [],
    left_down: [],
    left_up: [],
    right_down: [],
    right_up: [],
    space_pressed: [],
  }
  string = LZString.decompressFromBase64(string)
  const keys = string.split('|')

  for (const key of keys) {
    const splitted = key.split(':')
    const name = splitted[0] as keyof ReplayInputs
    const values = splitted[1].split(',')

    inputs[name] = []
    if (values[0] !== '') {
      for (const [i, step] of values.entries()) {
        inputs[name][i] = parseInt(step)
      }
    }
  }
  return inputs
}

// String is like : "60@step1=step2=step3=..." where 60 is the key-step interval of the replay
// step1 is like : "part1_positions|part2_positions|...|part10_positions"
// part1_positions is like : "11.1234,22.1234,33.1234,44.1234,55.1234,66.1234" (each position and angle values)
export function key_steps_to_string(key_steps) {
  let string = Constants.replay_key_step + '@'
  for (const step in key_steps) {
    const key_step = key_steps[step]
    const keys = [
      'body',
      'left_wheel',
      'right_wheel',
      'left_axle',
      'right_axle',
      'torso',
      'upper_leg',
      'lower_leg',
      'upper_arm',
      'lower_arm',
    ] as const
    for (const key of keys) {
      const a = key_step[key].position.x.toFixed(
        Constants.replay_key_step_precision
      )
      const b = key_step[key].position.y.toFixed(
        Constants.replay_key_step_precision
      )
      const c = key_step[key].angle.toFixed(Constants.replay_key_step_precision)
      const d = key_step[key].linear_velocity.x.toFixed(
        Constants.replay_key_step_precision
      )
      const e = key_step[key].linear_velocity.y.toFixed(
        Constants.replay_key_step_precision
      )
      const f = key_step[key].angular_velocity.toFixed(
        Constants.replay_key_step_precision
      )
      string += a + ',' + b + ',' + c + ',' + d + ',' + e + ',' + f + '|'
    }
    string = string.slice(0, -1) // remove last '|'
    string += '='
  }
  if (string[string.length - 1] === '=') {
    string = string.slice(0, -1)
  }

  return LZString.compressToBase64(string)
}

export function string_to_key_steps(string: string) {
  const key_steps = {}
  string = LZString.decompressFromBase64(string)
  const key_steps_string = string.split('@')[1]

  const step_interval = parseInt(string.split('@')[0])
  let current_interval = step_interval

  // If no "=", then there are no key-steps and we return empty object
  if (key_steps_string.indexOf('=') === -1) {
    return key_steps
  }

  for (const key_step_string of key_steps_string.split('=')) {
    const key_step = {}
    const part_string = key_step_string.split('|')
    const elements = [
      'body',
      'left_wheel',
      'right_wheel',
      'left_axle',
      'right_axle',
      'torso',
      'upper_leg',
      'lower_leg',
      'upper_arm',
      'lower_arm',
    ]
    for (const [i, element] of elements.entries()) {
      const value_string = part_string[i].split(',')
      key_step[element] = {
        position: {
          x: parseFloat(value_string[0]),
          y: parseFloat(value_string[1]),
        },
        angle: parseFloat(value_string[2]),
        linear_velocity: {
          x: parseFloat(value_string[3]),
          y: parseFloat(value_string[4]),
        },
        angular_velocity: parseFloat(value_string[5]),
      }
    }

    key_steps[current_interval] = key_step
    current_interval += step_interval
  }
  return key_steps
}
