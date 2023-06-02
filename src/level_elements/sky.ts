import $ from 'jquery'

import Constants from '../constants.js'

class Sky {
  level: any
  assets: any
  theme: any
  options: any
  name: any
  color_r: number
  color_g: number
  color_b: number
  color_a: number
  zoom: number
  offset: number
  filename: any
  sprite: any

  constructor(level) {
    this.level = level
    this.assets = level.assets
    this.theme = this.assets.theme
    this.options = level.options
  }

  parse(xml) {
    var xml_sky
    xml_sky = $(xml).find('level info sky')
    this.name = xml_sky.text().toLowerCase()
    this.color_r = parseInt(xml_sky.attr('color_r'))
    this.color_g = parseInt(xml_sky.attr('color_g'))
    this.color_b = parseInt(xml_sky.attr('color_b'))
    this.color_a = parseInt(xml_sky.attr('color_a'))
    this.zoom = parseFloat(xml_sky.attr('zoom'))
    this.offset = parseFloat(xml_sky.attr('offset'))
    if (this.name === '') {
      this.name = 'sky1'
    }

    this.filename = this.theme.texture_params(this.name).file
    return this
  }

  load_assets() {
    return this.assets.textures.push(this.filename)
  }

  init() {
    return this.init_sprites()
  }

  init_sprites() {
    var texture
    // @ts-ignore
    texture = PIXI.Texture.from(this.assets.get_url(this.filename))
    // @ts-ignore
    this.sprite = new PIXI.TilingSprite(
      texture,
      this.options.width,
      this.options.height
    )
    this.sprite.position.x = 0
    this.sprite.position.y = 0
    return this.level.stage.addChildAt(this.sprite, 0)
  }

  update() {
    var ctx, position_factor_x, position_factor_y
    ctx = this.level.debug_ctx
    if (Constants.debug_physics) {
      ctx.beginPath()
      ctx.moveTo(this.options.width, this.options.height)
      ctx.lineTo(0, this.options.height)
      ctx.lineTo(0, 0)
      ctx.lineTo(this.options.width, 0)
      ctx.closePath()
      ctx.fillStyle = '#222228'
      return ctx.fill()
    } else {
      this.sprite.tileScale.x = 4
      this.sprite.tileScale.y = 4
      position_factor_x = 15
      position_factor_y = 7
      this.sprite.tilePosition.x =
        -this.level.camera.target().x * position_factor_x
      return (this.sprite.tilePosition.y =
        this.level.camera.target().y * position_factor_y)
    }
  }
}

export default Sky
