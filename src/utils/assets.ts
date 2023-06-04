import Theme from './theme.js'

type Item = { id: string; src: string }

class Assets {
  theme: Theme
  textures: string[]
  anims: string[]
  effects: string[]
  moto: string[]
  sounds: string[]
  resources: {}

  constructor() {
    this.theme = new Theme('', () => {})

    this.textures = [] // texture list
    this.anims = [] // anim list
    this.effects = [] // effect list (edge etc.)
    this.moto = [] //  moto list
    this.sounds = [] //  Sounds

    this.resources = {}
  }

  parse_theme(filename, callback) {
    // extend to keep the same pointer to @theme that is already in other objects
    Object.assign(this.theme, new Theme('modern.xml', callback))
  }

  load(callback) {
    // @ts-ignore
    PIXI.Loader.shared.reset()

    const items: Item[] = []
    for (const item of this.textures) {
      items.push({
        id: item,
        src: '/data/Textures/Textures/' + item.toLowerCase(),
      })
    }
    for (const item of this.anims) {
      items.push({
        id: item,
        src: '/data/Textures/Anims/' + item.toLowerCase(),
      })
    }
    for (const item of this.effects) {
      items.push({
        id: item,
        src: '/data/Textures/Effects/' + item.toLowerCase(),
      })
    }
    for (const item of this.moto) {
      items.push({
        id: item,
        src: '/data/Textures/Riders/' + item.toLowerCase() + '.png',
      })
    }

    for (const item of this.remove_duplicate_textures(items)) {
      // @ts-ignore
      PIXI.Loader.shared.add(item.id, item.src)
    }

    // @ts-ignore
    PIXI.Loader.shared.load((loader, resources) => {
      this.resources = resources
      callback()
    })
  }

  // Get an asset by its name ("id")
  get(name) {
    return this.resources[name].data
  }

  get_url(name) {
    return this.resources[name].url
  }

  remove_duplicate_textures(array: Item[]) {
    const unique = []
    for (const image of array) {
      let found = false
      for (const unique_image of unique) {
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
