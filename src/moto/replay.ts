import $ from 'jquery'

import Constants from '../constants.js'
import * as ReplayConversionService from '../services/replay_conversion_service.js'
import Level from '../level.js'

export type ReplayInputs = {
  up_down: any[]
  up_up: any[]
  down_down: any[]
  down_up: any[]
  left_down: any[]
  left_up: any[]
  right_down: any[]
  right_up: any[]
  space_pressed: any[]
}

class Replay {
  level: any
  success: boolean
  steps: number
  inputs: ReplayInputs
  key_steps: {}

  constructor(level: Level) {
    this.level = level
    this.success = false
    this.steps = 0
    this.inputs = {
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
    this.key_steps = {}
  }

  clone() {
    const new_replay = new Replay(this.level)
    new_replay.success = this.success
    new_replay.steps = this.steps

    // Copy inputs
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
      new_replay.inputs[key] = this.inputs[key].slice()
    }

    // Copy key-steps
    for (const [key, value] of Object.entries(this.key_steps)) {
      new_replay.key_steps[key] = {}
      const parts = [
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
      for (const part of parts) {
        new_replay.key_steps[key][part] = {
          position: {
            x: value[part].position.x,
            y: value[part].position.y,
          },
          angle: value[part].angle,
          linear_velocity: {
            x: value[part].linear_velocity.x,
            y: value[part].linear_velocity.y,
          },
          angular_velocity: value[part].angular_velocity,
        }
      }
    }
    return new_replay
  }

  add_step() {
    this.steps = this.level.physics.steps
    this.add_inputs()
    this.add_key_steps()
  }

  add_inputs() {
    const input = this.level.input

    for (const key of ['up', 'down', 'left', 'right']) {
      if (input[key] && this.is_up(key)) {
        this.inputs[key + '_down'].push(this.steps)
      } else if (!input[key] && this.is_down(key)) {
        this.inputs[key + '_up'].push(this.steps)
      }
    }

    if (input.space) {
      this.inputs['space_pressed'].push(this.steps)
    }
  }

  add_key_steps() {
    const moto = this.level.moto
    const rider = moto.rider

    if (this.steps % Constants.replay_key_step === 0) {
      const key_step = (this.key_steps[this.steps.toString()] = {})

      const moto_parts = [
        'body',
        'left_wheel',
        'right_wheel',
        'left_axle',
        'right_axle',
      ]
      for (const part of moto_parts) {
        key_step[part] = this.physics_values(moto[part])
      }

      const rider_parts = [
        'torso',
        'upper_leg',
        'lower_leg',
        'upper_arm',
        'lower_arm',
      ]
      for (const part of rider_parts) {
        key_step[part] = this.physics_values(rider[part])
      }
    }
  }

  // TODO dichotomic search
  last(input) {
    let last_element = null
    const input_length = this.inputs[input].length
    const steps = this.level.physics.steps
    for (const [i, element] of this.inputs[input].entries()) {
      if (
        element <= steps &&
        (i + 1 > input_length - 1 || this.inputs[input][i + 1] > steps)
      ) {
        last_element = element
        break
      }
    }
    return last_element
  }

  is_up(key) {
    return this.last(key + '_up') >= this.last(key + '_down')
  }

  is_down(key) {
    return this.last(key + '_down') >= this.last(key + '_up')
  }

  is_pressed(key) {
    return this.last(key + '_pressed') === this.level.physics.steps
  }

  load(data) {
    const splitted = data.split('\n')
    console.log('LOAD', data)

    this.inputs = ReplayConversionService.string_to_inputs(splitted[0])
    this.key_steps = ReplayConversionService.string_to_key_steps(splitted[1])
    this.success = true
    return this
  }

  save() {
    const inputs_string = ReplayConversionService.inputs_to_string(this.inputs)
    const key_steps_string = ReplayConversionService.key_steps_to_string(
      this.key_steps
    )
    const replay_string = inputs_string + '\n' + key_steps_string

    $.post(this.level.options.scores_path, {
      level: this.level.infos.identifier,
      time: this.level.current_time,
      steps: this.steps,
      replay: replay_string,
    })
  }

  physics_values(object) {
    return {
      position: {
        x: object.GetPosition().x,
        y: object.GetPosition().y,
      },
      angle: object.GetAngle(),
      linear_velocity: {
        x: object.GetLinearVelocity().x,
        y: object.GetLinearVelocity().y,
      },
      angular_velocity: object.GetAngularVelocity(),
    }
  }
}

export default Replay
