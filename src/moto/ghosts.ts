import Constants from '../constants.js'
import Ghost from './ghost.js'
import Replay from './replay.js'

class Ghosts {
  level: any
  assets: any
  options: any
  player: Ghost
  others: any[]

  constructor(level) {
    this.level = level
    this.assets = level.assets
    this.options = level.options
    this.others = []
    this.load_replays()
  }

  load_assets() {
    var i, len, part, parts, results
    parts = [
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
    results = []
    for (i = 0, len = parts.length; i < len; i++) {
      part = parts[i]
      results.push(this.assets.moto.push(part.ghost_texture))
    }
    return results
  }

  all_ghosts() {
    var ghosts
    ghosts = []
    ghosts = ghosts.concat(this.others)
    if (this.player) {
      ghosts.push(this.player)
    }
    return ghosts
  }

  init() {
    var ghost, i, len, ref, results
    ref = this.all_ghosts()
    results = []
    for (i = 0, len = ref.length; i < len; i++) {
      ghost = ref[i]
      if (ghost.replay) {
        results.push(ghost.init())
      } else {
        results.push(void 0)
      }
    }
    return results
  }

  reload() {
    var ghost, i, len, ref, results
    ref = this.all_ghosts()
    results = []
    for (i = 0, len = ref.length; i < len; i++) {
      ghost = ref[i]
      if (ghost.replay) {
        results.push(ghost.reload())
      } else {
        results.push(void 0)
      }
    }
    return results
  }

  move() {
    var ghost, i, len, ref, results
    ref = this.all_ghosts()
    results = []
    for (i = 0, len = ref.length; i < len; i++) {
      ghost = ref[i]
      if (ghost.replay) {
        results.push(ghost.move())
      } else {
        results.push(void 0)
      }
    }
    return results
  }

  update() {
    var ghost, i, len, ref, results
    ref = this.all_ghosts()
    results = []
    for (i = 0, len = ref.length; i < len; i++) {
      ghost = ref[i]
      if (ghost.replay) {
        results.push(ghost.update())
      } else {
        results.push(void 0)
      }
    }
    return results
  }

  load_replays() {
    var i, len, option_replay, ref, replay, results
    ref = this.options.replays
    results = []
    for (i = 0, len = ref.length; i < len; i++) {
      option_replay = ref[i]
      replay = new Replay(this.level)
      replay.load(option_replay.replay)
      if (!this.options.playable && option_replay.follow) {
        results.push((this.player = new Ghost(this.level, replay, false)))
      } else {
        results.push(this.others.push(new Ghost(this.level, replay)))
      }
    }

    return results
  }
}

export default Ghosts
