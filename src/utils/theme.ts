import $ from 'jquery'

export type Texture = {
  file: string
  file_base: string
  file_ext: string
  frames: number
  delay: number
}

export type Sprite = {
  file: string
  file_base: string
  file_ext: string
  size: {
    width: number
    height: number
  }
  center: {
    x: number
    y: number
  }
  frames: number
  delay: number
}

export type EdgeTheme = {
  file: string
  scale: number
  depth: number
}

class Theme {
  filename: string
  callback: () => {}
  sprites: Sprite[]
  edges: {
    [key: string]: EdgeTheme
  }
  textures: Texture[]

  constructor(filename, callback) {
    this.filename = filename
    this.callback = callback

    this.sprites = []
    this.edges = {}
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
    const xml_sprites = $(xml).find('sprite')
    for (const xml_sprite of xml_sprites) {
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

    this.callback()
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
