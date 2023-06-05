import Constants from '../constants.js'
import Level from '../level.js'
import Assets from '../utils/assets.js'
import Ghost from './ghost.js'
import Replay from './replay.js'

class Ghosts {
  level: Level
  assets: Assets
  options: any
  player?: Ghost
  others: Ghost[]

  constructor(level: Level) {
    this.level = level
    this.assets = level.assets
    this.options = level.options

    this.others = []
    this.load_replays()
  }

  load_assets() {
    // Assets
    const parts = [
      Constants.torso,
      Constants.upper_leg,
      Constants.lower_leg,
      Constants.upper_arm,
      Constants.lower_arm,
      Constants.body,
      Constants.left_wheel,
      Constants.right_wheel,
      Constants.left_axle,
      Constants.right_axle,
    ]

    for (const part of parts) {
      this.assets.moto.push(part.ghost_texture)
    }
  }

  all_ghosts() {
    const ghosts = ([] as Ghost[]).concat(this.others)
    if (this.player) {
      ghosts.push(this.player)
    }
    return ghosts
  }

  init() {
    for (const ghost of this.all_ghosts())
      if (ghost.replay) {
        ghost.init()
      }
  }

  reload() {
    for (const ghost of this.all_ghosts())
      if (ghost.replay) {
        ghost.reload()
      }
  }

  move() {
    for (const ghost of this.all_ghosts())
      if (ghost.replay) {
        ghost.move()
      }
  }

  update() {
    for (const ghost of this.all_ghosts())
      if (ghost.replay) {
        ghost.update()
      }
  }

  load_replays() {
    for (const option_replay of this.options.replays) {
      const replay = new Replay(this.level)
      replay.load(option_replay.replay)
      if (!this.options.playable && option_replay.follow) {
        this.player = new Ghost(this.level, replay, false)
      } else {
        this.others.push(new Ghost(this.level, replay))
      }
    }
  }
}

export default Ghosts
