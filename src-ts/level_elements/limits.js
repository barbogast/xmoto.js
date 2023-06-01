import Constants from '../constants.js'

var Limits, b2AABB, b2Vec2

b2Vec2 = Box2D.Common.Math.b2Vec2

b2AABB = Box2D.Collision.b2AABB

Limits = (function () {
  function Limits(level) {
    this.level = level
    this.assets = level.assets
    this.theme = this.assets.theme
  }

  Limits.prototype.parse = function (xml) {
    var xml_limits
    xml_limits = $(xml).find('limits')
    this.player = {
      left: parseFloat(xml_limits.attr('left')),
      right: parseFloat(xml_limits.attr('right')),
      top: parseFloat(xml_limits.attr('top')),
      bottom: parseFloat(xml_limits.attr('bottom')),
    }
    this.screen = {
      left: parseFloat(xml_limits.attr('left')) - 20,
      right: parseFloat(xml_limits.attr('right')) + 20,
      top: parseFloat(xml_limits.attr('top')) + 20,
      bottom: parseFloat(xml_limits.attr('bottom')) - 20,
    }
    this.size = {
      x: this.screen.right - this.screen.left,
      y: this.screen.top - this.screen.bottom,
    }
    this.left_wall_aabb = new b2AABB()
    this.left_wall_aabb.lowerBound.Set(this.screen.left, this.screen.bottom)
    this.left_wall_aabb.upperBound.Set(this.player.left, this.screen.top)
    this.right_wall_aabb = new b2AABB()
    this.right_wall_aabb.lowerBound.Set(this.player.right, this.screen.bottom)
    this.right_wall_aabb.upperBound.Set(this.screen.right, this.screen.top)
    this.bottom_wall_aabb = new b2AABB()
    this.bottom_wall_aabb.lowerBound.Set(this.player.left, this.screen.bottom)
    this.bottom_wall_aabb.upperBound.Set(this.player.right, this.player.bottom)
    this.top_wall_aabb = new b2AABB()
    this.top_wall_aabb.lowerBound.Set(this.player.left, this.player.top)
    this.top_wall_aabb.upperBound.Set(this.player.right, this.screen.top)
    this.texture = 'dirt'
    this.texture_name = this.theme.texture_params('dirt').file
    return this
  }

  Limits.prototype.load_assets = function () {
    return this.assets.textures.push(this.texture_name)
  }

  Limits.prototype.init = function () {
    this.init_physics_parts()
    return this.init_sprites()
  }

  Limits.prototype.init_physics_parts = function () {
    var ground, vertices
    ground = Constants.ground
    vertices = []
    vertices.push({
      x: this.screen.left,
      y: this.screen.top,
    })
    vertices.push({
      x: this.screen.left,
      y: this.screen.bottom,
    })
    vertices.push({
      x: this.player.left,
      y: this.screen.bottom,
    })
    vertices.push({
      x: this.player.left,
      y: this.screen.top,
    })
    this.level.physics.create_polygon(
      vertices,
      'ground',
      ground.density,
      ground.restitution,
      ground.friction
    )
    vertices = []
    vertices.push({
      x: this.player.right,
      y: this.screen.top,
    })
    vertices.push({
      x: this.player.right,
      y: this.screen.bottom,
    })
    vertices.push({
      x: this.screen.right,
      y: this.screen.bottom,
    })
    vertices.push({
      x: this.screen.right,
      y: this.screen.top,
    })
    this.level.physics.create_polygon(
      vertices,
      'ground',
      ground.density,
      ground.restitution,
      ground.friction
    )
    vertices = []
    vertices.push({
      x: this.player.right,
      y: this.player.bottom,
    })
    vertices.push({
      x: this.player.left,
      y: this.player.bottom,
    })
    vertices.push({
      x: this.player.left,
      y: this.screen.bottom,
    })
    vertices.push({
      x: this.player.right,
      y: this.screen.bottom,
    })
    this.level.physics.create_polygon(
      vertices,
      'ground',
      ground.density,
      ground.restitution,
      ground.friction
    )
    vertices = []
    vertices.push({
      x: this.player.right,
      y: this.screen.top,
    })
    vertices.push({
      x: this.player.left,
      y: this.screen.top,
    })
    vertices.push({
      x: this.player.left,
      y: this.player.top,
    })
    vertices.push({
      x: this.player.right,
      y: this.player.top,
    })
    return this.level.physics.create_polygon(
      vertices,
      'ground',
      ground.density,
      ground.restitution,
      ground.friction
    )
  }

  Limits.prototype.init_sprites = function () {
    var bottom_size_x,
      bottom_size_y,
      left_size_x,
      left_size_y,
      right_size_x,
      right_size_y,
      texture,
      top_size_x,
      top_size_y
    texture = PIXI.Texture.from(this.assets.get_url(this.texture_name))
    left_size_x = this.player.left - this.screen.left
    left_size_y = this.screen.top - this.screen.bottom
    right_size_x = this.screen.right - this.player.right
    right_size_y = this.screen.top - this.screen.bottom
    bottom_size_x = this.player.right - this.player.left
    bottom_size_y = this.player.bottom - this.screen.bottom
    top_size_x = this.player.right - this.player.left
    top_size_y = this.screen.top - this.player.top
    this.left_sprite = new PIXI.TilingSprite(texture, left_size_x, left_size_y)
    this.right_sprite = new PIXI.TilingSprite(
      texture,
      right_size_x,
      right_size_y
    )
    this.bottom_sprite = new PIXI.TilingSprite(
      texture,
      bottom_size_x,
      bottom_size_y
    )
    this.top_sprite = new PIXI.TilingSprite(texture, top_size_x, top_size_y)
    this.left_sprite.x = this.screen.left
    this.left_sprite.y = -this.screen.top
    this.left_sprite.anchor.x = 0
    this.left_sprite.anchor.y = 0
    this.left_sprite.tileScale.x = 1.0 / 40
    this.left_sprite.tileScale.y = 1.0 / 40
    this.right_sprite.x = this.player.right
    this.right_sprite.y = -this.screen.top
    this.right_sprite.anchor.x = 0
    this.right_sprite.anchor.y = 0
    this.right_sprite.tileScale.x = 1.0 / 40
    this.right_sprite.tileScale.y = 1.0 / 40
    this.bottom_sprite.x = this.player.left
    this.bottom_sprite.y = -this.player.bottom
    this.bottom_sprite.anchor.x = 0
    this.bottom_sprite.anchor.y = 0
    this.bottom_sprite.tileScale.x = 1.0 / 40
    this.bottom_sprite.tileScale.y = 1.0 / 40
    this.top_sprite.x = this.player.left
    this.top_sprite.y = -this.screen.top
    this.top_sprite.anchor.x = 0
    this.top_sprite.anchor.y = 0
    this.top_sprite.tileScale.x = 1.0 / 40
    this.top_sprite.tileScale.y = 1.0 / 40
    this.level.camera.neutral_z_container.addChild(this.left_sprite)
    this.level.camera.neutral_z_container.addChild(this.right_sprite)
    this.level.camera.neutral_z_container.addChild(this.bottom_sprite)
    return this.level.camera.neutral_z_container.addChild(this.top_sprite)
  }

  Limits.prototype.update = function () {
    if (!Constants.debug_physics) {
      this.left_sprite.visible = this.visible(this.left_wall_aabb)
      this.right_sprite.visible = this.visible(this.right_wall_aabb)
      this.top_sprite.visible = this.visible(this.top_wall_aabb)
      return (this.bottom_sprite.visible = this.visible(this.bottom_wall_aabb))
    }
  }

  Limits.prototype.visible = function (wall_aabb) {
    return wall_aabb.TestOverlap(this.level.camera.aabb)
  }

  return Limits
})()

export default Limits
