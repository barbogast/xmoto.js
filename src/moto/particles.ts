import Constants from '../constants.js'
import Level from '../level.js'
import Physics from '../physics.js'
import { Block2D, World } from '../temporaryTypes.js'

class Particles {
  level: Level
  physics: Physics
  world: World
  list: Block2D[]

  constructor(level: Level) {
    this.level = level
    this.physics = level.physics
    this.world = this.physics.world
    this.list = []
  }

  create() {
    // Create fixture
    // @ts-ignore
    const fixDef = new b2FixtureDef()

    // @ts-ignore
    fixDef.shape = new b2CircleShape(0.04)
    fixDef.density = 1.0
    fixDef.restitution = 0.5
    fixDef.friction = 1.0
    fixDef.isSensor = false
    fixDef.filter.groupIndex = -1

    // Create body
    // @ts-ignore
    const bodyDef = new b2BodyDef()

    // Assign body position
    bodyDef.position.x = this.level.moto.left_wheel.GetPosition().x
    bodyDef.position.y =
      this.level.moto.left_wheel.GetPosition().y - Constants.left_wheel.radius

    bodyDef.userData = {
      name: 'particle',
    }

    // @ts-ignore
    bodyDef.type = b2Body.b2_dynamicBody

    // Assign fixture to body and add body to 2D world
    const particle = this.world.CreateBody(bodyDef)
    particle.CreateFixture(fixDef)

    particle.ApplyForce({ x: -1, y: -1 }, particle.GetWorldCenter())

    this.list.push(particle)
  }

  update() {
    const ctx = this.level.debug_ctx

    for (const particle of this.list) {
      const position = particle.GetPosition()

      ctx.save()
      ctx.translate(position.x, position.y)

      ctx.beginPath()
      ctx.arc(0, 0, 0.04, 0, 2 * Math.PI)
      ctx.fill()

      ctx.restore()
    }
  }
}

export default Particles
