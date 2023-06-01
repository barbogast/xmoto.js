var Listeners

Listeners = (function () {
  function Listeners(level) {
    this.level = level
    this.assets = level.assets
    this.world = level.physics.world
  }

  Listeners.prototype.active_moto = function () {
    if (this.level.options.playable) {
      return this.level.moto
    } else {
      return this.level.ghosts.player.moto
    }
  }

  Listeners.prototype.init = function () {
    var listener
    listener = new Box2D.Dynamics.b2ContactListener()
    listener.BeginContact = (function (_this) {
      return function (contact) {
        var a, b, entity, moto, strawberry
        moto = _this.active_moto()
        a = contact.GetFixtureA().GetBody().GetUserData()
        b = contact.GetFixtureB().GetBody().GetUserData()
        if (!moto.dead) {
          if (Listeners.does_contact_moto_rider(a, b, 'strawberry')) {
            strawberry =
              a.name === 'strawberry'
                ? contact.GetFixtureA()
                : contact.GetFixtureB()
            entity = strawberry.GetBody().GetUserData().entity
            if (entity.display) {
              return (entity.display = false)
            }
          } else if (
            Listeners.does_contact_moto_rider(a, b, 'end_of_level') &&
            !_this.level.need_to_restart
          ) {
            if (_this.level.got_strawberries()) {
              if (a.name === 'rider' || b.name === 'rider') {
                moto = a.name === 'rider' ? a.rider.moto : b.rider.moto
              } else {
                moto = a.name === 'moto' ? a.moto : b.moto
              }
              return _this.trigger_restart(moto)
            }
          } else if (
            Constants.hooking === false &&
            Listeners.does_contact(a, b, 'rider', 'ground') &&
            a.part !== 'lower_leg' &&
            b.part !== 'lower_leg'
          ) {
            moto = a.name === 'rider' ? a.rider.moto : b.rider.moto
            return _this.kill_moto(moto)
          } else if (
            Constants.hooking === true &&
            Listeners.does_contact(a, b, 'rider', 'ground') &&
            (a.part === 'head' || b.part === 'head')
          ) {
            moto = a.name === 'rider' ? a.rider.moto : b.rider.moto
            return _this.kill_moto(moto)
          } else if (Listeners.does_contact_moto_rider(a, b, 'wrecker')) {
            if (a.name === 'rider' || b.name === 'rider') {
              moto = a.name === 'rider' ? a.rider.moto : b.rider.moto
            } else {
              moto = a.name === 'moto' ? a.moto : b.moto
            }
            return _this.kill_moto(moto)
          }
        }
      }
    })(this)
    return this.world.SetContactListener(listener)
  }

  Listeners.does_contact_moto_rider = function (a, b, obj) {
    var collision, player
    collision =
      Listeners.does_contact(a, b, obj, 'rider') ||
      Listeners.does_contact(a, b, obj, 'moto')
    player = a.type === 'player' || b.type === 'player'
    return collision && player
  }

  Listeners.does_contact = function (a, b, obj1, obj2) {
    return (
      (a.name === obj1 && b.name === obj2) ||
      (a.name === obj2 && b.name === obj1)
    )
  }

  Listeners.prototype.trigger_restart = function (moto) {
    if (moto.ghost) {
      return (moto.dead = true)
    } else {
      this.level.replay.success = true
      return (this.level.need_to_restart = true)
    }
  }

  Listeners.prototype.kill_moto = function (moto) {
    if (!moto.dead) {
      moto.dead = true
      this.world.DestroyJoint(moto.rider.ankle_joint)
      this.world.DestroyJoint(moto.rider.wrist_joint)
      moto.rider.shoulder_joint.m_enableLimit = false
      moto.rider.knee_joint.m_lowerAngle =
        moto.rider.knee_joint.m_lowerAngle * 3
      moto.rider.elbow_joint.m_upperAngle =
        moto.rider.elbow_joint.m_upperAngle * 3
      return (moto.rider.hip_joint.m_lowerAngle =
        moto.rider.hip_joint.m_lowerAngle * 3)
    }
  }

  return Listeners
})()
