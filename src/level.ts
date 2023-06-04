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

    // Context
    this.debug_ctx = ($('#xmoto-debug').get(0) as HTMLCanvasElement).getContext(
      '2d'
    )
    // @ts-ignore
    this.stage = new PIXI.Container()

    // Level independant objects
    this.assets = new Assets()
    this.camera = new Camera(this)
    this.physics = new Physics(this)
    this.input = new Input(this)
    this.listeners = new Listeners(this)
    this.moto = new Moto(this)
    this.particles = new Particles(this)

    // Level dependent objects
    this.infos = new Infos(this)
    this.sky = new Sky(this)
    this.blocks = new Blocks(this)
    this.limits = new Limits(this)
    this.layer_offsets = new LayerOffsets(this)
    this.script = new Script(this)
    this.entities = new Entities(this)

    // Replay: actual run of the player (not saved yet)
    this.replay = new Replay(this)

    // Ghosts: previous saved run of various players (included himself)
    this.ghosts = new Ghosts(this)
  }

  load_from_file(filename, callback) {
    this.assets.parse_theme('modern.xml', () =>
      $.ajax({
        type: 'GET',
        url: this.options.levels_path + '/' + filename,
        dataType: 'xml',
        success: (xml) => this.load_level(xml, callback),
        context: this,
      })
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

    this.assets.load(callback)
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

    this.init_timer()
  }

  update() {
    this.physics.update()

    const dead_player = this.options.playable && !this.moto.dead
    const dead_replay = !this.options.playable && !this.ghosts.player.moto.dead

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
    this.particles.update()
  }

  init_timer() {
    this.start_time = new Date().getTime()
    this.current_time = 0
  }

  update_timer(update_now = false) {
    const new_time = new Date().getTime() - this.start_time
    if (
      update_now ||
      Math.floor(new_time / 10) > Math.floor(this.current_time / 10)
    ) {
      const minutes = Math.floor(new_time / 1000 / 60)
      const seconds = (Math.floor(new_time / 1000) % 60)
        .toString()
        .padStart(2, '0')
      const cents = (Math.floor(new_time / 10) % 100)
        .toString()
        .padStart(2, '0')

      $(this.options.chrono).text(minutes + ':' + seconds + ':' + cents)
    }
    this.current_time = new_time
  }

  got_strawberries() {
    for (const strawberry of this.entities.strawberries) {
      if (strawberry.display) {
        return false
      }
    }
    return true
  }

  respawn_strawberries() {
    for (const entity of this.entities.strawberries) {
      entity.display = true
    }
  }

  restart() {
    this.replay = new Replay(this)

    this.ghosts.reload()
    this.moto.destroy()
    this.moto = new Moto(this)
    this.moto.init()

    this.respawn_strawberries()

    this.init_timer()
    this.update_timer(true)
  }
}

export default Level
