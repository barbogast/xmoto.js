import Math2D from '../utils/math2d.js'
import Constants from '../constants.js'

var Edges, b2AABB, b2Vec2
// @ts-ignore
b2Vec2 = Box2D.Common.Math.b2Vec2
// @ts-ignore
b2AABB = Box2D.Collision.b2AABB

Edges = (function () {
  function Edges(level, block) {
    this.level = level
    this.block = block
    this.assets = this.level.assets
    this.theme = this.assets.theme
    this.list = []
  }

  Edges.prototype.parse = function () {
    var edge, i, j, len, ref, results, vertex
    ref = this.block.vertices
    results = []
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      vertex = ref[i]
      if (vertex.edge) {
        edge = {
          vertex1: vertex,
          vertex2:
            i === this.block.vertices.length - 1
              ? this.block.vertices[0]
              : this.block.vertices[i + 1],
          block: this.block,
          texture: vertex.edge,
          theme: this.theme.edge_params(vertex.edge),
        }
        edge.angle =
          Math2D.angle_between_points(edge.vertex1, edge.vertex2) - Math.PI / 2
        edge.vertices = [
          {
            x: edge.vertex1.absolute_x,
            y: edge.vertex1.absolute_y - edge.theme.depth,
          },
          {
            x: edge.vertex2.absolute_x,
            y: edge.vertex2.absolute_y - edge.theme.depth,
          },
          {
            x: edge.vertex2.absolute_x,
            y: edge.vertex2.absolute_y,
          },
          {
            x: edge.vertex1.absolute_x,
            y: edge.vertex1.absolute_y,
          },
        ]
        edge.aabb = this.compute_aabb(edge)
        results.push(this.list.push(edge))
      } else {
        results.push(void 0)
      }
    }
    return results
  }

  Edges.prototype.load_assets = function () {
    var edge, j, len, ref, results
    ref = this.list
    results = []
    for (j = 0, len = ref.length; j < len; j++) {
      edge = ref[j]
      results.push(this.assets.effects.push(edge.theme.file))
    }
    return results
  }

  Edges.prototype.init = function () {
    return this.init_sprites()
  }

  Edges.prototype.init_sprites = function () {
    var edge,
      j,
      k,
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
      vertex,
      x,
      y
    ref = this.list
    results = []
    for (j = 0, len = ref.length; j < len; j++) {
      edge = ref[j]
      points = []
      ref1 = edge.vertices
      for (k = 0, len1 = ref1.length; k < len1; k++) {
        vertex = ref1[k]
        // @ts-ignore
        points.push(new PIXI.Point(vertex.x, -vertex.y))
      }
      // @ts-ignore
      mask = new PIXI.Graphics()
      mask.beginFill(0xffffff, 1.0)
      mask.drawPolygon(points)
      this.level.camera.neutral_z_container.addChild(mask)
      x = Math.abs(Math.sin(edge.angle) * edge.theme.depth)
      y = Math.abs(Math.tan(edge.angle) * x)
      // @ts-ignore
      texture = PIXI.Texture.from(this.assets.get_url(edge.theme.file))
      size_x = edge.aabb.upperBound.x - edge.aabb.lowerBound.x + 2 * x
      size_y = edge.theme.depth
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
      results.push(this.level.camera.neutral_z_container.addChild(edge.sprite))
    }
    return results
  }

  Edges.prototype.update = function () {
    var block_visible, edge, j, len, ref, results
    if (!Constants.debug_physics) {
      block_visible = this.block.sprite.visible
      ref = this.list
      results = []
      for (j = 0, len = ref.length; j < len; j++) {
        edge = ref[j]
        results.push(
          (edge.sprite.visible = block_visible && this.visible(edge))
        )
      }
      return results
    }
  }

  Edges.prototype.compute_aabb = function (edge) {
    var aabb, first, j, len, lower_bound, ref, upper_bound, vertex
    first = true
    lower_bound = {}
    upper_bound = {}
    ref = edge.vertices
    for (j = 0, len = ref.length; j < len; j++) {
      vertex = ref[j]
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
    aabb = new b2AABB()
    aabb.lowerBound.Set(lower_bound.x, lower_bound.y)
    aabb.upperBound.Set(upper_bound.x, upper_bound.y)
    return aabb
  }

  Edges.prototype.visible = function (edge) {
    return edge.aabb.TestOverlap(this.level.camera.aabb)
  }

  return Edges
})()

export default Edges
