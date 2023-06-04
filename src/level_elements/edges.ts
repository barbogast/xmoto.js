import * as Math2D from '../utils/math2d.js'
import Constants from '../constants.js'
import Level from '../level.js'
import Assets from '../utils/assets.js'
import Theme, { EdgeTheme } from '../utils/theme.js'
import { Block, Vertex } from './blocks.js'
import { Block2D, Pixi } from '../temporaryTypes.js'

type Point = { x: number; y: number }
type Vertices = [Point, Point, Point, Point]

export type Edge = {
  vertex1: Vertex
  vertex2: Vertex
  block: Block
  texture: string
  theme: EdgeTheme
  angle: number
  vertices: Vertices
  aabb?: Block2D
  sprite?: Pixi
}

var b2AABB
// @ts-ignore
b2AABB = Box2D.Collision.b2AABB

class Edges {
  level: Level
  block: Block
  assets: Assets
  theme: Theme

  list: Edge[] // List of edges

  constructor(level, block?) {
    this.level = level
    this.block = block
    this.assets = this.level.assets
    this.theme = this.assets.theme
    this.list = []
  }

  parse() {
    for (const [i, vertex] of this.block.vertices.entries())
      if (vertex.edge) {
        const vertex1 = vertex
        const vertex2 =
          i === this.block.vertices.length - 1
            ? this.block.vertices[0]
            : this.block.vertices[i + 1]
        const theme = this.theme.edge_params(vertex.edge)

        const vertices: Vertices = [
          {
            x: vertex1.absolute_x,
            y: vertex1.absolute_y - theme.depth,
          },
          {
            x: vertex2.absolute_x,
            y: vertex2.absolute_y - theme.depth,
          },
          {
            x: vertex2.absolute_x,
            y: vertex2.absolute_y,
          },
          {
            x: vertex1.absolute_x,
            y: vertex1.absolute_y,
          },
        ]

        const edge: Edge = {
          vertex1,
          vertex2,
          block: this.block,
          texture: vertex.edge,
          theme,
          angle: Math2D.angle_between_points(vertex1, vertex2) - Math.PI / 2,
          vertices,
          aabb: this.compute_aabb(vertices),
        }

        this.list.push(edge)
      }
  }

  load_assets() {
    for (const edge of this.list) {
      this.assets.effects.push(edge.theme.file)
    }
  }

  init() {
    this.init_sprites()
  }

  init_sprites() {
    for (const edge of this.list) {
      // Create mask
      const points = []

      for (const vertex of edge.vertices) {
        // @ts-ignore
        points.push(new PIXI.Point(vertex.x, -vertex.y))
      }

      // @ts-ignore
      const mask = new PIXI.Graphics()
      mask.beginFill(0xffffff, 1.0)
      mask.drawPolygon(points)
      this.level.camera.neutral_z_container.addChild(mask)

      const x = Math.abs(Math.sin(edge.angle) * edge.theme.depth)
      const y = Math.abs(Math.tan(edge.angle) * x)

      // @ts-ignore
      const texture = PIXI.Texture.from(this.assets.get_url(edge.theme.file))
      const size_x = edge.aabb.upperBound.x - edge.aabb.lowerBound.x + 2 * x
      const size_y = edge.theme.depth // + 2*y

      // @ts-ignore
      edge.sprite = new PIXI.TilingSprite(texture, 4 * size_x, size_y)
      edge.sprite.x = edge.vertex1.absolute_x - x
      if (edge.angle > 0) {
        edge.sprite.y = -edge.vertex1.absolute_y + y
      }
      if (edge.angle <= 0) {
        edge.sprite.y = -edge.vertex1.absolute_y - y
      }

      edge.sprite.pivot.x = 0.5
      edge.sprite.tileScale.x = 1.0 / 100.0
      edge.sprite.tileScale.y = 1.0 / 100.0
      edge.sprite.mask = mask
      edge.sprite.rotation = -edge.angle

      this.level.camera.neutral_z_container.addChild(edge.sprite)
    }
  }

  // only display edges present on the screen zone
  update() {
    if (!Constants.debug_physics) {
      const block_visible = this.block.sprite.visible

      for (const edge of this.list) {
        edge.sprite.visible = block_visible && this.visible(edge) // don't test aabb if block not visible
      }
    }
  }

  compute_aabb(vertices: Vertices) {
    let first = true
    let lower_bound: { x?: number; y?: number } = {}
    let upper_bound: { x?: number; y?: number } = {}

    for (const vertex of vertices) {
      if (first) {
        lower_bound = {
          x: vertex.x,
          y: vertex.y,
        }
        upper_bound = {
          x: vertex.x,
          y: vertex.y,
        }
        first = false
      } else {
        if (vertex.x < lower_bound.x) {
          lower_bound.x = vertex.x
        }
        if (vertex.y < lower_bound.y) {
          lower_bound.y = vertex.y
        }
        if (vertex.x > upper_bound.x) {
          upper_bound.x = vertex.x
        }
        if (vertex.y > upper_bound.y) {
          upper_bound.y = vertex.y
        }
      }
    }

    const aabb = new b2AABB()
    aabb.lowerBound.Set(lower_bound.x, lower_bound.y)
    aabb.upperBound.Set(upper_bound.x, upper_bound.y)
    return aabb
  }

  visible(edge) {
    return edge.aabb.TestOverlap(this.level.camera.aabb)
  }
}

export default Edges
