import $ from 'jquery'

import Edges from './edges.js'
import Constants from '../constants.js'
import Level from '../level.js'
import Assets from '../utils/assets.js'
import Theme from '../utils/theme.js'
import { Block2D, Pixi } from '../temporaryTypes.js'

export type Material = {
  name: string
  edge: string
  color_r: number
  color_g: number
  color_b: number
  color_a: number
  scale: number
  depth: number
}

export type Vertex = {
  x: number
  y: number
  absolute_x: number
  absolute_y: number
  edge: string | undefined
}

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
    materials: Material[]
  }
  vertices: Vertex[]
  sprite?: Pixi
  texture_name: string
  edges_list?: Edges
  aabb?: Block2D
}

// @ts-ignore
const b2AABB = Box2D.Collision.b2AABB

class Blocks {
  level: Level
  assets: Assets
  theme: Theme
  list: Block[]
  back_list: Block[]
  front_list: Block[]
  edges: Edges

  constructor(level: Level) {
    this.level = level
    this.assets = level.assets
    this.theme = this.assets.theme
    this.list = []
    this.back_list = []
    this.front_list = []
  }

  parse(xml: string) {
    const xml_blocks = $(xml).find('block')

    for (const xml_block of xml_blocks) {
      const usetexture_id = $(xml_block)
        .find('usetexture')
        .attr('id')!
        .toLowerCase()

      const block: Block = {
        id: $(xml_block).attr('id')!,
        position: {
          x: parseFloat($(xml_block).find('position').attr('x')!),
          y: parseFloat($(xml_block).find('position').attr('y')!),
          dynamic: $(xml_block).find('position').attr('dynamic') === 'true',
          background:
            $(xml_block).find('position').attr('background') === 'true',
        },
        usetexture: {
          id: usetexture_id === 'default' ? 'dirt' : usetexture_id,
          scale: parseFloat($(xml_block).find('usetexture').attr('scale')!),
        },
        physics: {
          grip: parseFloat($(xml_block).find('physics').attr('grip')!),
        },
        edges: {
          angle: parseFloat($(xml_block).find('edges').attr('angle')!),
          materials: [],
        },
        vertices: [],
        texture_name: this.theme.texture_params(usetexture_id).file,
      }

      const xml_materials = $(xml_block).find('edges material')
      for (const xml_material of xml_materials) {
        const material = {
          name: $(xml_material).attr('name'),
          edge: $(xml_material).attr('edge'),
          color_r: parseInt($(xml_material).attr('color_r')!),
          color_g: parseInt($(xml_material).attr('color_g')!),
          color_b: parseInt($(xml_material).attr('color_b')!),
          color_a: parseInt($(xml_material).attr('color_a')!),
          scale: parseFloat($(xml_material).attr('scale')!),
          depth: parseFloat($(xml_material).attr('depth')!),
        }

        block.edges.materials.push(material)
      }

      const xml_vertices = $(xml_block).find('vertex')
      for (const xml_vertex of xml_vertices) {
        const vertex = {
          x: parseFloat($(xml_vertex).attr('x')!),
          y: parseFloat($(xml_vertex).attr('y')!),
          absolute_x: parseFloat($(xml_vertex).attr('x')!) + block.position.x, // absolutes positions are here to
          absolute_y: parseFloat($(xml_vertex).attr('y')!) + block.position.y, // accelerate drawing of each frame
          edge: $(xml_vertex).attr('edge')
            ? $(xml_vertex).attr('edge')!.toLowerCase()
            : undefined,
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
    for (const block of this.list) {
      this.assets.textures.push(block.texture_name)
      block.edges_list.load_assets()
    }
  }

  init() {
    this.init_physics_parts()
    this.init_sprites()

    for (const block of this.list) {
      block.edges_list.init()
    }
  }

  init_physics_parts() {
    const ground = Constants.ground
    for (const block of this.front_list) {
      this.level.physics.create_lines(
        block,
        'ground',
        ground.density,
        ground.restitution,
        ground.friction
      )
    }
  }

  init_sprites() {
    // draw back blocks before front blocks
    for (const block of this.back_list.concat(this.front_list)) {
      // Create mask
      const points = []

      for (const vertex of block.vertices) {
        // @ts-ignore
        points.push(new PIXI.Point(vertex.x, -vertex.y))
      }

      // @ts-ignore
      const mask = new PIXI.Graphics()
      mask.beginFill(0xffffff, 1.0)
      mask.drawPolygon(points)
      mask.x = block.position.x
      mask.y = -block.position.y

      this.level.camera.neutral_z_container.addChild(mask)

      // Create tilingSprite
      // @ts-ignore
      const texture = PIXI.Texture.from(this.assets.get_url(block.texture_name))
      const size_x = block.aabb.upperBound.x - block.aabb.lowerBound.x
      const size_y = block.aabb.upperBound.y - block.aabb.lowerBound.y

      // @ts-ignore
      block.sprite = new PIXI.TilingSprite(texture, size_x, size_y)
      block.sprite.x = block.aabb.lowerBound.x
      block.sprite.y = -block.aabb.upperBound.y
      block.sprite.tileScale.x = 1.0 / 40
      block.sprite.tileScale.y = 1.0 / 40
      block.sprite.mask = mask

      this.level.camera.neutral_z_container.addChild(block.sprite)
    }
  }

  update() {
    if (!Constants.debug_physics) {
      for (const block of this.list) {
        block.sprite.visible = this.visible(block)
        block.edges_list.update()
      }
    }
  }

  visible(block: Block) {
    return block.aabb.TestOverlap(this.level.camera.aabb)
  }

  compute_aabb(block: Block) {
    let first = true
    let lower_bound: { x?: number; y?: number } = {}
    let upper_bound: { x?: number; y?: number } = {}

    for (const vertex of block.vertices) {
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

    const aabb = new b2AABB()
    aabb.lowerBound.Set(lower_bound.x, lower_bound.y)
    aabb.upperBound.Set(upper_bound.x, upper_bound.y)
    return aabb
  }

  sort_blocks_by_texture(a: Block, b: Block) {
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
