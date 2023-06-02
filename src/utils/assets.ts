import $ from 'jquery'

import Theme from './theme.js'

class Assets {
  theme: Theme
  textures: any[]
  anims: any[]
  effects: any[]
  moto: any[]
  sounds: any[]
  resources: {}

  constructor() {
    this.theme = new Theme('', () => {})
    this.textures = []
    this.anims = []
    this.effects = []
    this.moto = []
    this.sounds = []
    this.resources = {}
  }

  parse_theme(filename, callback) {
    Object.assign(this.theme, new Theme('modern.xml', callback))
  }

  load(callback) {
    var i,
      item,
      items,
      j,
      k,
      l,
      len,
      len1,
      len2,
      len3,
      len4,
      m,
      ref,
      ref1,
      ref2,
      ref3,
      ref4
    // @ts-ignore
    PIXI.Loader.shared.reset()
    items = []
    ref = this.textures
    for (i = 0, len = ref.length; i < len; i++) {
      item = ref[i]
      items.push({
        id: item,
        src: '/data/Textures/Textures/' + item.toLowerCase(),
      })
    }
    ref1 = this.anims
    for (j = 0, len1 = ref1.length; j < len1; j++) {
      item = ref1[j]
      items.push({
        id: item,
        src: '/data/Textures/Anims/' + item.toLowerCase(),
      })
    }
    ref2 = this.effects
    for (k = 0, len2 = ref2.length; k < len2; k++) {
      item = ref2[k]
      items.push({
        id: item,
        src: '/data/Textures/Effects/' + item.toLowerCase(),
      })
    }
    ref3 = this.moto
    for (l = 0, len3 = ref3.length; l < len3; l++) {
      item = ref3[l]
      items.push({
        id: item,
        src: '/data/Textures/Riders/' + item.toLowerCase() + '.png',
      })
    }
    ref4 = this.remove_duplicate_textures(items)
    for (m = 0, len4 = ref4.length; m < len4; m++) {
      item = ref4[m]
      // @ts-ignore
      PIXI.Loader.shared.add(item.id, item.src)
    }
    // @ts-ignore
    return PIXI.Loader.shared.load(
      (function (_this) {
        return function (loader, resources) {
          _this.resources = resources
          return callback()
        }
      })(this)
    )
  }

  get(name) {
    return this.resources[name].data
  }

  get_url(name) {
    return this.resources[name].url
  }

  remove_duplicate_textures(array) {
    var found, i, image, j, len, len1, unique, unique_image
    unique = []
    for (i = 0, len = array.length; i < len; i++) {
      image = array[i]
      found = false
      for (j = 0, len1 = unique.length; j < len1; j++) {
        unique_image = unique[j]
        if (image.id === unique_image.id) {
          found = true
        }
      }
      if (!found) {
        unique.push(image)
      }
    }
    return unique
  }
}

export default Assets
