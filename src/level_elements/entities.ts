import $ from 'jquery'

import Constants from '../constants.js'
import Level from '../level.js'
import Assets from '../utils/assets.js'
import { Block2D, Pixi, World } from '../temporaryTypes.js'

type Params = {
  z?: string
  name?: string
}

export type Entity = {
  id: string
  type_id: string
  size: {
    r: number
    z: number | undefined
    width: number
    height: number
  }
  position: {
    x: number
    y: number
    angle: number
  }
  params: Params
  z: number

  file?: string
  file_base?: string
  file_ext?: string

  center?: { x: number; y: number }

  delay?: number
  frames?: number
  display?: boolean
  aabb?: Block2D

  sprite?: Pixi
}

export type PlayerStart = { x: number; y: number }

// @ts-ignore
const b2FixtureDef = Box2D.Dynamics.b2FixtureDef
// @ts-ignore
const b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
// @ts-ignore
const b2Body = Box2D.Dynamics.b2Body.b2_staticBody
// @ts-ignore
const b2BodyDef = Box2D.Dynamics.b2BodyDef
// @ts-ignore
const b2AABB = Box2D.Collision.b2AABB

class Entities {
  level: Level
  assets: Assets
  world: World
  list: Entity[]
  strawberries: Entity[]
  wreckers: Entity[]
  end_of_level?: Entity
  player_start?: PlayerStart

  constructor(level: Level) {
    this.level = level
    this.assets = level.assets
    this.world = level.physics.world
    this.list = []
    this.strawberries = []
    this.wreckers = []
  }

  parse(xml: string) {
    const xml_entities = $(xml).find('entity')

    //  parse entity xml
    for (const xml_entity of xml_entities) {
      // parse params xml
      const xml_params = $(xml_entity).find('param')
      const params: Params = {}
      for (const xml_param of xml_params) {
        const name = $(xml_param).attr('name') as keyof Params
        const value = $(xml_param).attr('value')
        params[name] = value
      }

      const size = {
        r: parseFloat($(xml_entity).find('size').attr('r')!),
        z: parseInt($(xml_entity).find('size').attr('z')!) || void 0,
        width: parseFloat($(xml_entity).find('size').attr('width')!),
        height: parseFloat($(xml_entity).find('size').attr('height')!),
      }

      const entity: Entity = {
        id: $(xml_entity).attr('id')!,
        type_id: $(xml_entity).attr('typeid')!,
        size,
        position: {
          x: parseFloat($(xml_entity).find('position').attr('x')!),
          y: parseFloat($(xml_entity).find('position').attr('y')!),
          angle: parseFloat($(xml_entity).find('position').attr('angle')!) || 0,
        },
        params,

        // find correct z (z can be in <size z="?"> or in <param name="z" value="?">)
        z: size.z || parseInt(params.z) || 0,
      }

      // Get default values for sprite from theme
      const texture_name = this.entity_texture_name(entity)
      if (texture_name) {
        const sprite = this.assets.theme.sprite_params(texture_name)

        entity.file = sprite.file
        entity.file_base = sprite.file_base
        entity.file_ext = sprite.file_ext
        if (!entity.size.width) {
          entity.size.width = sprite.size.width
        }
        if (!entity.size.height) {
          entity.size.height = sprite.size.height
        }
        entity.center = {
          x: sprite.center.x,
          y: sprite.center.y,
        }
        if (!entity.center.x) {
          entity.center.x = entity.size.width / 2
        }
        if (!entity.center.y) {
          entity.center.y = entity.size.height / 2
        }
        if (!entity.size.width) {
          entity.size.width = 2 * entity.size.r
        }
        if (!entity.size.height) {
          entity.size.height = 2 * entity.size.r
        }
        if (!entity.center.x) {
          entity.center.x = entity.size.r
        }
        if (!entity.center.y) {
          entity.center.y = entity.size.r
        }
        entity.delay = sprite.delay
        entity.frames = sprite.frames
        entity.display = true
        entity.aabb = this.compute_aabb(entity)
      }
      this.list.push(entity)
    }
    this.list.sort(function (a, b) {
      if (a.z > b.z) {
        return 1
      }
      if (a.z < b.z) {
        return -1
      }
      return 0
    })
    return this
  }

  load_assets() {
    for (const entity of this.list) {
      if (entity.display) {
        if (entity.frames === 0) {
          this.assets.anims.push(entity.file)
        } else {
          for (let i = 0; i <= entity.frames - 1; i++) {
            this.assets.anims.push(this.frame_name(entity, i))
          }
        }
      }
    }
  }

  init() {
    this.init_physics_parts()
    this.init_sprites()
  }

  init_physics_parts() {
    for (const entity of this.list) {
      // End of level
      if (entity.type_id === 'EndOfLevel') {
        this.create_entity(entity, 'end_of_level')
        this.end_of_level = entity

        // Strawberries
      } else if (entity.type_id === 'Strawberry') {
        this.create_entity(entity, 'strawberry')
        this.strawberries.push(entity)

        // Wrecker
      } else if (entity.type_id === 'Wrecker') {
        this.create_entity(entity, 'wrecker')
        this.wreckers.push(entity)

        // Player start
      } else if (entity.type_id === 'PlayerStart') {
        this.player_start = {
          x: entity.position.x,
          y: entity.position.y,
        }
      }
    }
  }

  init_sprites() {
    for (const entity of this.list) {
      if (entity.z < 0) {
        this.init_entity(entity, this.level.camera.negative_z_container)
      } else if (entity.z > 0) {
        this.init_entity(entity, this.level.camera.positive_z_container)
      } else if (entity.z === 0) {
        this.init_entity(entity, this.level.camera.neutral_z_container)
      }
    }
  }

  init_entity(entity: Entity, container) {
    if (entity.frames > 0) {
      const textures = []
      for (let i = 0; i <= entity.frames - 1; i++) {
        textures.push(
          // @ts-ignore
          PIXI.Texture.from(this.assets.get_url(this.frame_name(entity, i)))
        )
      }

      // @ts-ignore
      entity.sprite = new PIXI.AnimatedSprite(textures)
      entity.sprite.animationSpeed = 0.5 - 0.5 * entity.delay
      entity.sprite.play()
      container.addChild(entity.sprite)
    } else if (entity.file) {
      // @ts-ignore
      entity.sprite = new PIXI.Sprite.from(this.assets.get_url(entity.file))
      container.addChild(entity.sprite)
    }

    if (entity.sprite) {
      entity.sprite.width = entity.size.width
      entity.sprite.height = entity.size.height
      entity.sprite.anchor.x = entity.center.x / entity.size.width
      entity.sprite.anchor.y = 1 - entity.center.y / entity.size.height
      entity.sprite.x = entity.position.x
      entity.sprite.y = -entity.position.y
      entity.sprite.rotation = -entity.position.angle
    }
  }

  create_entity(entity: Entity, name: string) {
    // Create fixture
    const fixDef = new b2FixtureDef()
    fixDef.shape = new b2CircleShape(entity.size.r)
    fixDef.isSensor = true

    // Create body
    const bodyDef = new b2BodyDef()

    // Assign body position
    bodyDef.position.x = entity.position.x
    bodyDef.position.y = entity.position.y

    bodyDef.userData = {
      name: name,
      entity: entity,
    }

    bodyDef.type = b2Body.b2_staticBody

    // Assign fixture to body and add body to 2D world
    const body = this.world.CreateBody(bodyDef)
    body.CreateFixture(fixDef)

    return body
  }

  update() {
    if (!Constants.debug_physics) {
      for (const entity of this.list) {
        if (entity.sprite) {
          entity.sprite.visible = this.visible(entity)
        }
      }
    }
  }

  entity_texture_name(entity: Entity) {
    if (entity.type_id === 'Sprite') {
      return entity.params.name
    } else if (entity.type_id === 'EndOfLevel') {
      return 'Flower'
    } else if (
      entity.type_id === 'Strawberry' ||
      entity.type_id === 'Wrecker'
    ) {
      return entity.type_id
    }
  }

  compute_aabb(entity: Entity) {
    const lower_bound = {
      x: entity.position.x - entity.size.width + entity.center.x,
      y: entity.position.y - entity.center.y,
    }

    const upper_bound = {
      x: lower_bound.x + entity.size.width,
      y: lower_bound.y + entity.size.height,
    }

    const aabb = new b2AABB()
    aabb.lowerBound.Set(lower_bound.x, lower_bound.y)
    aabb.upperBound.Set(upper_bound.x, upper_bound.y)

    return aabb
  }

  visible(entity: Entity) {
    return entity.aabb.TestOverlap(this.level.camera.aabb) && entity.display
  }

  frame_name(entity: Entity, frame_number: number) {
    return `${entity.file_base}${(frame_number / 100.0)
      .toFixed(2)
      .toString()
      .substring(2)}.${entity.file_ext}`
  }
}

export default Entities
