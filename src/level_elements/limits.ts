import $ from 'jquery'

import Constants from '../constants.js'
import Level from '../level.js'
import Assets from '../utils/assets.js'
import Theme from '../utils/theme.js'
import { Pixi, Block2D } from '../temporaryTypes.js'

// @ts-ignore
const b2AABB = Box2D.Collision.b2AABB

class Limits {
  level: Level
  assets: Assets
  theme: Theme
  player: { left: number; right: number; top: number; bottom: number }
  screen: { left: number; right: number; top: number; bottom: number }
  size: { x: number; y: number }
  left_wall_aabb: Block2D
  right_wall_aabb: Block2D
  bottom_wall_aabb: Block2D
  top_wall_aabb: Block2D
  texture: string
  texture_name: string
  left_sprite: Pixi
  right_sprite: Pixi
  bottom_sprite: Pixi
  top_sprite: Pixi

  constructor(level) {
    this.level = level
    this.assets = level.assets
    this.theme = this.assets.theme
  }

  parse(xml) {
    const xml_limits = $(xml).find('limits')

    // CAREFUL ! The limits on files are not real, some polygons could
    // be in the limits (maybe it's the limits where the player can go)

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

    // Left AABB
    this.left_wall_aabb = new b2AABB()
    this.left_wall_aabb.lowerBound.Set(this.screen.left, this.screen.bottom)
    this.left_wall_aabb.upperBound.Set(this.player.left, this.screen.top)

    // Right  AABB
    this.right_wall_aabb = new b2AABB()
    this.right_wall_aabb.lowerBound.Set(this.player.right, this.screen.bottom)
    this.right_wall_aabb.upperBound.Set(this.screen.right, this.screen.top)

    // Bottom  AABB
    this.bottom_wall_aabb = new b2AABB()
    this.bottom_wall_aabb.lowerBound.Set(this.player.left, this.screen.bottom)
    this.bottom_wall_aabb.upperBound.Set(this.player.right, this.player.bottom)

    // Top  AABB
    this.top_wall_aabb = new b2AABB()
    this.top_wall_aabb.lowerBound.Set(this.player.left, this.player.top)
    this.top_wall_aabb.upperBound.Set(this.player.right, this.screen.top)

    this.texture = 'dirt'
    this.texture_name = this.theme.texture_params('dirt').file

    return this
  }

  load_assets() {
    this.assets.textures.push(this.texture_name)
  }

  init() {
    this.init_physics_parts()
    this.init_sprites()
  }

  init_physics_parts() {
    const ground = Constants.ground

    let vertices

    // Left
    vertices = []
    vertices.push({ x: this.screen.left, y: this.screen.top })
    vertices.push({ x: this.screen.left, y: this.screen.bottom })
    vertices.push({ x: this.player.left, y: this.screen.bottom })
    vertices.push({ x: this.player.left, y: this.screen.top })
    this.level.physics.create_polygon(
      vertices,
      'ground',
      ground.density,
      ground.restitution,
      ground.friction
    )

    // Right
    vertices = []
    vertices.push({ x: this.player.right, y: this.screen.top })
    vertices.push({ x: this.player.right, y: this.screen.bottom })
    vertices.push({ x: this.screen.right, y: this.screen.bottom })
    vertices.push({ x: this.screen.right, y: this.screen.top })
    this.level.physics.create_polygon(
      vertices,
      'ground',
      ground.density,
      ground.restitution,
      ground.friction
    )

    // Bottom
    vertices = []
    vertices.push({ x: this.player.right, y: this.player.bottom })
    vertices.push({ x: this.player.left, y: this.player.bottom })
    vertices.push({ x: this.player.left, y: this.screen.bottom })
    vertices.push({ x: this.player.right, y: this.screen.bottom })
    this.level.physics.create_polygon(
      vertices,
      'ground',
      ground.density,
      ground.restitution,
      ground.friction
    )

    // Bottom
    vertices = []
    vertices.push({ x: this.player.right, y: this.screen.top })
    vertices.push({ x: this.player.left, y: this.screen.top })
    vertices.push({ x: this.player.left, y: this.player.top })
    vertices.push({ x: this.player.right, y: this.player.top })
    this.level.physics.create_polygon(
      vertices,
      'ground',
      ground.density,
      ground.restitution,
      ground.friction
    )
  }

  init_sprites() {
    // @ts-ignore
    const texture = PIXI.Texture.from(this.assets.get_url(this.texture_name))

    const left_size_x = this.player.left - this.screen.left
    const left_size_y = this.screen.top - this.screen.bottom

    const right_size_x = this.screen.right - this.player.right
    const right_size_y = this.screen.top - this.screen.bottom

    const bottom_size_x = this.player.right - this.player.left
    const bottom_size_y = this.player.bottom - this.screen.bottom

    const top_size_x = this.player.right - this.player.left
    const top_size_y = this.screen.top - this.player.top

    // @ts-ignore
    this.left_sprite = new PIXI.TilingSprite(texture, left_size_x, left_size_y)
    // @ts-ignore
    this.right_sprite = new PIXI.TilingSprite(
      texture,
      right_size_x,
      right_size_y
    )
    // @ts-ignore
    this.bottom_sprite = new PIXI.TilingSprite(
      texture,
      bottom_size_x,
      bottom_size_y
    )
    // @ts-ignore
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
    this.level.camera.neutral_z_container.addChild(this.top_sprite)
  }

  update() {
    if (!Constants.debug_physics) {
      this.left_sprite.visible = this.visible(this.left_wall_aabb)
      this.right_sprite.visible = this.visible(this.right_wall_aabb)
      this.top_sprite.visible = this.visible(this.top_wall_aabb)
      this.bottom_sprite.visible = this.visible(this.bottom_wall_aabb)
    }
  }

  visible(wall_aabb) {
    return wall_aabb.TestOverlap(this.level.camera.aabb)
  }
}

export default Limits
