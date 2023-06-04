import Constants from '../constants.js'
import Level from '../level.js'
import { PlayerStart } from '../level_elements/entities.js'
import Physics from '../physics.js'
import { Block2D } from '../temporaryTypes.js'
import Assets from '../utils/assets.js'
import * as Math2D from '../utils/math2d.js'
import Ghost from './ghost.js'
import Moto from './moto.js'

var b2Body,
  b2BodyDef,
  b2CircleShape,
  b2FixtureDef,
  b2PolygonShape,
  b2RevoluteJointDef

// @ts-ignore
b2BodyDef = Box2D.Dynamics.b2BodyDef
// @ts-ignore
b2Body = Box2D.Dynamics.b2Body
// @ts-ignore
b2FixtureDef = Box2D.Dynamics.b2FixtureDef
// @ts-ignore
b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
// @ts-ignore
b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
// @ts-ignore
b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef

class Rider {
  level: Level
  assets: Assets
  world: any
  moto: Moto
  mirror: number
  ghost: Ghost
  player_start: PlayerStart
  neck_joint: Block2D
  ankle_joint: Block2D
  wrist_joint: Block2D
  knee_joint: Block2D
  elbow_joint: Block2D
  shoulder_joint: Block2D
  hip_joint: Block2D
  head: Block2D
  torso: Block2D
  lower_leg: Block2D
  upper_leg: Block2D
  lower_arm: Block2D
  upper_arm: Block2D
  head_sprite: Block2D
  torso_sprite: Block2D
  lower_leg_sprite: Block2D
  upper_leg_sprite: Block2D
  lower_arm_sprite: Block2D
  upper_arm_sprite: Block2D

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
    this.level.camera.neutral_z_container.removeChild(this.upper_arm_sprite)
  }

  load_assets() {
    const parts = [
      Constants.torso,
      Constants.upper_leg,
      Constants.lower_leg,
      Constants.upper_arm,
      Constants.lower_arm,
    ]
    for (const part of parts) {
      if (this.ghost) {
        this.assets.moto.push(part.ghost_texture)
      } else {
        this.assets.moto.push(part.texture)
      }
    }
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
    const parts = ['torso', 'upper_leg', 'lower_leg', 'upper_arm', 'lower_arm']
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
  }

  position() {
    return this.moto.body.GetPosition()
  }

  eject() {
    if (!this.moto.dead) {
      this.level.listeners.kill_moto(this.moto)

      const force_vector = { x: 150.0 * this.moto.mirror, y: 0 }
      const eject_angle =
        this.mirror * this.moto.body.GetAngle() + Math.PI / 4.0
      const adjusted_force_vector = Math2D.rotate_point(
        force_vector,
        eject_angle,
        { x: 0, y: 0 }
      )
      this.torso.ApplyForce(adjusted_force_vector, this.torso.GetWorldCenter())
    }
  }

  create_head() {
    // Create fixture
    const fixDef = new b2FixtureDef()

    fixDef.shape = new b2CircleShape(Constants.head.radius)
    fixDef.density = Constants.head.density
    fixDef.restitution = Constants.head.restitution
    fixDef.friction = Constants.head.friction
    fixDef.isSensor = !Constants.head.collisions
    fixDef.filter.groupIndex = -1

    // Create body
    const bodyDef = new b2BodyDef()

    // Assign body position
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

    // Assign fixture to body and add body to 2D world
    const body = this.world.CreateBody(bodyDef)
    body.CreateFixture(fixDef)

    return body
  }

  create_part(part_constants, name) {
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

    // Assign body angle
    bodyDef.angle = this.mirror * part_constants.angle

    bodyDef.userData = {
      name: 'rider',
      type: this.ghost ? 'ghost' : 'player',
      part: name,
      rider: this,
    }

    bodyDef.type = b2Body.b2_dynamicBody

    // Assign fixture to body and add body to 2D world
    const body = this.world.CreateBody(bodyDef)
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
    joint.enableLimit = true
  }

  create_neck_joint() {
    const position = this.head.GetWorldCenter()
    const axe = {
      x: position.x,
      y: position.y,
    }

    const jointDef = new b2RevoluteJointDef()
    jointDef.Initialize(this.head, this.torso, axe)
    return this.world.CreateJoint(jointDef)
  }

  create_joint(joint_constants, part1, part2, invert_joint = false) {
    const position = part1.GetWorldCenter()
    const axe = {
      x: position.x + this.mirror * joint_constants.axe_position.x,
      y: position.y + joint_constants.axe_position.y,
    }

    const jointDef = new b2RevoluteJointDef()
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
      this.update_part(this.lower_arm, 'lower_arm', visible)
    }
  }

  update_part(part, name, visible) {
    const sprite = this[name + '_sprite']
    sprite.visible = visible

    if (visible) {
      const part_constants = Constants[name]

      const position = part.GetPosition()
      const angle = part.GetAngle()

      sprite.width = part_constants.texture_size.x
      sprite.height = part_constants.texture_size.y
      sprite.anchor.x = 0.5
      sprite.anchor.y = 0.5
      sprite.x = position.x
      sprite.y = -position.y
      sprite.rotation = -angle
      sprite.scale.x = this.mirror * Math.abs(sprite.scale.x)
    }
  }
}

export default Rider
