import $ from 'jquery'

class Theme {
  filename: any
  callback: any
  sprites: any[]
  edges: any[]
  textures: any[]

  constructor(filename, callback) {
    this.filename = filename
    this.callback = callback
    this.sprites = []
    this.edges = []
    this.textures = []
    $.ajax({
      type: 'GET',
      url: '/data/Themes/' + filename,
      dataType: 'xml',
      success: this.load_theme,
      context: this,
    })
  }

  load_theme(xml) {
    var i, len, xml_sprite, xml_sprites
    xml_sprites = $(xml).find('sprite')
    for (i = 0, len = xml_sprites.length; i < len; i++) {
      xml_sprite = xml_sprites[i]
      if ($(xml_sprite).attr('type') === 'Entity') {
        this.sprites[$(xml_sprite).attr('name')] = {
          file: $(xml_sprite).attr('file'),
          file_base: $(xml_sprite).attr('fileBase'),
          file_ext: $(xml_sprite).attr('fileExtension'),
          size: {
            width: parseFloat($(xml_sprite).attr('width')),
            height: parseFloat($(xml_sprite).attr('height')),
          },
          center: {
            x: parseFloat($(xml_sprite).attr('centerX')),
            y: parseFloat($(xml_sprite).attr('centerY')),
          },
          frames: $(xml_sprite).find('frame').length,
          delay: parseFloat($(xml_sprite).attr('delay')),
        }
      } else if ($(xml_sprite).attr('type') === 'EdgeEffect') {
        this.edges[$(xml_sprite).attr('name').toLowerCase()] = {
          file: $(xml_sprite).attr('file').toLowerCase(),
          scale: parseFloat($(xml_sprite).attr('scale')),
          depth: parseFloat($(xml_sprite).attr('depth')),
        }
      } else if ($(xml_sprite).attr('type') === 'Texture') {
        this.textures[$(xml_sprite).attr('name').toLowerCase()] = {
          file: $(xml_sprite).attr('file')
            ? $(xml_sprite).attr('file').toLowerCase()
            : '',
          file_base: $(xml_sprite).attr('fileBase'),
          file_ext: $(xml_sprite).attr('fileExtension'),
          frames: $(xml_sprite).find('frame').length,
          delay: parseFloat($(xml_sprite).attr('delay')),
        }
      }
    }
    return this.callback()
  }

  sprite_params(name) {
    return this.sprites[name]
  }

  edge_params(name) {
    return this.edges[name]
  }

  texture_params(name) {
    return this.textures[name]
  }
}

export default Theme
