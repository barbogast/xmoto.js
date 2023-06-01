var Ghost

Ghost = (function () {
  function Ghost(level, replay, transparent) {
    if (transparent == null) {
      transparent = true
    }
    this.level = level
    this.replay = replay
    this.transparent = transparent
    this.moto = new Moto(this.level, this.transparent)
  }

  Ghost.prototype.init = function () {
    return this.moto.init()
  }

  Ghost.prototype.reload = function () {
    this.moto.destroy()
    this.moto = new Moto(this.level, this.transparent)
    return this.moto.init()
  }

  Ghost.prototype.move = function () {
    this.move_with_input()
    return this.move_with_key_step()
  }

  Ghost.prototype.move_with_input = function () {
    var current_input
    current_input = {
      up: this.replay.is_down('up'),
      down: this.replay.is_down('down'),
      left: this.replay.is_down('left'),
      right: this.replay.is_down('right'),
      space: this.replay.is_pressed('space'),
    }
    return this.moto.move(current_input)
  }

  Ghost.prototype.move_with_key_step = function () {
    var i, j, key_step, len, len1, part, ref, ref1, results
    key_step = this.replay.key_steps[this.level.physics.steps]
    if (key_step) {
      ref = ['body', 'left_wheel', 'right_wheel', 'left_axle', 'right_axle']
      for (i = 0, len = ref.length; i < len; i++) {
        part = ref[i]
        this.set_part_position(this.moto, part, key_step)
      }
      ref1 = ['torso', 'upper_leg', 'lower_leg', 'upper_arm', 'lower_arm']
      results = []
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        part = ref1[j]
        results.push(this.set_part_position(this.moto.rider, part, key_step))
      }
      return results
    }
  }

  Ghost.prototype.update = function () {
    return this.moto.update()
  }

  Ghost.prototype.set_part_position = function (entity, part, key_step) {
    entity[part].SetPosition({
      x: key_step[part].position.x,
      y: key_step[part].position.y,
    })
    entity[part].SetAngle(key_step[part].angle)
    entity[part].SetLinearVelocity({
      x: key_step[part].linear_velocity.x,
      y: key_step[part].linear_velocity.y,
    })
    return entity[part].GetAngularVelocity(key_step[part].angular_velocity)
  }

  return Ghost
})()
