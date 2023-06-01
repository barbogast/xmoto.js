import LZString from 'lz-string'

import Constants from '../constants.js'

var ReplayConversionService

ReplayConversionService = (function () {
  function ReplayConversionService() {}

  ReplayConversionService.inputs_to_string = function (inputs) {
    var j, k, key, len, len1, ref, ref1, step, string
    string = ''
    ref = [
      'up_down',
      'up_up',
      'down_down',
      'down_up',
      'left_down',
      'left_up',
      'right_down',
      'right_up',
      'space_pressed',
    ]
    for (j = 0, len = ref.length; j < len; j++) {
      key = ref[j]
      string += key + ':'
      ref1 = inputs[key]
      for (k = 0, len1 = ref1.length; k < len1; k++) {
        step = ref1[k]
        string += step + ','
      }
      if (string[string.length - 1] === ',') {
        string = string.slice(0, -1)
      }
      string += '|'
    }
    string = string.slice(0, -1)
    return LZString.compressToBase64(string)
  }

  ReplayConversionService.string_to_inputs = function (string) {
    var i, inputs, j, k, key, keys, len, len1, name, splitted, step, values
    inputs = {}
    string = LZString.decompressFromBase64(string)
    keys = string.split('|')
    for (j = 0, len = keys.length; j < len; j++) {
      key = keys[j]
      splitted = key.split(':')
      name = splitted[0]
      values = splitted[1].split(',')
      inputs[name] = []
      if (values[0] !== '') {
        for (i = k = 0, len1 = values.length; k < len1; i = ++k) {
          step = values[i]
          inputs[name][i] = parseInt(step)
        }
      }
    }
    return inputs
  }

  ReplayConversionService.key_steps_to_string = function (key_steps) {
    var a, b, c, d, e, f, j, key, key_step, len, ref, step, string
    string = Constants.replay_key_step + '@'
    for (step in key_steps) {
      key_step = key_steps[step]
      ref = [
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
      for (j = 0, len = ref.length; j < len; j++) {
        key = ref[j]
        a = key_step[key].position.x.toFixed(
          Constants.replay_key_step_precision
        )
        b = key_step[key].position.y.toFixed(
          Constants.replay_key_step_precision
        )
        c = key_step[key].angle.toFixed(Constants.replay_key_step_precision)
        d = key_step[key].linear_velocity.x.toFixed(
          Constants.replay_key_step_precision
        )
        e = key_step[key].linear_velocity.y.toFixed(
          Constants.replay_key_step_precision
        )
        f = key_step[key].angular_velocity.toFixed(
          Constants.replay_key_step_precision
        )
        string += a + ',' + b + ',' + c + ',' + d + ',' + e + ',' + f + '|'
      }
      string = string.slice(0, -1)
      string += '='
    }
    if (string[string.length - 1] === '=') {
      string = string.slice(0, -1)
    }
    return LZString.compressToBase64(string)
  }

  ReplayConversionService.string_to_key_steps = function (string) {
    var current_interval,
      element,
      i,
      j,
      k,
      key_step,
      key_step_string,
      key_steps,
      key_steps_string,
      len,
      len1,
      part_string,
      ref,
      ref1,
      step_interval,
      value_string
    key_steps = {}
    string = LZString.decompressFromBase64(string)
    key_steps_string = string.split('@')[1]
    step_interval = parseInt(string.split('@')[0])
    current_interval = step_interval
    if (key_steps_string.indexOf('=') === -1) {
      return key_steps
    }
    ref = key_steps_string.split('=')
    for (j = 0, len = ref.length; j < len; j++) {
      key_step_string = ref[j]
      key_step = {}
      part_string = key_step_string.split('|')
      ref1 = [
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
      for (i = k = 0, len1 = ref1.length; k < len1; i = ++k) {
        element = ref1[i]
        value_string = part_string[i].split(',')
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

  return ReplayConversionService
})()

export default ReplayConversionService
