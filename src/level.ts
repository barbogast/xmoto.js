import $ from 'jquery'

import Camera from './camera.js'
import Assets from './utils/assets.js'
import Physics from './physics.js'
import Input from './input.js'
import Listeners from './listeners.js'
import Moto from './moto/moto.js'
import Particles from './moto/particles.js'
import Infos from './level_elements/infos.js'
import Sky from './level_elements/sky.js'
import Blocks from './level_elements/blocks.js'
import Limits from './level_elements/limits.js'
import LayerOffsets from './level_elements/layer_offsets.js'
import Script from './level_elements/script.js'
import Entities from './level_elements/entities.js'
import Replay from './moto/replay.js'
import Ghosts from './moto/ghosts.js'

export type Options = {
  canvas: string
  loading: string
  chrono: string
  width: number
  height: number
  replays: Replay[]
  playable: boolean
  zoom: number
  levels_path: string
  scores_path: string
  replays_path: string
}

var b2AABB, b2Vec2
// @ts-ignore
b2AABB = Box2D.Collision.b2AABB
// @ts-ignore
b2Vec2 = Box2D.Common.Math.b2Vec2

class Level {
  renderer: any
  options: Options
  debug_ctx: CanvasRenderingContext2D
  assets: Assets
  camera: Camera
  physics: any
  input: Input
  listeners: Listeners
  moto: Moto
  particles: Particles
  infos: Infos
  sky: Sky
  blocks: Blocks
  limits: Limits
  layer_offsets: LayerOffsets
  script: Script
  entities: Entities
  replay: Replay
  ghosts: Ghosts
  start_time: number
  current_time: number
  stage: any
  need_to_restart: boolean

  constructor(renderer, options) {
    this.renderer = renderer
    this.options = options
    this.debug_ctx = ($('#xmoto-debug').get(0) as HTMLCanvasElement).getContext(
      '2d'
    )
    // @ts-ignore
    this.stage = new PIXI.Container()
    this.assets = new Assets()
    this.camera = new Camera(this)
    this.physics = new Physics(this)
    this.input = new Input(this)
    this.listeners = new Listeners(this)
    this.moto = new Moto(this)
    this.particles = new Particles(this)
    this.infos = new Infos(this)
    this.sky = new Sky(this)
    this.blocks = new Blocks(this)
    this.limits = new Limits(this)
    this.layer_offsets = new LayerOffsets(this)
    this.script = new Script(this)
    this.entities = new Entities(this)
    this.replay = new Replay(this)
    this.ghosts = new Ghosts(this)
  }

  load_from_file(filename, callback) {
    return this.assets.parse_theme(
      'modern.xml',
      (function (_this) {
        return function () {
          return $.ajax({
            type: 'GET',
            url: _this.options.levels_path + '/' + filename,
            dataType: 'xml',
            success: function (xml) {
              return this.load_level(xml, callback)
            },
            context: _this,
          })
        }
      })(this)
    )
  }

  load_level(xml, callback) {
    this.infos.parse(xml)
    this.sky.parse(xml)
    this.blocks.parse(xml)
    this.limits.parse(xml)
    this.layer_offsets.parse(xml)
    this.script.parse(xml)
    this.entities.parse(xml)
    this.sky.load_assets()
    this.blocks.load_assets()
    this.limits.load_assets()
    this.entities.load_assets()
    this.moto.load_assets()
    this.ghosts.load_assets()
    return this.assets.load(callback)
  }

  init() {
    this.sky.init()
    this.blocks.init()
    this.limits.init()
    this.entities.init()
    this.moto.init()
    this.ghosts.init()
    this.physics.init()
    this.input.init()
    this.camera.init()
    this.listeners.init()
    return this.init_timer()
  }

  update() {
    var dead_player, dead_replay
    this.physics.update()
    dead_player = this.options.playable && !this.moto.dead
    dead_replay = !this.options.playable && !this.ghosts.player.moto.dead
    if (dead_player || dead_replay) {
      this.update_timer()
    }
    this.sky.update()
    this.limits.update()
    this.entities.update()
    this.camera.update()
    this.blocks.update()
    if (this.options.playable) {
      this.moto.update()
    }
    this.ghosts.update()
    return this.particles.update()
  }

  init_timer() {
    this.start_time = new Date().getTime()
    return (this.current_time = 0)
  }

  update_timer(update_now?) {
    var cents, minutes, new_time, seconds
    if (update_now == null) {
      update_now = false
    }
    new_time = new Date().getTime() - this.start_time
    if (
      update_now ||
      Math.floor(new_time / 10) > Math.floor(this.current_time / 10)
    ) {
      minutes = Math.floor(new_time / 1000 / 60)
      seconds = Math.floor(new_time / 1000) % 60
      if (seconds < 10) {
        seconds = '0' + seconds
      }
      cents = Math.floor(new_time / 10) % 100
      if (cents < 10) {
        cents = '0' + cents
      }
      $(this.options.chrono).text(minutes + ':' + seconds + ':' + cents)
    }
    return (this.current_time = new_time)
  }

  got_strawberries() {
    var i, len, ref, strawberry
    ref = this.entities.strawberries
    for (i = 0, len = ref.length; i < len; i++) {
      strawberry = ref[i]
      if (strawberry.display) {
        return false
      }
    }
    return true
  }

  respawn_strawberries() {
    var entity, i, len, ref, results
    ref = this.entities.strawberries
    results = []
    for (i = 0, len = ref.length; i < len; i++) {
      entity = ref[i]
      results.push((entity.display = true))
    }
    return results
  }

  restart() {
    this.replay = new Replay(this)
    this.ghosts.reload()
    this.moto.destroy()
    this.moto = new Moto(this)
    this.moto.init()
    this.respawn_strawberries()
    this.init_timer()
    return this.update_timer(true)
  }
}

export default Level
