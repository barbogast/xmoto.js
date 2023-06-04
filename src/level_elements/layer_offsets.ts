import $ from 'jquery'
import Level from '../level'
import Assets from '../utils/assets'

type LayerOffset = {
  x: number
  y: number
  front_layer: string
}

class LayerOffsets {
  level: Level
  assets: Assets
  list: LayerOffset[]

  constructor(level) {
    this.level = level
    this.assets = level.assets
    this.list = []
  }

  parse(xml) {
    const xml_layer_offsets = $(xml).find('layeroffsets layeroffset')

    for (const xml_layer_offset of xml_layer_offsets) {
      const layer_offset = {
        x: parseFloat($(xml_layer_offset).attr('x')),
        y: parseFloat($(xml_layer_offset).attr('y')),
        front_layer: $(xml_layer_offset).attr('frontlayer'),
      }

      this.list.push(layer_offset)
    }
    return this
  }

  init() {}

  display(ctx) {}
}

export default LayerOffsets
