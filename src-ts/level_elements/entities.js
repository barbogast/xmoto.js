var Entities, b2FixtureDef

b2FixtureDef = Box2D.Dynamics.b2FixtureDef

Entities = (function () {
  function Entities(level) {
    this.level = level
    this.assets = level.assets
    this.world = level.physics.world
    this.list = []
    this.strawberries = []
    this.wreckers = []
  }

  Entities.prototype.parse = function (xml) {
    var entity,
      j,
      k,
      len,
      len1,
      name,
      sprite,
      texture_name,
      value,
      xml_entities,
      xml_entity,
      xml_param,
      xml_params
    xml_entities = $(xml).find('entity')
    for (j = 0, len = xml_entities.length; j < len; j++) {
      xml_entity = xml_entities[j]
      entity = {
        id: $(xml_entity).attr('id'),
        type_id: $(xml_entity).attr('typeid'),
        size: {
          r: parseFloat($(xml_entity).find('size').attr('r')),
          z: parseInt($(xml_entity).find('size').attr('z')) || void 0,
          width: parseFloat($(xml_entity).find('size').attr('width')),
          height: parseFloat($(xml_entity).find('size').attr('height')),
        },
        position: {
          x: parseFloat($(xml_entity).find('position').attr('x')),
          y: parseFloat($(xml_entity).find('position').attr('y')),
          angle: parseFloat($(xml_entity).find('position').attr('angle')) || 0,
        },
        params: {},
      }
      xml_params = $(xml_entity).find('param')
      for (k = 0, len1 = xml_params.length; k < len1; k++) {
        xml_param = xml_params[k]
        name = $(xml_param).attr('name')
        value = $(xml_param).attr('value')
        entity.params[name] = value
      }
      entity['z'] = entity.size.z || parseInt(entity.params.z) || 0
      texture_name = this.entity_texture_name(entity)
      if (texture_name) {
        sprite = this.assets.theme.sprite_params(texture_name)
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

  Entities.prototype.load_assets = function () {
    var entity, i, j, len, ref, results
    ref = this.list
    results = []
    for (j = 0, len = ref.length; j < len; j++) {
      entity = ref[j]
      if (entity.display) {
        if (entity.frames === 0) {
          results.push(this.assets.anims.push(entity.file))
        } else {
          results.push(
            function () {
              var k, ref1, results1
              results1 = []
              for (
                i = k = 0, ref1 = entity.frames - 1;
                0 <= ref1 ? k <= ref1 : k >= ref1;
                i = 0 <= ref1 ? ++k : --k
              ) {
                results1.push(
                  this.assets.anims.push(this.frame_name(entity, i))
                )
              }
              return results1
            }.call(this)
          )
        }
      } else {
        results.push(void 0)
      }
    }
    return results
  }

  Entities.prototype.init = function () {
    this.init_physics_parts()
    return this.init_sprites()
  }

  Entities.prototype.init_physics_parts = function () {
    var entity, j, len, ref, results
    ref = this.list
    results = []
    for (j = 0, len = ref.length; j < len; j++) {
      entity = ref[j]
      if (entity.type_id === 'EndOfLevel') {
        this.create_entity(entity, 'end_of_level')
        results.push((this.end_of_level = entity))
      } else if (entity.type_id === 'Strawberry') {
        this.create_entity(entity, 'strawberry')
        results.push(this.strawberries.push(entity))
      } else if (entity.type_id === 'Wrecker') {
        this.create_entity(entity, 'wrecker')
        results.push(this.wreckers.push(entity))
      } else if (entity.type_id === 'PlayerStart') {
        results.push(
          (this.player_start = {
            x: entity.position.x,
            y: entity.position.y,
          })
        )
      } else {
        results.push(void 0)
      }
    }
    return results
  }

  Entities.prototype.init_sprites = function () {
    var entity, j, len, ref, results
    ref = this.list
    results = []
    for (j = 0, len = ref.length; j < len; j++) {
      entity = ref[j]
      if (entity.z < 0) {
        results.push(
          this.init_entity(entity, this.level.camera.negative_z_container)
        )
      } else if (entity.z > 0) {
        results.push(
          this.init_entity(entity, this.level.camera.positive_z_container)
        )
      } else if (entity.z === 0) {
        results.push(
          this.init_entity(entity, this.level.camera.neutral_z_container)
        )
      } else {
        results.push(void 0)
      }
    }
    return results
  }

  Entities.prototype.init_entity = function (entity, container) {
    var i, j, ref, textures
    if (entity.frames > 0) {
      textures = []
      for (
        i = j = 0, ref = entity.frames - 1;
        0 <= ref ? j <= ref : j >= ref;
        i = 0 <= ref ? ++j : --j
      ) {
        textures.push(
          PIXI.Texture.from(this.assets.get_url(this.frame_name(entity, i)))
        )
      }
      entity.sprite = new PIXI.AnimatedSprite(textures)
      entity.sprite.animationSpeed = 0.5 - 0.5 * entity.delay
      entity.sprite.play()
      container.addChild(entity.sprite)
    } else if (entity.file) {
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
      return (entity.sprite.rotation = -entity.position.angle)
    }
  }

  Entities.prototype.create_entity = function (entity, name) {
    var body, bodyDef, fixDef
    fixDef = new b2FixtureDef()
    fixDef.shape = new b2CircleShape(entity.size.r)
    fixDef.isSensor = true
    bodyDef = new b2BodyDef()
    bodyDef.position.x = entity.position.x
    bodyDef.position.y = entity.position.y
    bodyDef.userData = {
      name: name,
      entity: entity,
    }
    bodyDef.type = b2Body.b2_staticBody
    body = this.world.CreateBody(bodyDef)
    body.CreateFixture(fixDef)
    return body
  }

  Entities.prototype.update = function (entity) {
    var j, len, ref, results
    if (!Constants.debug_physics) {
      ref = this.list
      results = []
      for (j = 0, len = ref.length; j < len; j++) {
        entity = ref[j]
        if (entity.sprite) {
          results.push((entity.sprite.visible = this.visible(entity)))
        } else {
          results.push(void 0)
        }
      }
      return results
    }
  }

  Entities.prototype.entity_texture_name = function (entity) {
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

  Entities.prototype.compute_aabb = function (entity) {
    var aabb, lower_bound, upper_bound
    lower_bound = {
      x: entity.position.x - entity.size.width + entity.center.x,
      y: entity.position.y - entity.center.y,
    }
    upper_bound = {
      x: lower_bound.x + entity.size.width,
      y: lower_bound.y + entity.size.height,
    }
    aabb = new b2AABB()
    aabb.lowerBound.Set(lower_bound.x, lower_bound.y)
    aabb.upperBound.Set(upper_bound.x, upper_bound.y)
    return aabb
  }

  Entities.prototype.visible = function (entity) {
    return entity.aabb.TestOverlap(this.level.camera.aabb) && entity.display
  }

  Entities.prototype.frame_name = function (entity, frame_number) {
    return (
      '' +
      entity.file_base +
      (frame_number / 100.0).toFixed(2).toString().substring(2) +
      '.' +
      entity.file_ext
    )
  }

  return Entities
})()
