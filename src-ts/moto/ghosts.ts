import Constants from '../constants.js'
import Ghost from './ghost.js'
import Replay from './replay.js'

var Ghosts

Ghosts = (function () {
  function Ghosts(level) {
    this.level = level
    this.assets = level.assets
    this.options = level.options
    this.player = {}
    this.others = []
    this.load_replays()
  }

  Ghosts.prototype.load_assets = function () {
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

  Ghosts.prototype.all_ghosts = function () {
    var ghosts
    ghosts = []
    ghosts = ghosts.concat(this.others)
    ghosts.push(this.player)
    return ghosts
  }

  Ghosts.prototype.init = function () {
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

  Ghosts.prototype.reload = function () {
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

  Ghosts.prototype.move = function () {
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

  Ghosts.prototype.update = function () {
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

  Ghosts.prototype.load_replays = function () {
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

  return Ghosts
})()

export default Ghosts
