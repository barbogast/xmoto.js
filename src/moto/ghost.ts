import Level from '../level.js'
import Moto from './moto.js'
import Replay from './replay.js'

class Ghost {
  level: Level
  replay: Replay
  transparent: boolean
  moto: Moto

  constructor(level: Level, replay: Replay, transparent = true) {
    this.level = level
    this.replay = replay
    this.transparent = transparent
    this.moto = new Moto(this.level, this.transparent)
  }

  init() {
    this.moto.init()
  }

  reload() {
    this.moto.destroy()
    this.moto = new Moto(this.level, this.transparent)
    this.moto.init()
  }

  move() {
    this.move_with_input() // every steps
    this.move_with_key_step() // only when key step
  }

  move_with_input() {
    const current_input = {
      up: this.replay.is_down('up'),
      down: this.replay.is_down('down'),
      left: this.replay.is_down('left'),
      right: this.replay.is_down('right'),
      space: this.replay.is_pressed('space'),
    }
    this.moto.move(current_input)
  }

  move_with_key_step() {
    const key_step = this.replay.key_steps[this.level.physics.steps]
    if (key_step) {
      const bike_parts = [
        'body',
        'left_wheel',
        'right_wheel',
        'left_axle',
        'right_axle',
      ]
      for (const part of bike_parts) {
        this.set_part_position(this.moto, part, key_step)
      }

      const rider_parts = [
        'torso',
        'upper_leg',
        'lower_leg',
        'upper_arm',
        'lower_arm',
      ]
      for (const part of rider_parts) {
        this.set_part_position(this.moto.rider, part, key_step)
      }
    }
  }

  update() {
    this.moto.update()
  }

  set_part_position(entity, part, key_step) {
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
}

export default Ghost
