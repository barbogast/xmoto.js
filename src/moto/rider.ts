import Constants from '../constants.js'
import Physics from '../physics.js'
import * as Math2D from '../utils/math2d.js'

var b2Body,
  b2BodyDef,
  b2CircleShape,
  b2Fixture,
  b2FixtureDef,
  b2PolygonShape,
  b2PrismaticJointDef,
  b2RevoluteJointDef,
  b2Vec2
// @ts-ignore
b2Vec2 = Box2D.Common.Math.b2Vec2
// @ts-ignore
b2BodyDef = Box2D.Dynamics.b2BodyDef
// @ts-ignore
b2Body = Box2D.Dynamics.b2Body
// @ts-ignore
b2FixtureDef = Box2D.Dynamics.b2FixtureDef
// @ts-ignore
b2Fixture = Box2D.Dynamics.b2Fixture
// @ts-ignore
b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
// @ts-ignore
b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
// @ts-ignore
b2PrismaticJointDef = Box2D.Dynamics.Joints.b2PrismaticJointDef
// @ts-ignore
b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef

class Rider {
  level: any
  assets: any
  world: any
  moto: any
  mirror: any
  ghost: any
  player_start: any
  neck_joint: any
  ankle_joint: any
  wrist_joint: any
  knee_joint: any
  elbow_joint: any
  shoulder_joint: any
  hip_joint: any
  head: any
  torso: any
  lower_leg: any
  upper_leg: any
  lower_arm: any
  upper_arm: any
  head_sprite: any
  torso_sprite: any
  lower_leg_sprite: any
  upper_leg_sprite: any
  lower_arm_sprite: any
  upper_arm_sprite: any

  constructor(level, moto) {
    this.level = level
    this.assets = level.assets
    this.world = level.physics.world
    this.moto = moto
    this.mirror = moto.mirror
    this.ghost = moto.ghost
  }

  destroy() {
    this.world.DestroyBody(this.head)
    this.world.DestroyBody(this.torso)
    this.world.DestroyBody(this.lower_leg)
    this.world.DestroyBody(this.upper_leg)
    this.world.DestroyBody(this.lower_arm)
    this.world.DestroyBody(this.upper_arm)
    this.level.camera.neutral_z_container.removeChild(this.head_sprite)
    this.level.camera.neutral_z_container.removeChild(this.torso_sprite)
    this.level.camera.neutral_z_container.removeChild(this.lower_leg_sprite)
    this.level.camera.neutral_z_container.removeChild(this.upper_leg_sprite)
    this.level.camera.neutral_z_container.removeChild(this.lower_arm_sprite)
    return this.level.camera.neutral_z_container.removeChild(
      this.upper_arm_sprite
    )
  }

  load_assets() {
    var i, len, part, parts, results
    parts = [
      Constants.torso,
      Constants.upper_leg,
      Constants.lower_leg,
      Constants.upper_arm,
      Constants.lower_arm,
    ]
    results = []
    for (i = 0, len = parts.length; i < len; i++) {
      part = parts[i]
      if (this.ghost) {
        results.push(this.assets.moto.push(part.ghost_texture))
      } else {
        results.push(this.assets.moto.push(part.texture))
      }
    }
    return results
  }

  init_physics_parts() {
    this.player_start = this.level.entities.player_start
    this.head = this.create_head()
    this.torso = this.create_part(Constants.torso, 'torso')
    this.lower_leg = this.create_part(Constants.lower_leg, 'lower_leg')
    this.upper_leg = this.create_part(Constants.upper_leg, 'upper_leg')
    this.lower_arm = this.create_part(Constants.lower_arm, 'lower_arm')
    this.upper_arm = this.create_part(Constants.upper_arm, 'upper_arm')
    this.neck_joint = this.create_neck_joint()
    this.ankle_joint = this.create_joint(
      Constants.ankle,
      this.lower_leg,
      this.moto.body
    )
    this.wrist_joint = this.create_joint(
      Constants.wrist,
      this.lower_arm,
      this.moto.body
    )
    this.knee_joint = this.create_joint(
      Constants.knee,
      this.lower_leg,
      this.upper_leg
    )
    this.elbow_joint = this.create_joint(
      Constants.elbow,
      this.upper_arm,
      this.lower_arm
    )
    this.shoulder_joint = this.create_joint(
      Constants.shoulder,
      this.upper_arm,
      this.torso,
      true
    )
    return (this.hip_joint = this.create_joint(
      Constants.hip,
      this.upper_leg,
      this.torso,
      true
    ))
  }

  init_sprites() {
    var asset_name, i, len, part, ref, results
    ref = ['torso', 'upper_leg', 'lower_leg', 'upper_arm', 'lower_arm']
    results = []
    for (i = 0, len = ref.length; i < len; i++) {
      part = ref[i]
      if (this.ghost) {
        asset_name = Constants[part].ghost_texture
      } else {
        asset_name = Constants[part].texture
      }
      // @ts-ignore
      this[part + '_sprite'] = new PIXI.Sprite.from(
        this.assets.get_url(asset_name)
      )
      results.push(
        this.level.camera.neutral_z_container.addChild(this[part + '_sprite'])
      )
    }
    return results
  }

  position() {
    return this.moto.body.GetPosition()
  }

  eject() {
    var adjusted_force_vector, eject_angle, force_vector
    if (!this.moto.dead) {
      this.level.listeners.kill_moto(this.moto)
      force_vector = {
        x: 150.0 * this.moto.mirror,
        y: 0,
      }
      eject_angle = this.mirror * this.moto.body.GetAngle() + Math.PI / 4.0
      adjusted_force_vector = Math2D.rotate_point(force_vector, eject_angle, {
        x: 0,
        y: 0,
      })
      return this.torso.ApplyForce(
        adjusted_force_vector,
        this.torso.GetWorldCenter()
      )
    }
  }

  create_head() {
    var body, bodyDef, fixDef
    fixDef = new b2FixtureDef()
    fixDef.shape = new b2CircleShape(Constants.head.radius)
    fixDef.density = Constants.head.density
    fixDef.restitution = Constants.head.restitution
    fixDef.friction = Constants.head.friction
    fixDef.isSensor = !Constants.head.collisions
    fixDef.filter.groupIndex = -1
    bodyDef = new b2BodyDef()
    bodyDef.position.x =
      this.player_start.x + this.mirror * Constants.head.position.x
    bodyDef.position.y = this.player_start.y + Constants.head.position.y
    bodyDef.userData = {
      name: 'rider',
      type: this.ghost ? 'ghost' : 'player',
      part: 'head',
      rider: this,
    }
    bodyDef.type = b2Body.b2_dynamicBody
    body = this.world.CreateBody(bodyDef)
    body.CreateFixture(fixDef)
    return body
  }

  create_part(part_constants, name) {
    var body, bodyDef, fixDef
    fixDef = new b2FixtureDef()
    fixDef.shape = new b2PolygonShape()
    fixDef.density = part_constants.density
    fixDef.restitution = part_constants.restitution
    fixDef.friction = part_constants.friction
    fixDef.isSensor = !part_constants.collisions
    fixDef.filter.groupIndex = -1
    Physics.create_shape(fixDef, part_constants.shape, this.mirror === -1)
    bodyDef = new b2BodyDef()
    bodyDef.position.x =
      this.player_start.x + this.mirror * part_constants.position.x
    bodyDef.position.y = this.player_start.y + part_constants.position.y
    bodyDef.angle = this.mirror * part_constants.angle
    bodyDef.userData = {
      name: 'rider',
      type: this.ghost ? 'ghost' : 'player',
      part: name,
      rider: this,
    }
    bodyDef.type = b2Body.b2_dynamicBody
    body = this.world.CreateBody(bodyDef)
    body.CreateFixture(fixDef)
    return body
  }

  set_joint_commons(joint) {
    if (this.mirror === 1) {
      joint.lowerAngle = -Math.PI / 15
      joint.upperAngle = Math.PI / 108
    } else if (this.mirror === -1) {
      joint.lowerAngle = -Math.PI / 108
      joint.upperAngle = Math.PI / 15
    }
    return (joint.enableLimit = true)
  }

  create_neck_joint() {
    var axe, jointDef, position
    position = this.head.GetWorldCenter()
    axe = {
      x: position.x,
      y: position.y,
    }
    jointDef = new b2RevoluteJointDef()
    jointDef.Initialize(this.head, this.torso, axe)
    return this.world.CreateJoint(jointDef)
  }

  create_joint(joint_constants, part1, part2, invert_joint?) {
    var axe, jointDef, position
    if (invert_joint == null) {
      invert_joint = false
    }
    position = part1.GetWorldCenter()
    axe = {
      x: position.x + this.mirror * joint_constants.axe_position.x,
      y: position.y + joint_constants.axe_position.y,
    }
    jointDef = new b2RevoluteJointDef()
    if (invert_joint) {
      jointDef.Initialize(part2, part1, axe)
    } else {
      jointDef.Initialize(part1, part2, axe)
    }
    this.set_joint_commons(jointDef)
    return this.world.CreateJoint(jointDef)
  }

  update(visible) {
    if (!Constants.debug_physics) {
      this.update_part(this.torso, 'torso', visible)
      this.update_part(this.upper_leg, 'upper_leg', visible)
      this.update_part(this.lower_leg, 'lower_leg', visible)
      this.update_part(this.upper_arm, 'upper_arm', visible)
      return this.update_part(this.lower_arm, 'lower_arm', visible)
    }
  }

  update_part(part, name, visible) {
    var angle, part_constants, position, sprite, texture
    sprite = this[name + '_sprite']
    sprite.visible = visible
    if (visible) {
      part_constants = Constants[name]
      position = part.GetPosition()
      angle = part.GetAngle()
      texture = this.ghost
        ? part_constants.ghost_texture
        : part_constants.texture
      sprite.width = part_constants.texture_size.x
      sprite.height = part_constants.texture_size.y
      sprite.anchor.x = 0.5
      sprite.anchor.y = 0.5
      sprite.x = position.x
      sprite.y = -position.y
      sprite.rotation = -angle
      return (sprite.scale.x = this.mirror * Math.abs(sprite.scale.x))
    }
  }
}

export default Rider
