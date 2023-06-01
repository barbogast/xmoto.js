var Camera

Camera = (function () {
  function Camera(level) {
    this.level = level
    this.options = level.options
    this.scale = {
      x: Constants.default_scale.x,
      y: Constants.default_scale.y,
    }
    this.translate = {
      x: 0,
      y: 0,
    }
    this.scale_container = new PIXI.Container()
    this.translate_container = new PIXI.Container()
    this.negative_z_container = new PIXI.Container()
    this.neutral_z_container = new PIXI.Container()
    this.positive_z_container = new PIXI.Container()
    this.level.stage.addChild(this.scale_container)
    this.scale_container.addChild(this.translate_container)
    this.translate_container.addChild(this.negative_z_container)
    this.translate_container.addChild(this.neutral_z_container)
    this.translate_container.addChild(this.positive_z_container)
  }

  Camera.prototype.init = function () {
    if (Constants.manual_scale) {
      this.init_scroll()
    }
    if (Constants.debug_physics) {
      $('#xmoto canvas').hide()
      $('#xmoto-debug').show()
    }
    if (Constants.debug_clipping) {
      this.clipping = new PIXI.Graphics()
      this.clipping.alpha = 0.2
      this.translate_container.addChild(this.clipping)
    }
    return this.compute_aabb()
  }

  Camera.prototype.active_object = function () {
    if (this.level.options.playable) {
      return this.level.moto.body
    } else {
      return this.level.ghosts.player.moto.body
    }
  }

  Camera.prototype.move = function () {
    var speed, velocity
    if (Constants.automatic_scale) {
      velocity = this.active_object().GetLinearVelocity()
      speed = Math2D.distance_between_points(new b2Vec2(0, 0), velocity)
      this.scale.x =
        this.scale.x * 0.995 +
        (Constants.default_scale.x / (1.0 + speed / 7.5)) * 0.005
      this.scale.y =
        this.scale.y * 0.995 +
        (Constants.default_scale.y / (1.0 + speed / 7.5)) * 0.005
      this.translate.x = this.translate.x * 0.97 + (velocity.x / 3.0) * 0.03
      this.translate.y = this.translate.y * 0.99 + (velocity.y / 3.0) * 0.01
      return this.compute_aabb()
    }
  }

  Camera.prototype.update = function () {
    var ctx, size_x, size_y
    if (Constants.debug_physics) {
      ctx = this.level.physics.debug_ctx
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
      if (Constants.debug_clipping) {
        this.clipping.clear()
        this.clipping.beginFill(0x333333)
        size_x = (this.options.width / 100.0) * (60.0 / this.scale.x)
        size_y = (this.options.height / 100.0) * (-60.0 / this.scale.y)
        this.clipping.drawRect(-size_x / 2, -size_y / 2, size_x, size_y)
        this.clipping.x = this.target().x
        return (this.clipping.y = -this.target().y)
      }
    }
  }

  Camera.prototype.target = function () {
    var adjusted_position, options, position
    options = this.level.options
    position = this.active_object().GetPosition()
    return (adjusted_position = {
      x: position.x + this.translate.x,
      y: position.y + this.translate.y + 0.25,
    })
  }

  Camera.prototype.init_scroll = function () {
    var canvas, scroll
    scroll = (function (_this) {
      return function (event) {
        var delta, max_limit_x, max_limit_y, min_limit_x, min_limit_y
        if (event.wheelDelta) {
          delta = event.wheelDelta / 40
        } else if (event.detail) {
          delta = -event.detail
        } else {
          delta = 0
        }
        _this.scale.x += (_this.scale.x / 200) * delta
        _this.scale.y += (_this.scale.y / 200) * delta
        min_limit_x = Constants.default_scale.x / 2
        min_limit_y = Constants.default_scale.y / 2
        max_limit_x = Constants.default_scale.x * 2
        max_limit_y = Constants.default_scale.y * 2
        if (_this.scale.x < min_limit_x) {
          _this.scale.x = min_limit_x
        }
        if (_this.scale.y > min_limit_y) {
          _this.scale.y = min_limit_y
        }
        if (_this.scale.x > max_limit_x) {
          _this.scale.x = max_limit_x
        }
        if (_this.scale.y < max_limit_y) {
          _this.scale.y = max_limit_y
        }
        return event.preventDefault() && false
      }
    })(this)
    canvas = $(this.level.options.canvas).get(0)
    canvas.addEventListener('DOMMouseScroll', scroll, false)
    return canvas.addEventListener('mousewheel', scroll, false)
  }

  Camera.prototype.compute_aabb = function () {
    if (Constants.debug_clipping) {
      return (this.aabb = this.aabb_for_clipping())
    } else {
      return (this.aabb = this.aabb_for_canvas())
    }
  }

  Camera.prototype.aabb_for_clipping = function () {
    var aabb, size_x, size_y
    size_x = (this.options.width * 0.6) / this.scale.x
    size_y = (-this.options.height * 0.6) / this.scale.y
    aabb = new b2AABB()
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

  Camera.prototype.aabb_for_canvas = function () {
    var aabb, size_x, size_y
    size_x = (this.options.width * 1.0) / this.scale.x
    size_y = (-this.options.height * 1.0) / this.scale.y
    aabb = new b2AABB()
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

  return Camera
})()
