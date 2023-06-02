import Constants from '../constants.js'

class Particles {
  level: any
  physics: any
  world: any
  list: any[]

  constructor(level, replay?) {
    this.level = level
    this.physics = level.physics
    this.world = this.physics.world
    this.list = []
  }

  create() {
    var bodyDef, fixDef, particle
    // @ts-ignore
    fixDef = new b2FixtureDef()
    // @ts-ignore
    fixDef.shape = new b2CircleShape(0.04)
    fixDef.density = 1.0
    fixDef.restitution = 0.5
    fixDef.friction = 1.0
    fixDef.isSensor = false
    fixDef.filter.groupIndex = -1
    // @ts-ignore
    bodyDef = new b2BodyDef()
    bodyDef.position.x = this.level.moto.left_wheel.GetPosition().x
    bodyDef.position.y =
      this.level.moto.left_wheel.GetPosition().y - Constants.left_wheel.radius
    bodyDef.userData = {
      name: 'particle',
    }
    // @ts-ignore
    bodyDef.type = b2Body.b2_dynamicBody
    particle = this.world.CreateBody(bodyDef)
    particle.CreateFixture(fixDef)
    particle.ApplyForce(
      {
        x: -1,
        y: -1,
      },
      particle.GetWorldCenter()
    )
    return this.list.push(particle)
  }

  update() {
    var ctx, i, len, particle, position, ref, results
    ctx = this.level.ctx
    ref = this.list
    results = []
    for (i = 0, len = ref.length; i < len; i++) {
      particle = ref[i]
      position = particle.GetPosition()
      ctx.save()
      ctx.translate(position.x, position.y)
      ctx.beginPath()
      ctx.arc(0, 0, 0.04, 0, 2 * Math.PI)
      ctx.fill()
      results.push(ctx.restore())
    }
    return results
  }
}

export default Particles
