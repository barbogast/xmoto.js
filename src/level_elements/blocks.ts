import $ from 'jquery'

import Edges from './edges.js'
import Constants from '../constants.js'
import Level from '../level.js'
import Assets from '../utils/assets.js'
import Theme from '../utils/theme.js'

export type Block = {
  id: string
  position: {
    x: number
    y: number
    dynamic: boolean
    background: boolean
  }
  usetexture: {
    id: string
    scale: number
  }
  physics: {
    grip: number
  }
  edges: {
    angle: number
    materials: []
  }
  vertices: number[]
  sprite: {
    visible: boolean
  }
}

var b2AABB

// @ts-ignore
b2AABB = Box2D.Collision.b2AABB

class Blocks {
  level: Level
  assets: Assets
  theme: Theme
  list: Block[]
  back_list: Block[]
  front_list: Block[]
  edges: Edges

  constructor(level) {
    this.level = level
    this.assets = level.assets
    this.theme = this.assets.theme
    this.list = []
    this.back_list = []
    this.front_list = []
    this.edges = new Edges(this.level)
  }

  parse(xml) {
    var block,
      i,
      j,
      k,
      len,
      len1,
      len2,
      material,
      vertex,
      xml_block,
      xml_blocks,
      xml_material,
      xml_materials,
      xml_vertex,
      xml_vertices
    xml_blocks = $(xml).find('block')
    for (i = 0, len = xml_blocks.length; i < len; i++) {
      xml_block = xml_blocks[i]
      block = {
        id: $(xml_block).attr('id'),
        position: {
          x: parseFloat($(xml_block).find('position').attr('x')),
          y: parseFloat($(xml_block).find('position').attr('y')),
          dynamic: $(xml_block).find('position').attr('dynamic') === 'true',
          background:
            $(xml_block).find('position').attr('background') === 'true',
        },
        usetexture: {
          id: $(xml_block).find('usetexture').attr('id').toLowerCase(),
          scale: parseFloat($(xml_block).find('usetexture').attr('scale')),
        },
        physics: {
          grip: parseFloat($(xml_block).find('physics').attr('grip')),
        },
        edges: {
          angle: parseFloat($(xml_block).find('edges').attr('angle')),
          materials: [],
        },
        vertices: [],
      }
      if (block.usetexture.id === 'default') {
        block.usetexture.id = 'dirt'
      }
      block.texture_name = this.theme.texture_params(block.usetexture.id).file
      xml_materials = $(xml_block).find('edges material')
      for (j = 0, len1 = xml_materials.length; j < len1; j++) {
        xml_material = xml_materials[j]
        material = {
          name: $(xml_material).attr('name'),
          edge: $(xml_material).attr('edge'),
          color_r: parseInt($(xml_material).attr('color_r')),
          color_g: parseInt($(xml_material).attr('color_g')),
          color_b: parseInt($(xml_material).attr('color_b')),
          color_a: parseInt($(xml_material).attr('color_a')),
          scale: parseFloat($(xml_material).attr('scale')),
          depth: parseFloat($(xml_material).attr('depth')),
        }
        block.edges.materials.push(material)
      }
      xml_vertices = $(xml_block).find('vertex')
      for (k = 0, len2 = xml_vertices.length; k < len2; k++) {
        xml_vertex = xml_vertices[k]
        vertex = {
          x: parseFloat($(xml_vertex).attr('x')),
          y: parseFloat($(xml_vertex).attr('y')),
          absolute_x: parseFloat($(xml_vertex).attr('x')) + block.position.x,
          absolute_y: parseFloat($(xml_vertex).attr('y')) + block.position.y,
          edge: $(xml_vertex).attr('edge')
            ? $(xml_vertex).attr('edge').toLowerCase()
            : void 0,
        }
        block.vertices.push(vertex)
      }
      block.edges_list = new Edges(this.level, block)
      block.edges_list.parse()
      block.aabb = this.compute_aabb(block)
      this.list.push(block)
      if (block.position.background) {
        this.back_list.push(block)
      } else {
        this.front_list.push(block)
      }
    }
    this.list.sort(this.sort_blocks_by_texture)
    this.back_list.sort(this.sort_blocks_by_texture)
    this.front_list.sort(this.sort_blocks_by_texture)
    return this
  }

  load_assets() {
    var block, i, len, ref, results
    ref = this.list
    results = []
    for (i = 0, len = ref.length; i < len; i++) {
      block = ref[i]
      this.assets.textures.push(block.texture_name)
      results.push(block.edges_list.load_assets())
    }
    return results
  }

  init() {
    var block, i, len, ref, results
    this.init_physics_parts()
    this.init_sprites()
    ref = this.list
    results = []
    for (i = 0, len = ref.length; i < len; i++) {
      block = ref[i]
      results.push(block.edges_list.init())
    }
    return results
  }

  init_physics_parts() {
    var block, ground, i, len, ref, results
    ground = Constants.ground
    ref = this.front_list
    results = []
    for (i = 0, len = ref.length; i < len; i++) {
      block = ref[i]
      results.push(
        this.level.physics.create_lines(
          block,
          'ground',
          ground.density,
          ground.restitution,
          ground.friction
        )
      )
    }
    return results
  }

  init_sprites() {
    var block,
      i,
      j,
      len,
      len1,
      mask,
      points,
      ref,
      ref1,
      results,
      size_x,
      size_y,
      texture,
      vertex
    ref = this.back_list.concat(this.front_list)
    results = []
    for (i = 0, len = ref.length; i < len; i++) {
      block = ref[i]
      points = []
      ref1 = block.vertices
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        vertex = ref1[j]
        // @ts-ignore
        points.push(new PIXI.Point(vertex.x, -vertex.y))
      }
      // @ts-ignore
      mask = new PIXI.Graphics()
      mask.beginFill(0xffffff, 1.0)
      mask.drawPolygon(points)
      mask.x = block.position.x
      mask.y = -block.position.y
      this.level.camera.neutral_z_container.addChild(mask)
      // @ts-ignore
      texture = PIXI.Texture.from(this.assets.get_url(block.texture_name))
      size_x = block.aabb.upperBound.x - block.aabb.lowerBound.x
      size_y = block.aabb.upperBound.y - block.aabb.lowerBound.y
      // @ts-ignore
      block.sprite = new PIXI.TilingSprite(texture, size_x, size_y)
      block.sprite.x = block.aabb.lowerBound.x
      block.sprite.y = -block.aabb.upperBound.y
      block.sprite.tileScale.x = 1.0 / 40
      block.sprite.tileScale.y = 1.0 / 40
      block.sprite.mask = mask
      results.push(this.level.camera.neutral_z_container.addChild(block.sprite))
    }
    return results
  }

  update() {
    var block, i, len, ref, results
    if (!Constants.debug_physics) {
      ref = this.list
      results = []
      for (i = 0, len = ref.length; i < len; i++) {
        block = ref[i]
        block.sprite.visible = this.visible(block)
        results.push(block.edges_list.update())
      }
      return results
    }
  }

  visible(block) {
    return block.aabb.TestOverlap(this.level.camera.aabb)
  }

  compute_aabb(block) {
    var aabb, first, i, len, lower_bound, ref, upper_bound, vertex
    first = true
    lower_bound = {}
    upper_bound = {}
    ref = block.vertices
    for (i = 0, len = ref.length; i < len; i++) {
      vertex = ref[i]
      if (first) {
        lower_bound = {
          x: vertex.absolute_x,
          y: vertex.absolute_y,
        }
        upper_bound = {
          x: vertex.absolute_x,
          y: vertex.absolute_y,
        }
        first = false
      } else {
        if (vertex.absolute_x < lower_bound.x) {
          lower_bound.x = vertex.absolute_x
        }
        if (vertex.absolute_y < lower_bound.y) {
          lower_bound.y = vertex.absolute_y
        }
        if (vertex.absolute_x > upper_bound.x) {
          upper_bound.x = vertex.absolute_x
        }
        if (vertex.absolute_y > upper_bound.y) {
          upper_bound.y = vertex.absolute_y
        }
      }
    }
    aabb = new b2AABB()
    aabb.lowerBound.Set(lower_bound.x, lower_bound.y)
    aabb.upperBound.Set(upper_bound.x, upper_bound.y)
    return aabb
  }

  sort_blocks_by_texture(a, b) {
    if (a.usetexture.id > b.usetexture.id) {
      return 1
    }
    if (a.usetexture.id <= b.usetexture.id) {
      return -1
    }
    return 0
  }
}

export default Blocks
