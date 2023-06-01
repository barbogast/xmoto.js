var Theme

Theme = (function () {
  function Theme(filename, callback) {
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

  Theme.prototype.load_theme = function (xml) {
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

  Theme.prototype.sprite_params = function (name) {
    return this.sprites[name]
  }

  Theme.prototype.edge_params = function (name) {
    return this.edges[name]
  }

  Theme.prototype.texture_params = function (name) {
    return this.textures[name]
  }

  return Theme
})()

export default Theme
