import Camera from './camera.js'
import Constants from './constants.js'
import Level, { Options } from './level.js'
import Ghost from './moto/ghost.js'
import { World } from './temporaryTypes.js'

var b2Body,
  b2BodyDef,
  b2DebugDraw,
  b2FixtureDef,
  b2PolygonShape,
  b2Settings,
  b2Vec2,
  b2World
// @ts-ignore
b2World = Box2D.Dynamics.b2World
// @ts-ignore
b2Vec2 = Box2D.Common.Math.b2Vec2
// @ts-ignore
b2BodyDef = Box2D.Dynamics.b2BodyDef
// @ts-ignore
b2Body = Box2D.Dynamics.b2Body
// @ts-ignore
b2FixtureDef = Box2D.Dynamics.b2FixtureDef
// @ts-ignore
b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
// @ts-ignore
b2DebugDraw = Box2D.Dynamics.b2DebugDraw
// @ts-ignore
b2Settings = Box2D.Common.b2Settings

class Physics {
  level: Level
  options: Options
  camera: Camera
  world: World
  debug_ctx: CanvasRenderingContext2D
  last_step: number
  step: number
  steps: number

  constructor(level) {
    this.level = level
    this.options = level.options
    this.camera = level.camera
    this.world = new b2World(new b2Vec2(0, -Constants.gravity), true) // gravity vector, and doSleep
    this.debug_ctx = level.debug_ctx

    // Double default precision between wheel and ground
    b2Settings.b2_linearSlop = 0.0025

    // debug initialization
    const debugDraw = new b2DebugDraw()
    debugDraw.SetSprite(this.debug_ctx) // context
    this.debug_ctx.lineWidth = 0.05 // thickness of line (debugDraw.SetLineThickness doesn't work)
    debugDraw.SetFillAlpha(0.5) // transparency
    debugDraw.m_sprite.graphics.clear = () => {} // Don't allow box2D to (badly) clear the canvas

    // Assign debug to world
    debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit)
    this.world.SetDebugDraw(debugDraw)
  }

  init() {
    this.last_step = new Date().getTime()
    this.step = 1000.0 / Constants.fps
    this.steps = 0
  }

  restart() {
    const replay = this.level.replay
    const player_ghost = this.level.ghosts.player

    // save replay if better (local + server)
    if (replay.success) {
      const time = (replay.steps / 60.0).toFixed(2).replace('.', ':')
      if (!player_ghost || player_ghost.replay.steps > replay.steps) {
        this.save_replay_and_init_ghosts(replay)
        console.log(
          `WIN : you improved your personal score : ${time} (${replay.steps} steps)`
        )
      } else {
        console.log(
          `FAIL : you didn't improve your personal score : ${time} (${replay.steps} steps)`
        )
      }
    }

    this.level.restart()
    this.init()
  }

  save_replay_and_init_ghosts(replay) {
    replay.add_step() // add last step
    replay.save()
    this.level.ghosts.player = new Ghost(this.level, replay.clone())
    this.level.ghosts.init()
  }

  update() {
    while (new Date().getTime() - this.last_step > this.step) {
      this.steps = this.steps + 1
      this.last_step += this.step

      this.level.moto.move()
      this.level.ghosts.move()
      this.level.replay.add_step()
      this.level.camera.move()
      this.world.Step(1.0 / Constants.fps, 10, 10)
      this.world.ClearForces()
      this.level.input.space = false

      if (this.level.need_to_restart) {
        this.restart()
        this.level.need_to_restart = false
      }
    }
  }

  create_polygon(
    vertices,
    name,
    density = 1.0,
    restitution = 0.5,
    friction = 1.0,
    group_index = -2
  ) {
    // Create fixture
    const fixDef = new b2FixtureDef()

    fixDef.shape = new b2PolygonShape()
    fixDef.density = density
    fixDef.restitution = restitution
    fixDef.friction = friction
    fixDef.filter.groupIndex = group_index

    // Create polygon
    Physics.create_shape(fixDef, vertices)

    // Create body
    const bodyDef = new b2BodyDef()
    bodyDef.position.x = 0
    bodyDef.position.y = 0

    bodyDef.userData = {
      name: name,
    }

    bodyDef.type = b2Body.b2_staticBody

    // Assign fixture to body and add body to 2D world
    this.world.CreateBody(bodyDef).CreateFixture(fixDef)
  }

  create_lines(
    block,
    name,
    density = 1.0,
    restitution = 0.5,
    friction = 1.0,
    group_index = -2
  ) {
    // Create body
    const bodyDef = new b2BodyDef()

    // Assign body position
    bodyDef.position.x = block.position.x
    bodyDef.position.y = block.position.y

    bodyDef.userData = {
      name: name,
    }

    bodyDef.type = b2Body.b2_staticBody

    // add body to the world
    const body = this.world.CreateBody(bodyDef)

    // assign each couple of vertices to a line
    for (const [i, vertex] of block.vertices.entries()) {
      // Create fixture
      const fixDef = new b2FixtureDef()

      fixDef.shape = new b2PolygonShape()
      fixDef.density = density
      fixDef.restitution = restitution
      fixDef.friction = friction
      fixDef.filter.groupIndex = group_index

      // Create line (from polygon because box2Dweb cannot do otherwise)
      const vertex1 = vertex
      const vertex2 =
        i === block.vertices.length - 1
          ? block.vertices[0]
          : block.vertices[i + 1]
      fixDef.shape.SetAsArray(
        [new b2Vec2(vertex1.x, vertex1.y), new b2Vec2(vertex2.x, vertex2.y)],
        2
      )

      // Assign fixture (line) to body
      body.CreateFixture(fixDef)
    }
  }

  static create_shape(fix_def, shape, mirror = false) {
    const b2vertices = []

    if (mirror === false) {
      for (const vertex of shape) {
        b2vertices.push(new b2Vec2(vertex.x, vertex.y))
      }
    } else {
      for (const vertex of shape) {
        b2vertices.unshift(new b2Vec2(-vertex.x, vertex.y))
      }
    }
    return fix_def.shape.SetAsArray(b2vertices)
  }
}

export default Physics
