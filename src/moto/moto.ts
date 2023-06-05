import Rider from './rider.js'
import Constants from '../constants.js'
import Physics from '../physics.js'
import * as Math2D from '../utils/math2d.js'
import * as MotoFlipService from '../services/moto_flip_service.js'
import Level from '../level.js'
import Assets from '../utils/assets.js'
import { PlayerStart } from '../level_elements/entities.js'
import { Block2D, World } from '../temporaryTypes.js'

// @ts-ignore
const b2Vec2 = Box2D.Common.Math.b2Vec2
// @ts-ignore
const b2BodyDef = Box2D.Dynamics.b2BodyDef
// @ts-ignore
const b2Body = Box2D.Dynamics.b2Body
// @ts-ignore
const b2FixtureDef = Box2D.Dynamics.b2FixtureDef
// @ts-ignore
const b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
// @ts-ignore
const b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
// @ts-ignore
const b2PrismaticJointDef = Box2D.Dynamics.Joints.b2PrismaticJointDef
// @ts-ignore
const b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef
// @ts-ignore
const b2AABB = Box2D.Collision.b2AABB

class Moto {
  level: Level
  assets: Assets
  world: World
  mirror: number
  dead: boolean
  ghost: boolean
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

  constructor(level: Level, ghost = false) {
    this.level = level
    this.assets = level.assets
    this.world = level.physics.world
    this.mirror = 1 // 1 = right-oriented, -1 = left-oriented
    this.dead = false
    this.ghost = ghost
    this.rider = new Rider(level, this)
  }

  destroy() {
    this.rider.destroy()

    // physics
    this.world.DestroyBody(this.body)
    this.world.DestroyBody(this.left_wheel)
    this.world.DestroyBody(this.right_wheel)
    this.world.DestroyBody(this.left_axle)
    this.world.DestroyBody(this.right_axle)

    // graphics
    this.level.camera.neutral_z_container.removeChild(this.body_sprite)
    this.level.camera.neutral_z_container.removeChild(this.left_wheel_sprite)
    this.level.camera.neutral_z_container.removeChild(this.right_wheel_sprite)
    this.level.camera.neutral_z_container.removeChild(this.left_axle_sprite)
    return this.level.camera.neutral_z_container.removeChild(
      this.right_axle_sprite
    )
  }

  load_assets() {
    const parts = [
      Constants.body,
      Constants.left_wheel,
      Constants.right_wheel,
      Constants.left_axle,
      Constants.right_axle,
    ]
    for (const part of parts) {
      if (this.ghost) {
        this.assets.moto.push(part.ghost_texture)
      } else {
        this.assets.moto.push(part.texture)
      }
    }

    this.rider.load_assets()
  }

  init() {
    this.init_physics_parts()
    this.init_sprites()
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

    this.rider.init_physics_parts()
  }

  init_sprites() {
    const parts = [
      'body',
      'left_wheel',
      'right_wheel',
      'left_axle',
      'right_axle',
    ] as const
    for (const part of parts) {
      let asset_name
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

    this.rider.init_sprites()
  }

  move(input?: {
    up: boolean
    down: boolean
    left: boolean
    right: boolean
    space: boolean
  }) {
    if (!input) {
      input = this.level.input
    }

    const moto_acceleration = Constants.moto_acceleration
    let biker_force = Constants.biker_force

    if (!this.dead) {
      // Accelerate
      if (input.up) {
        this.left_wheel.ApplyTorque(-this.mirror * moto_acceleration)
      }

      // Brakes
      if (input.down) {
        this.right_wheel.SetAngularVelocity(0)
        this.left_wheel.SetAngularVelocity(0)
      }

      // Back wheeling
      if (
        (input.left && this.mirror === 1) ||
        (input.right && this.mirror === -1)
      ) {
        this.wheeling(biker_force)
      }

      // Front wheeling
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

    let v, back_force, rigidity

    if (!input.up && !input.down) {
      // Engine brake
      v = this.left_wheel.GetAngularVelocity()
      this.left_wheel.ApplyTorque(Math.abs(v) >= 0.2 ? -v / 10 : void 0)
      // Friction on right wheel
      v = this.right_wheel.GetAngularVelocity()
      this.right_wheel.ApplyTorque(Math.abs(v) >= 0.2 ? -v / 100 : void 0)
    }

    // Left wheel suspension
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

    // Right wheel suspension
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

    // Drag (air resistance)
    const air_density = Constants.air_density
    const object_penetration = 0.025
    const squared_speed = Math.pow(this.body.GetLinearVelocity().x, 2)
    const drag_force = air_density * squared_speed * object_penetration
    this.body.SetLinearDamping(drag_force)

    // Limitation of wheel rotation speed (and by extension, of moto)
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

    // Detection of drifting
    // const rotation_speed = -(moto.left_wheel.GetAngularVelocity()*Math.PI/180)*2*Math.PI*Constants.left_wheel.radius
    // const linear_speed = moto.left_wheel.GetLinearVelocity().x/10
    // if(linear_speed > 0 && rotation_speed > 1.5*linear_speed){
    //   this.level.particles.create()
    // }
  }

  wheeling(force: number) {
    const moto_angle = this.mirror * this.body.GetAngle()

    this.body.ApplyTorque(this.mirror * force * 0.5)

    const force_torso = Math2D.rotate_point(
      { x: this.mirror * -force, y: 0 },
      moto_angle,
      { x: 0, y: 0 }
    )
    force_torso.y = this.mirror * force_torso.y
    this.rider.torso.ApplyForce(force_torso, this.rider.torso.GetWorldCenter())

    const force_leg = Math2D.rotate_point(
      { x: this.mirror * force, y: 0 },
      moto_angle,
      { x: 0, y: 0 }
    )
    force_leg.y = this.mirror * force_leg.y
    this.rider.lower_leg.ApplyForce(
      force_leg,
      this.rider.lower_leg.GetWorldCenter()
    )
  }

  flip() {
    if (!this.dead) {
      MotoFlipService.execute(this)
    }
  }

  create_body() {
    // Create fixture
    const fixDef = new b2FixtureDef()

    fixDef.shape = new b2PolygonShape()
    fixDef.density = Constants.body.density
    fixDef.restitution = Constants.body.restitution
    fixDef.friction = Constants.body.friction
    fixDef.isSensor = !Constants.body.collisions
    fixDef.filter.groupIndex = -1

    Physics.create_shape(fixDef, Constants.body.shape, this.mirror === -1)

    // Create body
    const bodyDef = new b2BodyDef()

    // Assign body position
    bodyDef.position.x =
      this.player_start.x + this.mirror * Constants.body.position.x
    bodyDef.position.y = this.player_start.y + Constants.body.position.y

    bodyDef.userData = {
      name: 'moto',
      type: this.ghost ? 'ghost' : 'player',
      moto: this,
    }

    bodyDef.type = b2Body.b2_dynamicBody

    // Assign fixture to body and add body to 2D world
    const body = this.world.CreateBody(bodyDef)
    body.CreateFixture(fixDef)

    return body
  }

  create_wheel(part_constants) {
    // Create fixture
    const fixDef = new b2FixtureDef()

    fixDef.shape = new b2CircleShape(part_constants.radius)
    fixDef.density = part_constants.density
    fixDef.restitution = part_constants.restitution
    fixDef.friction = part_constants.friction
    fixDef.isSensor = !part_constants.collisions
    fixDef.filter.groupIndex = -1

    // Create body
    const bodyDef = new b2BodyDef()

    // Assign body position
    bodyDef.position.x =
      this.player_start.x + this.mirror * part_constants.position.x
    bodyDef.position.y = this.player_start.y + part_constants.position.y

    bodyDef.userData = {
      name: 'moto',
      type: this.ghost ? 'ghost' : 'player',
      moto: this,
    }

    bodyDef.type = b2Body.b2_dynamicBody

    // Assign fixture to body and add body to 2D world
    const wheel = this.world.CreateBody(bodyDef)
    wheel.CreateFixture(fixDef)

    return wheel
  }

  create_axle(part_constants) {
    // Create fixture
    const fixDef = new b2FixtureDef()

    fixDef.shape = new b2PolygonShape()
    fixDef.density = part_constants.density
    fixDef.restitution = part_constants.restitution
    fixDef.friction = part_constants.friction
    fixDef.isSensor = !part_constants.collisions
    fixDef.filter.groupIndex = -1

    Physics.create_shape(fixDef, part_constants.shape, this.mirror === -1)

    // Create body
    const bodyDef = new b2BodyDef()

    // Assign body position
    bodyDef.position.x =
      this.player_start.x + this.mirror * part_constants.position.x
    bodyDef.position.y = this.player_start.y + part_constants.position.y

    bodyDef.userData = {
      name: 'moto',
      type: this.ghost ? 'ghost' : 'player',
      moto: this,
    }

    bodyDef.type = b2Body.b2_dynamicBody

    // Assign fixture to body and add body to 2D world
    const body = this.world.CreateBody(bodyDef)
    body.CreateFixture(fixDef)

    return body
  }

  create_revolute_joint(axle, wheel) {
    const jointDef = new b2RevoluteJointDef()
    jointDef.Initialize(axle, wheel, wheel.GetWorldCenter())
    return this.world.CreateJoint(jointDef)
  }

  create_prismatic_joint(axle, part_constants) {
    const jointDef = new b2PrismaticJointDef()
    const angle = part_constants.angle
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
    this.aabb = this.compute_aabb()

    if (!Constants.debug_physics) {
      const visible = this.visible()

      this.update_wheel(this.left_wheel, Constants.left_wheel, visible)
      this.update_wheel(this.right_wheel, Constants.right_wheel, visible)
      this.update_left_axle(this.left_axle, Constants.left_axle, visible)
      this.update_right_axle(this.right_axle, Constants.right_axle, visible)
      this.update_body(this.body, Constants.body, visible)

      this.rider.update(visible)
    }
  }

  update_wheel(part, part_constants, visible) {
    let wheel_sprite
    if (part_constants.position.x < 0) {
      wheel_sprite = this.left_wheel_sprite
    } else {
      wheel_sprite = this.right_wheel_sprite
    }

    wheel_sprite.visible = visible

    if (visible) {
      const position = part.GetPosition()
      const angle = part.GetAngle()

      wheel_sprite.width = 2 * part_constants.radius
      wheel_sprite.height = 2 * part_constants.radius
      wheel_sprite.anchor.x = 0.5
      wheel_sprite.anchor.y = 0.5
      wheel_sprite.x = position.x
      wheel_sprite.y = -position.y
      wheel_sprite.rotation = -angle
      wheel_sprite.scale.x = this.mirror * Math.abs(wheel_sprite.scale.x)
    }
  }

  update_body(part, part_constants, visible) {
    this.body_sprite.visible = visible

    if (visible) {
      const position = part.GetPosition()
      const angle = part.GetAngle()

      this.body_sprite.width = part_constants.texture_size.x
      this.body_sprite.height = part_constants.texture_size.y
      this.body_sprite.anchor.x = 0.5
      this.body_sprite.anchor.y = 0.5
      this.body_sprite.x = position.x
      this.body_sprite.y = -position.y
      this.body_sprite.rotation = -angle
      this.body_sprite.scale.x =
        this.mirror * Math.abs(this.body_sprite.scale.x)
    }
  }

  update_left_axle(part, part_constants, visible) {
    const axle_thickness = 0.09

    let wheel_position = this.left_wheel.GetPosition()
    wheel_position = {
      x: wheel_position.x - (this.mirror * axle_thickness) / 2.0,
      y: wheel_position.y - 0.025,
    }

    // Position relative to center of body
    const axle_position = {
      x: -0.17 * this.mirror,
      y: -0.3,
    }

    const texture = this.ghost
      ? part_constants.ghost_texture
      : part_constants.texture

    this.update_axle_common(
      wheel_position,
      axle_position,
      axle_thickness,
      texture,
      'left',
      visible
    )
  }

  update_right_axle(part, part_constants, visible) {
    const axle_thickness = 0.07
    let wheel_position = this.right_wheel.GetPosition()
    wheel_position = {
      x:
        wheel_position.x +
        (this.mirror * axle_thickness) / 2.0 -
        this.mirror * 0.03,
      y: wheel_position.y - 0.045,
    }

    // Position relative to center of body
    const axle_position = {
      x: 0.52 * this.mirror,
      y: 0.025,
    }

    const texture = this.ghost
      ? part_constants.ghost_texture
      : part_constants.texture
    this.update_axle_common(
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
    const axle_sprite = this[side + '_axle_sprite']
    axle_sprite.visible = visible

    if (visible) {
      const body_position = this.body.GetPosition()
      const body_angle = this.body.GetAngle()

      // Adjusted position depending of rotation of body
      const axle_adjusted_position = Math2D.rotate_point(
        axle_position,
        body_angle,
        body_position
      )

      // Distance
      const distance = Math2D.distance_between_points(
        wheel_position,
        axle_adjusted_position
      )

      // Angle
      const angle =
        Math2D.angle_between_points(axle_adjusted_position, wheel_position) +
        (this.mirror * Math.PI) / 2

      axle_sprite.width = distance
      axle_sprite.height = axle_thickness
      axle_sprite.anchor.x = 0.0
      axle_sprite.anchor.y = 0.5
      axle_sprite.x = wheel_position.x
      axle_sprite.y = -wheel_position.y
      axle_sprite.rotation = -angle
      axle_sprite.scale.x = this.mirror * Math.abs(axle_sprite.scale.x)
    }
  }

  // estimation of aabb of moto + rider (based on wheels and head)
  compute_aabb() {
    // lower position of wheels or head (in case or looping)
    const lower1 = this.left_wheel.GetFixtureList().GetAABB().lowerBound
    const lower2 = this.right_wheel.GetFixtureList().GetAABB().lowerBound
    const lower3 = this.rider.head.GetFixtureList().GetAABB().lowerBound

    // upper position of wheels or head (in case or looping)
    const upper1 = this.left_wheel.GetFixtureList().GetAABB().upperBound
    const upper2 = this.right_wheel.GetFixtureList().GetAABB().upperBound
    const upper3 = this.rider.head.GetFixtureList().GetAABB().upperBound

    const aabb = new b2AABB()
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
