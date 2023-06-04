import Constants from './constants.js'
import Level from './level.js'
import { World } from './temporaryTypes.js'
import Assets from './utils/assets.js'

class Listeners {
  level: Level
  assets: Assets
  world: World

  constructor(level) {
    this.level = level
    this.assets = level.assets
    this.world = level.physics.world
  }

  active_moto() {
    if (this.level.options.playable) {
      return this.level.moto
    } else {
      return this.level.ghosts.player.moto
    }
  }

  init() {
    // Add listeners for end of level
    // @ts-ignore
    const listener = new Box2D.Dynamics.b2ContactListener()

    listener.BeginContact = (contact) => {
      const moto = this.active_moto()

      const a = contact.GetFixtureA().GetBody().GetUserData()
      const b = contact.GetFixtureB().GetBody().GetUserData()

      if (!moto.dead) {
        // Strawberries
        if (Listeners.does_contact_moto_rider(a, b, 'strawberry')) {
          const strawberry =
            a.name === 'strawberry'
              ? contact.GetFixtureA()
              : contact.GetFixtureB()

          const entity = strawberry.GetBody().GetUserData().entity
          if (entity.display) {
            return (entity.display = false)
            // createjs.Sound.play('PickUpStrawberry')
          }

          // End of level
        } else if (
          Listeners.does_contact_moto_rider(a, b, 'end_of_level') &&
          !this.level.need_to_restart
        ) {
          if (this.level.got_strawberries()) {
            let moto
            if (a.name === 'rider' || b.name === 'rider') {
              moto = a.name === 'rider' ? a.rider.moto : b.rider.moto
            } else {
              moto = a.name === 'moto' ? a.moto : b.moto
            }

            this.trigger_restart(moto)
          }

          //  Fall of rider
        } else if (
          Constants.hooking === false &&
          Listeners.does_contact(a, b, 'rider', 'ground') &&
          a.part !== 'lower_leg' &&
          b.part !== 'lower_leg'
        ) {
          const moto = a.name === 'rider' ? a.rider.moto : b.rider.moto
          return this.kill_moto(moto)

          // Ground
        } else if (
          Constants.hooking === true &&
          Listeners.does_contact(a, b, 'rider', 'ground') &&
          (a.part === 'head' || b.part === 'head')
        ) {
          const moto = a.name === 'rider' ? a.rider.moto : b.rider.moto
          this.kill_moto(moto)

          // Wrecker contact
        } else if (Listeners.does_contact_moto_rider(a, b, 'wrecker')) {
          let moto
          if (a.name === 'rider' || b.name === 'rider') {
            moto = a.name === 'rider' ? a.rider.moto : b.rider.moto
          } else {
            moto = a.name === 'moto' ? a.moto : b.moto
          }
          this.kill_moto(moto)
        }
      }
    }

    this.world.SetContactListener(listener)
  }

  static does_contact_moto_rider(a, b, obj) {
    const collision =
      Listeners.does_contact(a, b, obj, 'rider') ||
      Listeners.does_contact(a, b, obj, 'moto')
    const player = a.type === 'player' || b.type === 'player'
    return collision && player
  }

  static does_contact(a, b, obj1, obj2) {
    return (
      (a.name === obj1 && b.name === obj2) ||
      (a.name === obj2 && b.name === obj1)
    )
  }

  trigger_restart(moto) {
    // createjs.Sound.play('EndOfLevel')
    if (moto.ghost) {
      moto.dead = true
    } else {
      this.level.replay.success = true
      this.level.need_to_restart = true
    }
  }

  kill_moto(moto) {
    if (!moto.dead) {
      moto.dead = true

      // Cause the game to "hard" crash because reactivation of collisions when in the middle of it
      // this.level.moto.rider.torso.GetFixtureList().SetSensor(false)
      // this.level.moto.rider.lower_leg.GetFixtureList().SetSensor(false)
      // this.level.moto.rider.upper_leg.GetFixtureList().SetSensor(false)
      // this.level.moto.rider.lower_arm.GetFixtureList().SetSensor(false)
      // this.level.moto.rider.upper_arm.GetFixtureList().SetSensor(false)
      // this.level.moto.body.GetFixtureList().SetSensor(false)
      // this.level.moto.left_axle.GetFixtureList().SetSensor(false)
      // this.level.moto.right_axle.GetFixtureList().SetSensor(false)

      // createjs.Sound.play('Headcrash')

      this.world.DestroyJoint(moto.rider.ankle_joint)
      this.world.DestroyJoint(moto.rider.wrist_joint)
      moto.rider.shoulder_joint.m_enableLimit = false

      moto.rider.knee_joint.m_lowerAngle =
        moto.rider.knee_joint.m_lowerAngle * 3
      moto.rider.elbow_joint.m_upperAngle =
        moto.rider.elbow_joint.m_upperAngle * 3
      moto.rider.hip_joint.m_lowerAngle = moto.rider.hip_joint.m_lowerAngle * 3
    }
  }
}

export default Listeners
