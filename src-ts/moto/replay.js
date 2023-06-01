var Replay

Replay = (function () {
  function Replay(level) {
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

  Replay.prototype.clone = function () {
    var j, k, key, len, len1, new_replay, part, ref, ref1, ref2, value
    new_replay = new Replay(this.level)
    new_replay.success = this.success
    new_replay.steps = this.steps
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
      new_replay.inputs[key] = this.inputs[key].slice()
    }
    ref1 = this.key_steps
    for (key in ref1) {
      value = ref1[key]
      new_replay.key_steps[key] = {}
      ref2 = [
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
      for (k = 0, len1 = ref2.length; k < len1; k++) {
        part = ref2[k]
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

  Replay.prototype.add_step = function () {
    this.steps = this.level.physics.steps
    this.add_inputs()
    return this.add_key_steps()
  }

  Replay.prototype.add_inputs = function () {
    var input, j, key, len, ref
    input = this.level.input
    ref = ['up', 'down', 'left', 'right']
    for (j = 0, len = ref.length; j < len; j++) {
      key = ref[j]
      if (input[key] && this.is_up(key)) {
        this.inputs[key + '_down'].push(this.steps)
      } else if (!input[key] && this.is_down(key)) {
        this.inputs[key + '_up'].push(this.steps)
      }
    }
    if (input.space) {
      return this.inputs['space_pressed'].push(this.steps)
    }
  }

  Replay.prototype.add_key_steps = function () {
    var j, k, key_step, len, len1, moto, part, ref, ref1, results, rider
    moto = this.level.moto
    rider = moto.rider
    if (this.steps % Constants.replay_key_step === 0) {
      key_step = this.key_steps[this.steps.toString()] = {}
      ref = ['body', 'left_wheel', 'right_wheel', 'left_axle', 'right_axle']
      for (j = 0, len = ref.length; j < len; j++) {
        part = ref[j]
        key_step[part] = this.physics_values(moto[part])
      }
      ref1 = ['torso', 'upper_leg', 'lower_leg', 'upper_arm', 'lower_arm']
      results = []
      for (k = 0, len1 = ref1.length; k < len1; k++) {
        part = ref1[k]
        results.push((key_step[part] = this.physics_values(rider[part])))
      }
      return results
    }
  }

  Replay.prototype.last = function (input) {
    var element, i, input_length, j, last_element, len, ref, steps
    last_element = null
    input_length = this.inputs[input].length
    steps = this.level.physics.steps
    ref = this.inputs[input]
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      element = ref[i]
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

  Replay.prototype.is_up = function (key) {
    return this.last(key + '_up') >= this.last(key + '_down')
  }

  Replay.prototype.is_down = function (key) {
    return this.last(key + '_down') >= this.last(key + '_up')
  }

  Replay.prototype.is_pressed = function (key) {
    return this.last(key + '_pressed') === this.level.physics.steps
  }

  Replay.prototype.load = function (data) {
    var splitted
    splitted = data.split('\n')
    this.inputs = ReplayConversionService.string_to_inputs(splitted[0])
    this.key_steps = ReplayConversionService.string_to_key_steps(splitted[1])
    this.success = true
    return this
  }

  Replay.prototype.save = function () {
    var inputs_string, key_steps_string, replay_string
    inputs_string = ReplayConversionService.inputs_to_string(this.inputs)
    key_steps_string = ReplayConversionService.key_steps_to_string(
      this.key_steps
    )
    replay_string = inputs_string + '\n' + key_steps_string
    return $.post(this.level.options.scores_path, {
      level: this.level.infos.identifier,
      time: this.level.current_time,
      steps: this.steps,
      replay: replay_string,
    })
  }

  Replay.prototype.physics_values = function (object) {
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

  return Replay
})()
