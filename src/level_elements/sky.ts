import $ from 'jquery'

import Constants from '../constants.js'
import Level from '../level.js'
import Assets from '../utils/assets.js'
import Theme from '../utils/theme.js'
import { Pixi } from '../temporaryTypes.js'

class Sky {
  level: Level
  assets: Assets
  theme: Theme
  options: any
  name: string
  color_r: number
  color_g: number
  color_b: number
  color_a: number
  zoom: number
  offset: number
  filename: string
  sprite: Pixi

  constructor(level: Level) {
    this.level = level
    this.assets = level.assets
    this.theme = this.assets.theme
    this.options = level.options
  }

  parse(xml: string) {
    const xml_sky = $(xml).find('level info sky')
    this.name = xml_sky.text().toLowerCase()
    this.color_r = parseInt(xml_sky.attr('color_r')!)
    this.color_g = parseInt(xml_sky.attr('color_g')!)
    this.color_b = parseInt(xml_sky.attr('color_b')!)
    this.color_a = parseInt(xml_sky.attr('color_a')!)
    this.zoom = parseFloat(xml_sky.attr('zoom')!)
    this.offset = parseFloat(xml_sky.attr('offset')!)

    if (this.name === '') {
      this.name = 'sky1'
    }
    this.filename = this.theme.texture_params(this.name).file

    return this
  }

  load_assets() {
    this.assets.textures.push(this.filename)
  }

  init() {
    this.init_sprites()
  }

  init_sprites() {
    // @ts-ignore
    const texture = PIXI.Texture.from(this.assets.get_url(this.filename))
    // @ts-ignore
    this.sprite = new PIXI.TilingSprite(
      texture,
      this.options.width,
      this.options.height
    )
    this.sprite.position.x = 0
    this.sprite.position.y = 0
    this.level.stage.addChildAt(this.sprite, 0)
  }

  update() {
    const ctx = this.level.debug_ctx

    if (Constants.debug_physics) {
      ctx.beginPath()
      ctx.moveTo(this.options.width, this.options.height)
      ctx.lineTo(0, this.options.height)
      ctx.lineTo(0, 0)
      ctx.lineTo(this.options.width, 0)
      ctx.closePath()

      ctx.fillStyle = '#222228'
      ctx.fill()
    } else {
      this.sprite.tileScale.x = 4
      this.sprite.tileScale.y = 4

      const position_factor_x = 15
      const position_factor_y = 7

      this.sprite.tilePosition.x =
        -this.level.camera.target().x * position_factor_x
      this.sprite.tilePosition.y =
        this.level.camera.target().y * position_factor_y
    }
  }
}

export default Sky
