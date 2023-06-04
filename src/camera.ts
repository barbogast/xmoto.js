import $ from 'jquery'

import Constants from './constants.js'
import * as Math2D from './utils/math2d.js'
import Level from './level.js'
import { Block2D, Pixi } from './temporaryTypes.js'

var b2Vec2, b2AABB
// @ts-ignore
b2Vec2 = Box2D.Common.Math.b2Vec2
// @ts-ignore
b2AABB = Box2D.Collision.b2AABB

class Camera {
  level: Level
  options: any
  scale: { x: any; y: any }
  translate: { x: number; y: number }
  scale_container: Pixi
  translate_container: Pixi
  negative_z_container: Pixi
  neutral_z_container: Pixi
  positive_z_container: Pixi
  clipping: Pixi
  aabb: Block2D

  constructor(level) {
    this.level = level
    this.options = level.options

    // level unities * scale = pixels
    this.scale = {
      x: Constants.default_scale.x,
      y: Constants.default_scale.y,
    }

    // x and y translate on the target view
    this.translate = {
      x: 0,
      y: 0,
    }

    // @ts-ignore
    this.scale_container = new PIXI.Container()
    // @ts-ignore
    this.translate_container = new PIXI.Container()
    // @ts-ignore
    this.negative_z_container = new PIXI.Container()
    // @ts-ignore
    this.neutral_z_container = new PIXI.Container()
    // @ts-ignore
    this.positive_z_container = new PIXI.Container()

    this.level.stage.addChild(this.scale_container)
    this.scale_container.addChild(this.translate_container)
    this.translate_container.addChild(this.negative_z_container)
    this.translate_container.addChild(this.neutral_z_container)
    this.translate_container.addChild(this.positive_z_container)
  }

  init() {
    if (Constants.manual_scale) {
      this.init_scroll()
    }

    if (Constants.debug_physics) {
      $('#xmoto canvas').hide()
      $('#xmoto-debug').show()
    }

    if (Constants.debug_clipping) {
      // @ts-ignore
      this.clipping = new PIXI.Graphics()
      this.clipping.alpha = 0.2
      this.translate_container.addChild(this.clipping)
    }

    this.compute_aabb()
  }

  active_object() {
    if (this.level.options.playable) {
      return this.level.moto.body
    } else {
      return this.level.ghosts.player.moto.body
    }
  }

  move() {
    if (Constants.automatic_scale) {
      const velocity = this.active_object().GetLinearVelocity()

      const speed = Math2D.distance_between_points(new b2Vec2(0, 0), velocity)
      this.scale.x =
        this.scale.x * 0.995 +
        (Constants.default_scale.x / (1.0 + speed / 7.5)) * 0.005
      this.scale.y =
        this.scale.y * 0.995 +
        (Constants.default_scale.y / (1.0 + speed / 7.5)) * 0.005

      this.translate.x = this.translate.x * 0.97 + (velocity.x / 3.0) * 0.03
      this.translate.y = this.translate.y * 0.99 + (velocity.y / 3.0) * 0.01

      this.compute_aabb()
    }
  }

  update() {
    if (Constants.debug_physics) {
      const ctx = this.level.physics.debug_ctx

      ctx.save()

      ctx.translate(this.options.width / 2, this.options.height / 2)
      ctx.scale(this.scale.x, this.scale.y)
      ctx.translate(-this.target().x, -this.target().y)

      this.level.physics.world.DrawDebugData()

      return ctx.restore()
    } else {
      this.scale_container.x = this.options.width / 2
      this.scale_container.y = this.options.height / 2

      this.scale_container.scale.x = this.scale.x
      this.scale_container.scale.y = -this.scale.y

      this.translate_container.x = -this.target().x
      this.translate_container.y = this.target().y

      // Opaque clipping to see where sprites are "filtered out"
      if (Constants.debug_clipping) {
        this.clipping.clear()
        this.clipping.beginFill(0x333333)

        const size_x = (this.options.width / 100.0) * (60.0 / this.scale.x)
        const size_y = (this.options.height / 100.0) * (-60.0 / this.scale.y)

        this.clipping.drawRect(-size_x / 2, -size_y / 2, size_x, size_y)
        this.clipping.x = this.target().x
        this.clipping.y = -this.target().y
      }
    }
  }

  target() {
    const position = this.active_object().GetPosition()
    const adjusted_position = {
      x: position.x + this.translate.x,
      y: position.y + this.translate.y + 0.25,
    }
    return adjusted_position
  }

  // If there are some issues on other systems than MacOS,
  // check this to find a solution : http://stackoverflow.com/questions/5527601/normalizing-mousewheel-speed-across-browsers
  init_scroll() {
    const scroll = (event) => {
      let delta
      if (event.wheelDelta) {
        delta = event.wheelDelta / 40
      } else if (event.detail) {
        delta = -event.detail
      } else {
        delta = 0
      }

      // zoom / dezoom
      this.scale.x += (this.scale.x / 200) * delta
      this.scale.y += (this.scale.y / 200) * delta

      // boundaries
      const min_limit_x = Constants.default_scale.x / 2
      const min_limit_y = Constants.default_scale.y / 2

      const max_limit_x = Constants.default_scale.x * 2
      const max_limit_y = Constants.default_scale.y * 2

      if (this.scale.x < min_limit_x) {
        this.scale.x = min_limit_x
      }
      if (this.scale.y > min_limit_y) {
        this.scale.y = min_limit_y
      }

      if (this.scale.x > max_limit_x) {
        this.scale.x = max_limit_x
      }
      if (this.scale.y < max_limit_y) {
        this.scale.y = max_limit_y
      }
      return event.preventDefault() && false
    }

    const canvas = $(this.level.options.canvas).get(0)
    canvas.addEventListener('DOMMouseScroll', scroll, false)
    canvas.addEventListener('mousewheel', scroll, false)
  }

  compute_aabb() {
    if (Constants.debug_clipping) {
      this.aabb = this.aabb_for_clipping()
    } else {
      this.aabb = this.aabb_for_canvas()
    }
  }

  aabb_for_clipping() {
    const size_x = (this.options.width * 0.6) / this.scale.x
    const size_y = (-this.options.height * 0.6) / this.scale.y

    const aabb = new b2AABB()
    aabb.lowerBound.Set(
      this.target().x - size_x / 2,
      this.target().y - size_y / 2
    )
    aabb.upperBound.Set(
      this.target().x + size_x / 2,
      this.target().y + size_y / 2
    )
    return aabb
  }

  aabb_for_canvas() {
    const size_x = (this.options.width * 1.0) / this.scale.x
    const size_y = (-this.options.height * 1.0) / this.scale.y
    const aabb = new b2AABB()
    aabb.lowerBound.Set(
      this.target().x - size_x / 2,
      this.target().y - size_y / 2
    )
    aabb.upperBound.Set(
      this.target().x + size_x / 2,
      this.target().y + size_y / 2
    )
    return aabb
  }
}

export default Camera
