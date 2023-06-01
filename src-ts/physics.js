import Constants from './constants.js'

var Physics,
  b2AABB,
  b2Body,
  b2BodyDef,
  b2CircleShape,
  b2DebugDraw,
  b2EdgeChainDef,
  b2EdgeShape,
  b2Fixture,
  b2FixtureDef,
  b2MassData,
  b2MouseJointDef,
  b2PolygonShape,
  b2Settings,
  b2Vec2,
  b2World

b2World = Box2D.Dynamics.b2World

b2Vec2 = Box2D.Common.Math.b2Vec2

b2AABB = Box2D.Collision.b2AABB

b2BodyDef = Box2D.Dynamics.b2BodyDef

b2Body = Box2D.Dynamics.b2Body

b2FixtureDef = Box2D.Dynamics.b2FixtureDef

b2Fixture = Box2D.Dynamics.b2Fixture

b2MassData = Box2D.Collision.Shapes.b2MassData

b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape

b2CircleShape = Box2D.Collision.Shapes.b2CircleShape

b2EdgeShape = Box2D.Collision.Shapes.b2EdgeShape

b2EdgeChainDef = Box2D.Collision.Shapes.b2EdgeChainDef

b2DebugDraw = Box2D.Dynamics.b2DebugDraw

b2MouseJointDef = Box2D.Dynamics.Joints.b2MouseJointDef

b2Settings = Box2D.Common.b2Settings

Physics = (function () {
  function Physics(level) {
    var debugDraw
    this.level = level
    this.options = level.options
    this.camera = level.camera
    this.world = new b2World(new b2Vec2(0, -Constants.gravity), true)
    this.debug_ctx = level.debug_ctx
    b2Settings.b2_linearSlop = 0.0025
    debugDraw = new b2DebugDraw()
    debugDraw.SetSprite(this.debug_ctx)
    this.debug_ctx.lineWidth = 0.05
    debugDraw.SetFillAlpha(0.5)
    debugDraw.m_sprite.graphics.clear = function () {}
    debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit)
    this.world.SetDebugDraw(debugDraw)
    this.world
  }

  Physics.prototype.init = function () {
    this.last_step = new Date().getTime()
    this.step = 1000.0 / Constants.fps
    return (this.steps = 0)
  }

  Physics.prototype.restart = function () {
    var player_ghost, replay, time
    replay = this.level.replay
    player_ghost = this.level.ghosts.player
    if (replay.success) {
      time = (replay.steps / 60.0).toFixed(2).replace('.', ':')
      if (!player_ghost.replay || player_ghost.replay.steps > replay.steps) {
        this.save_replay_and_init_ghosts(replay)
        console.log(
          'WIN : you improved your personal score : ' +
            time +
            ' (' +
            replay.steps +
            ' steps)'
        )
      } else {
        console.log(
          "FAIL : you didn't improve your personal score : " +
            time +
            ' (' +
            replay.steps +
            ' steps)'
        )
      }
    }
    this.level.restart()
    return this.init()
  }

  Physics.prototype.save_replay_and_init_ghosts = function (replay) {
    replay.add_step()
    replay.save()
    this.level.ghosts.player = new Ghost(this.level, replay.clone())
    return this.level.ghosts.init()
  }

  Physics.prototype.update = function () {
    var results
    results = []
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
        results.push((this.level.need_to_restart = false))
      } else {
        results.push(void 0)
      }
    }
    return results
  }

  Physics.prototype.create_polygon = function (
    vertices,
    name,
    density,
    restitution,
    friction,
    group_index
  ) {
    var bodyDef, fixDef
    if (density == null) {
      density = 1.0
    }
    if (restitution == null) {
      restitution = 0.5
    }
    if (friction == null) {
      friction = 1.0
    }
    if (group_index == null) {
      group_index = -2
    }
    fixDef = new b2FixtureDef()
    fixDef.shape = new b2PolygonShape()
    fixDef.density = density
    fixDef.restitution = restitution
    fixDef.friction = friction
    fixDef.filter.groupIndex = group_index
    Physics.create_shape(fixDef, vertices)
    bodyDef = new b2BodyDef()
    bodyDef.position.x = 0
    bodyDef.position.y = 0
    bodyDef.userData = {
      name: name,
    }
    bodyDef.type = b2Body.b2_staticBody
    return this.world.CreateBody(bodyDef).CreateFixture(fixDef)
  }

  Physics.prototype.create_lines = function (
    block,
    name,
    density,
    restitution,
    friction,
    group_index
  ) {
    var body, bodyDef, fixDef, i, j, len, ref, results, vertex, vertex1, vertex2
    if (density == null) {
      density = 1.0
    }
    if (restitution == null) {
      restitution = 0.5
    }
    if (friction == null) {
      friction = 1.0
    }
    if (group_index == null) {
      group_index = -2
    }
    bodyDef = new b2BodyDef()
    bodyDef.position.x = block.position.x
    bodyDef.position.y = block.position.y
    bodyDef.userData = {
      name: name,
    }
    bodyDef.type = b2Body.b2_staticBody
    body = this.world.CreateBody(bodyDef)
    ref = block.vertices
    results = []
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      vertex = ref[i]
      fixDef = new b2FixtureDef()
      fixDef.shape = new b2PolygonShape()
      fixDef.density = density
      fixDef.restitution = restitution
      fixDef.friction = friction
      fixDef.filter.groupIndex = group_index
      vertex1 = vertex
      vertex2 =
        i === block.vertices.length - 1
          ? block.vertices[0]
          : block.vertices[i + 1]
      fixDef.shape.SetAsArray(
        [new b2Vec2(vertex1.x, vertex1.y), new b2Vec2(vertex2.x, vertex2.y)],
        2
      )
      results.push(body.CreateFixture(fixDef))
    }
    return results
  }

  Physics.create_shape = function (fix_def, shape, mirror) {
    var b2vertices, j, k, len, len1, vertex
    if (mirror == null) {
      mirror = false
    }
    b2vertices = []
    if (mirror === false) {
      for (j = 0, len = shape.length; j < len; j++) {
        vertex = shape[j]
        b2vertices.push(new b2Vec2(vertex.x, vertex.y))
      }
    } else {
      for (k = 0, len1 = shape.length; k < len1; k++) {
        vertex = shape[k]
        b2vertices.unshift(new b2Vec2(-vertex.x, vertex.y))
      }
    }
    return fix_def.shape.SetAsArray(b2vertices)
  }

  return Physics
})()

export default Physics
