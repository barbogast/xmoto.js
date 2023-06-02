import Rider from './rider.js'
import Constants from '../constants.js'
import Physics from '../physics.js'
import * as Math2D from '../utils/math2d.js'
import * as MotoFlipService from '../services/moto_flip_service.js'
import Level from '../level.js'
import Assets from '../utils/assets.js'
import Ghost from './ghost.js'
import { PlayerStart } from '../level_elements/entities.js'
import { Block2D, World } from '../temporaryTypes.js'

var b2Body,
  b2BodyDef,
  b2CircleShape,
  b2Fixture,
  b2FixtureDef,
  b2PolygonShape,
  b2PrismaticJointDef,
  b2RevoluteJointDef,
  b2Vec2,
  b2AABB
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
// @ts-ignore
b2AABB = Box2D.Collision.b2AABB

class Moto {
  level: Level
  assets: Assets
  world: World
  mirror: number
  dead: boolean
  ghost: Ghost
  rider: Rider
  player_start: PlayerStart
  left_revolute_joint: Block2D
  right_revolute_joint: Block2D
  left_prismatic_joint: Block2D
  right_prismatic_joint: Block2D
  aabb: Block2D
  body: Block2D
  left_wheel: Block2D
  right_wheel: Block2D
  left_axle: Block2D
  right_axle: Block2D
  body_sprite: Block2D
  left_wheel_sprite: Block2D
  right_wheel_sprite: Block2D
  left_axle_sprite: Block2D
  right_axle_sprite: Block2D

  constructor(level, ghost?) {
    if (ghost == null) {
      ghost = false
    }
    this.level = level
    this.assets = level.assets
    this.world = level.physics.world
    this.mirror = 1
    this.dead = false
    this.ghost = ghost
    this.rider = new Rider(level, this)
  }

  destroy() {
    this.rider.destroy()
    this.world.DestroyBody(this.body)
    this.world.DestroyBody(this.left_wheel)
    this.world.DestroyBody(this.right_wheel)
    this.world.DestroyBody(this.left_axle)
    this.world.DestroyBody(this.right_axle)
    this.level.camera.neutral_z_container.removeChild(this.body_sprite)
    this.level.camera.neutral_z_container.removeChild(this.left_wheel_sprite)
    this.level.camera.neutral_z_container.removeChild(this.right_wheel_sprite)
    this.level.camera.neutral_z_container.removeChild(this.left_axle_sprite)
    return this.level.camera.neutral_z_container.removeChild(
      this.right_axle_sprite
    )
  }

  load_assets() {
    var i, len, part, parts
    parts = [
      Constants.body,
      Constants.left_wheel,
      Constants.right_wheel,
      Constants.left_axle,
      Constants.right_axle,
    ]
    for (i = 0, len = parts.length; i < len; i++) {
      part = parts[i]
      if (this.ghost) {
        this.assets.moto.push(part.ghost_texture)
      } else {
        this.assets.moto.push(part.texture)
      }
    }
    return this.rider.load_assets()
  }

  init() {
    this.init_physics_parts()
    return this.init_sprites()
  }

  init_physics_parts() {
    this.player_start = this.level.entities.player_start
    this.body = this.create_body()
    this.left_wheel = this.create_wheel(Constants.left_wheel)
    this.right_wheel = this.create_wheel(Constants.right_wheel)
    this.left_axle = this.create_axle(Constants.left_axle)
    this.right_axle = this.create_axle(Constants.right_axle)
    this.left_revolute_joint = this.create_revolute_joint(
      this.left_axle,
      this.left_wheel
    )
    this.right_revolute_joint = this.create_revolute_joint(
      this.right_axle,
      this.right_wheel
    )
    this.left_prismatic_joint = this.create_prismatic_joint(
      this.left_axle,
      Constants.left_suspension
    )
    this.right_prismatic_joint = this.create_prismatic_joint(
      this.right_axle,
      Constants.right_suspension
    )
    return this.rider.init_physics_parts()
  }

  init_sprites() {
    var asset_name, i, len, part, ref
    ref = ['body', 'left_wheel', 'right_wheel', 'left_axle', 'right_axle']
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
      this.level.camera.neutral_z_container.addChild(this[part + '_sprite'])
    }
    return this.rider.init_sprites()
  }

  move(input?) {
    var air_density,
      back_force,
      biker_force,
      drag_force,
      moto_acceleration,
      object_penetration,
      rigidity,
      squared_speed,
      v
    if (input == null) {
      input = this.level.input
    }
    moto_acceleration = Constants.moto_acceleration
    biker_force = Constants.biker_force
    if (!this.dead) {
      if (input.up) {
        this.left_wheel.ApplyTorque(-this.mirror * moto_acceleration)
      }
      if (input.down) {
        this.right_wheel.SetAngularVelocity(0)
        this.left_wheel.SetAngularVelocity(0)
      }
      if (
        (input.left && this.mirror === 1) ||
        (input.right && this.mirror === -1)
      ) {
        this.wheeling(biker_force)
      }
      if (
        (input.right && this.mirror === 1) ||
        (input.left && this.mirror === -1)
      ) {
        biker_force = -biker_force * 0.8
        this.wheeling(biker_force)
      }
      if (input.space) {
        this.flip()
      }
    }
    if (!input.up && !input.down) {
      v = this.left_wheel.GetAngularVelocity()
      this.left_wheel.ApplyTorque(Math.abs(v) >= 0.2 ? -v / 10 : void 0)
      v = this.right_wheel.GetAngularVelocity()
      this.right_wheel.ApplyTorque(Math.abs(v) >= 0.2 ? -v / 100 : void 0)
    }
    back_force = Constants.left_suspension.back_force
    rigidity = Constants.left_suspension.rigidity
    this.left_prismatic_joint.SetMaxMotorForce(
      rigidity +
        Math.abs(
          rigidity *
            100 *
            Math.pow(this.left_prismatic_joint.GetJointTranslation(), 2)
        )
    )
    this.left_prismatic_joint.SetMotorSpeed(
      -back_force * this.left_prismatic_joint.GetJointTranslation()
    )
    back_force = Constants.right_suspension.back_force
    rigidity = Constants.right_suspension.rigidity
    this.right_prismatic_joint.SetMaxMotorForce(
      rigidity +
        Math.abs(
          rigidity *
            100 *
            Math.pow(this.right_prismatic_joint.GetJointTranslation(), 2)
        )
    )
    this.right_prismatic_joint.SetMotorSpeed(
      -back_force * this.right_prismatic_joint.GetJointTranslation()
    )
    air_density = Constants.air_density
    object_penetration = 0.025
    squared_speed = Math.pow(this.body.GetLinearVelocity().x, 2)
    drag_force = air_density * squared_speed * object_penetration
    this.body.SetLinearDamping(drag_force)
    if (this.right_wheel.GetAngularVelocity() > Constants.max_moto_speed) {
      this.right_wheel.SetAngularVelocity(Constants.max_moto_speed)
    } else if (
      this.right_wheel.GetAngularVelocity() < -Constants.max_moto_speed
    ) {
      this.right_wheel.SetAngularVelocity(-Constants.max_moto_speed)
    }
    if (this.left_wheel.GetAngularVelocity() > Constants.max_moto_speed) {
      return this.left_wheel.SetAngularVelocity(Constants.max_moto_speed)
    } else if (
      this.left_wheel.GetAngularVelocity() < -Constants.max_moto_speed
    ) {
      return this.left_wheel.SetAngularVelocity(-Constants.max_moto_speed)
    }
  }

  wheeling(force) {
    var force_leg, force_torso, moto_angle
    moto_angle = this.mirror * this.body.GetAngle()
    this.body.ApplyTorque(this.mirror * force * 0.5)
    force_torso = Math2D.rotate_point(
      {
        x: this.mirror * -force,
        y: 0,
      },
      moto_angle,
      {
        x: 0,
        y: 0,
      }
    )
    force_torso.y = this.mirror * force_torso.y
    this.rider.torso.ApplyForce(force_torso, this.rider.torso.GetWorldCenter())
    force_leg = Math2D.rotate_point(
      {
        x: this.mirror * force,
        y: 0,
      },
      moto_angle,
      {
        x: 0,
        y: 0,
      }
    )
    force_leg.y = this.mirror * force_leg.y
    return this.rider.lower_leg.ApplyForce(
      force_leg,
      this.rider.lower_leg.GetWorldCenter()
    )
  }

  flip() {
    if (!this.dead) {
      return MotoFlipService.execute(this)
    }
  }

  create_body() {
    var body, bodyDef, fixDef
    fixDef = new b2FixtureDef()
    fixDef.shape = new b2PolygonShape()
    fixDef.density = Constants.body.density
    fixDef.restitution = Constants.body.restitution
    fixDef.friction = Constants.body.friction
    fixDef.isSensor = !Constants.body.collisions
    fixDef.filter.groupIndex = -1
    Physics.create_shape(fixDef, Constants.body.shape, this.mirror === -1)
    bodyDef = new b2BodyDef()
    bodyDef.position.x =
      this.player_start.x + this.mirror * Constants.body.position.x
    bodyDef.position.y = this.player_start.y + Constants.body.position.y
    bodyDef.userData = {
      name: 'moto',
      type: this.ghost ? 'ghost' : 'player',
      moto: this,
    }
    bodyDef.type = b2Body.b2_dynamicBody
    body = this.world.CreateBody(bodyDef)
    body.CreateFixture(fixDef)
    return body
  }

  create_wheel(part_constants) {
    var bodyDef, fixDef, wheel
    fixDef = new b2FixtureDef()
    fixDef.shape = new b2CircleShape(part_constants.radius)
    fixDef.density = part_constants.density
    fixDef.restitution = part_constants.restitution
    fixDef.friction = part_constants.friction
    fixDef.isSensor = !part_constants.collisions
    fixDef.filter.groupIndex = -1
    bodyDef = new b2BodyDef()
    bodyDef.position.x =
      this.player_start.x + this.mirror * part_constants.position.x
    bodyDef.position.y = this.player_start.y + part_constants.position.y
    bodyDef.userData = {
      name: 'moto',
      type: this.ghost ? 'ghost' : 'player',
      moto: this,
    }
    bodyDef.type = b2Body.b2_dynamicBody
    wheel = this.world.CreateBody(bodyDef)
    wheel.CreateFixture(fixDef)
    return wheel
  }

  create_axle(part_constants) {
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
    bodyDef.userData = {
      name: 'moto',
      type: this.ghost ? 'ghost' : 'player',
      moto: this,
    }
    bodyDef.type = b2Body.b2_dynamicBody
    body = this.world.CreateBody(bodyDef)
    body.CreateFixture(fixDef)
    return body
  }

  create_revolute_joint(axle, wheel) {
    var jointDef
    jointDef = new b2RevoluteJointDef()
    jointDef.Initialize(axle, wheel, wheel.GetWorldCenter())
    return this.world.CreateJoint(jointDef)
  }

  create_prismatic_joint(axle, part_constants) {
    var angle, jointDef
    jointDef = new b2PrismaticJointDef()
    angle = part_constants.angle
    jointDef.Initialize(
      this.body,
      axle,
      axle.GetWorldCenter(),
      new b2Vec2(this.mirror * angle.x, angle.y)
    )
    jointDef.enableLimit = true
    jointDef.lowerTranslation = part_constants.lower_translation
    jointDef.upperTranslation = part_constants.upper_translation
    jointDef.enableMotor = true
    jointDef.collideConnected = false
    return this.world.CreateJoint(jointDef)
  }

  update() {
    var visible
    this.aabb = this.compute_aabb()
    if (!Constants.debug_physics) {
      visible = this.visible()
      this.update_wheel(this.left_wheel, Constants.left_wheel, visible)
      this.update_wheel(this.right_wheel, Constants.right_wheel, visible)
      this.update_left_axle(this.left_axle, Constants.left_axle, visible)
      this.update_right_axle(this.right_axle, Constants.right_axle, visible)
      this.update_body(this.body, Constants.body, visible)
      return this.rider.update(visible)
    }
  }

  update_wheel(part, part_constants, visible) {
    var angle, position, wheel_sprite
    if (part_constants.position.x < 0) {
      wheel_sprite = this.left_wheel_sprite
    } else {
      wheel_sprite = this.right_wheel_sprite
    }
    wheel_sprite.visible = visible
    if (visible) {
      position = part.GetPosition()
      angle = part.GetAngle()
      wheel_sprite.width = 2 * part_constants.radius
      wheel_sprite.height = 2 * part_constants.radius
      wheel_sprite.anchor.x = 0.5
      wheel_sprite.anchor.y = 0.5
      wheel_sprite.x = position.x
      wheel_sprite.y = -position.y
      wheel_sprite.rotation = -angle
      return (wheel_sprite.scale.x =
        this.mirror * Math.abs(wheel_sprite.scale.x))
    }
  }

  update_body(part, part_constants, visible) {
    var angle, position
    this.body_sprite.visible = visible
    if (visible) {
      position = part.GetPosition()
      angle = part.GetAngle()
      this.body_sprite.width = part_constants.texture_size.x
      this.body_sprite.height = part_constants.texture_size.y
      this.body_sprite.anchor.x = 0.5
      this.body_sprite.anchor.y = 0.5
      this.body_sprite.x = position.x
      this.body_sprite.y = -position.y
      this.body_sprite.rotation = -angle
      return (this.body_sprite.scale.x =
        this.mirror * Math.abs(this.body_sprite.scale.x))
    }
  }

  update_left_axle(part, part_constants, visible) {
    var axle_position, axle_thickness, texture, wheel_position
    axle_thickness = 0.09
    wheel_position = this.left_wheel.GetPosition()
    wheel_position = {
      x: wheel_position.x - (this.mirror * axle_thickness) / 2.0,
      y: wheel_position.y - 0.025,
    }
    axle_position = {
      x: -0.17 * this.mirror,
      y: -0.3,
    }
    texture = this.ghost ? part_constants.ghost_texture : part_constants.texture
    return this.update_axle_common(
      wheel_position,
      axle_position,
      axle_thickness,
      texture,
      'left',
      visible
    )
  }

  update_right_axle(part, part_constants, visible) {
    var axle_position, axle_thickness, texture, wheel_position
    axle_thickness = 0.07
    wheel_position = this.right_wheel.GetPosition()
    wheel_position = {
      x:
        wheel_position.x +
        (this.mirror * axle_thickness) / 2.0 -
        this.mirror * 0.03,
      y: wheel_position.y - 0.045,
    }
    axle_position = {
      x: 0.52 * this.mirror,
      y: 0.025,
    }
    texture = this.ghost ? part_constants.ghost_texture : part_constants.texture
    return this.update_axle_common(
      wheel_position,
      axle_position,
      axle_thickness,
      texture,
      'right',
      visible
    )
  }

  update_axle_common(
    wheel_position,
    axle_position,
    axle_thickness,
    texture,
    side,
    visible
  ) {
    var angle,
      axle_adjusted_position,
      axle_sprite,
      body_angle,
      body_position,
      distance
    axle_sprite = this[side + '_axle_sprite']
    axle_sprite.visible = visible
    if (visible) {
      body_position = this.body.GetPosition()
      body_angle = this.body.GetAngle()
      axle_adjusted_position = Math2D.rotate_point(
        axle_position,
        body_angle,
        body_position
      )
      distance = Math2D.distance_between_points(
        wheel_position,
        axle_adjusted_position
      )
      angle =
        Math2D.angle_between_points(axle_adjusted_position, wheel_position) +
        (this.mirror * Math.PI) / 2
      axle_sprite.width = distance
      axle_sprite.height = axle_thickness
      axle_sprite.anchor.x = 0.0
      axle_sprite.anchor.y = 0.5
      axle_sprite.x = wheel_position.x
      axle_sprite.y = -wheel_position.y
      axle_sprite.rotation = -angle
      return (axle_sprite.scale.x = this.mirror * Math.abs(axle_sprite.scale.x))
    }
  }

  compute_aabb() {
    var aabb, lower1, lower2, lower3, upper1, upper2, upper3
    lower1 = this.left_wheel.GetFixtureList().GetAABB().lowerBound
    lower2 = this.right_wheel.GetFixtureList().GetAABB().lowerBound
    lower3 = this.rider.head.GetFixtureList().GetAABB().lowerBound
    upper1 = this.left_wheel.GetFixtureList().GetAABB().upperBound
    upper2 = this.right_wheel.GetFixtureList().GetAABB().upperBound
    upper3 = this.rider.head.GetFixtureList().GetAABB().upperBound
    aabb = new b2AABB()
    aabb.lowerBound.Set(
      Math.min(lower1.x, lower2.x, lower3.x),
      Math.min(lower1.y, lower2.y, lower3.y)
    )
    aabb.upperBound.Set(
      Math.max(upper1.x, upper2.x, upper3.x),
      Math.max(upper1.y, upper2.y, upper3.y)
    )
    return aabb
  }

  visible() {
    return this.aabb.TestOverlap(this.level.camera.aabb)
  }
}

export default Moto
