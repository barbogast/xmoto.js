// Generated by CoffeeScript 1.6.3
(function() {
  var Assets, Blocks, Entities, Infos, LayerOffsets, Level, Limits, Moto, Physics, Script, Sky, b2AABB, b2Body, b2BodyDef, b2CircleShape, b2DebugDraw, b2Fixture, b2FixtureDef, b2MassData, b2MouseJointDef, b2PolygonShape, b2Vec2, b2World, triangulate;

  Assets = (function() {
    function Assets() {
      this.queue = new createjs.LoadQueue();
      this.textures = [];
      this.anims = [];
      this.moto = [];
    }

    Assets.prototype.load = function(callback) {
      var item, items, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
      items = [];
      _ref = this.textures;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        items.push({
          id: item,
          src: "data/Textures/Textures/" + item + ".jpg"
        });
      }
      _ref1 = this.anims;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        item = _ref1[_j];
        items.push({
          id: item,
          src: "data/Textures/Anims/" + item + ".png"
        });
      }
      _ref2 = this.moto;
      for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
        item = _ref2[_k];
        items.push({
          id: item,
          src: "data/Textures/Riders/" + item + ".png"
        });
      }
      this.queue.addEventListener("complete", callback);
      return this.queue.loadManifest(items);
    };

    Assets.prototype.get = function(name) {
      return this.queue.getResult(name);
    };

    return Assets;

  })();

  Blocks = (function() {
    function Blocks(level) {
      this.level = level;
      this.assets = level.assets;
      this.list = [];
    }

    Blocks.prototype.parse = function(xml) {
      var block, material, vertex, xml_block, xml_blocks, xml_material, xml_materials, xml_vertex, xml_vertices, _i, _j, _k, _len, _len1, _len2;
      xml_blocks = $(xml).find('block');
      this.list = [];
      for (_i = 0, _len = xml_blocks.length; _i < _len; _i++) {
        xml_block = xml_blocks[_i];
        block = {
          id: $(xml_block).attr('id'),
          position: {
            x: parseFloat($(xml_block).find('position').attr('x')),
            y: parseFloat($(xml_block).find('position').attr('y')),
            dynamic: $(xml_block).find('position').attr('dynamic'),
            background: $(xml_block).find('position').attr('background')
          },
          usetexture: {
            id: $(xml_block).find('usetexture').attr('id').toLowerCase(),
            scale: parseFloat($(xml_block).find('usetexture').attr('scale'))
          },
          physics: {
            grip: parseFloat($(xml_block).find('physics').attr('grip'))
          },
          edges: {
            angle: parseFloat($(xml_block).find('edges').attr('angle')),
            materials: []
          },
          vertices: []
        };
        xml_materials = $(xml_block).find('edges material');
        for (_j = 0, _len1 = xml_materials.length; _j < _len1; _j++) {
          xml_material = xml_materials[_j];
          material = {
            name: $(xml_material).attr('name'),
            edge: $(xml_material).attr('edge'),
            color_r: parseInt($(xml_material).attr('color_r')),
            color_g: parseInt($(xml_material).attr('color_g')),
            color_b: parseInt($(xml_material).attr('color_b')),
            color_a: parseInt($(xml_material).attr('color_a')),
            scale: parseFloat($(xml_material).attr('scale')),
            depth: parseFloat($(xml_material).attr('depth'))
          };
          block.edges.materials.push(material);
        }
        xml_vertices = $(xml_block).find('vertex');
        for (_k = 0, _len2 = xml_vertices.length; _k < _len2; _k++) {
          xml_vertex = xml_vertices[_k];
          vertex = {
            x: parseFloat($(xml_vertex).attr('x')),
            y: parseFloat($(xml_vertex).attr('y')),
            edge: $(xml_vertex).attr('edge')
          };
          block.vertices.push(vertex);
        }
        this.list.push(block);
      }
      return this;
    };

    Blocks.prototype.init = function() {
      var block, triangle, _i, _j, _len, _len1, _ref, _ref1, _results;
      _ref = this.list;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        block = _ref[_i];
        this.assets.textures.push(block.usetexture.id);
      }
      this.triangles = triangulate(this.list);
      _ref1 = this.triangles;
      _results = [];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        triangle = _ref1[_j];
        _results.push(this.level.physics.createTriangle(triangle, true, []));
      }
      return _results;
    };

    Blocks.prototype.display = function(ctx) {
      var block, i, vertex, _i, _j, _len, _len1, _ref, _ref1, _results;
      _ref = this.list;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        block = _ref[_i];
        ctx.beginPath();
        _ref1 = block.vertices;
        for (i = _j = 0, _len1 = _ref1.length; _j < _len1; i = ++_j) {
          vertex = _ref1[i];
          if (i === 0) {
            ctx.moveTo(block.position.x + vertex.x, block.position.y + vertex.y);
          } else {
            ctx.lineTo(block.position.x + vertex.x, block.position.y + vertex.y);
          }
        }
        ctx.closePath();
        ctx.save();
        ctx.scale(1.0 / this.level.scale.x, 1.0 / this.level.scale.y);
        ctx.fillStyle = ctx.createPattern(this.assets.get(block.usetexture.id), "repeat");
        ctx.fill();
        _results.push(ctx.restore());
      }
      return _results;
    };

    return Blocks;

  })();

  triangulate = function(blocks) {
    var block, set_of_triangles, triangle, triangles, triangulation, vertex, vertices, _i, _j, _k, _len, _len1, _len2, _ref;
    triangles = [];
    for (_i = 0, _len = blocks.length; _i < _len; _i++) {
      block = blocks[_i];
      vertices = [];
      _ref = block.vertices;
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        vertex = _ref[_j];
        vertices.push(new poly2tri.Point(block.position.x + vertex.x, block.position.y + vertex.y));
      }
      triangulation = new poly2tri.SweepContext(vertices, {
        cloneArrays: true
      });
      triangulation.triangulate();
      set_of_triangles = triangulation.getTriangles();
      for (_k = 0, _len2 = set_of_triangles.length; _k < _len2; _k++) {
        triangle = set_of_triangles[_k];
        triangles.push([
          {
            x: triangle.points_[0].x,
            y: triangle.points_[0].y
          }, {
            x: triangle.points_[1].x,
            y: triangle.points_[1].y
          }, {
            x: triangle.points_[2].x,
            y: triangle.points_[2].y
          }
        ]);
      }
    }
    return triangles;
  };

  Entities = (function() {
    function Entities(level) {
      this.level = level;
      this.assets = level.assets;
      this.list = [];
    }

    Entities.prototype.parse = function(xml) {
      var entity, param, xml_entities, xml_entity, xml_param, xml_params, _i, _j, _len, _len1;
      xml_entities = $(xml).find('entity');
      for (_i = 0, _len = xml_entities.length; _i < _len; _i++) {
        xml_entity = xml_entities[_i];
        entity = {
          id: $(xml_entity).attr('id'),
          type_id: $(xml_entity).attr('typeid'),
          size: {
            r: parseFloat($(xml_entity).find('size').attr('r')),
            width: parseFloat($(xml_entity).find('size').attr('width')),
            height: parseFloat($(xml_entity).find('size').attr('height'))
          },
          position: {
            x: parseFloat($(xml_entity).find('position').attr('x')),
            y: parseFloat($(xml_entity).find('position').attr('y')),
            angle: parseFloat($(xml_entity).find('position').attr('angle'))
          },
          params: []
        };
        xml_params = $(xml_entity).find('param');
        for (_j = 0, _len1 = xml_params.length; _j < _len1; _j++) {
          xml_param = xml_params[_j];
          param = {
            name: $(xml_param).attr('name'),
            value: $(xml_param).attr('value').toLowerCase()
          };
          entity.params.push(param);
        }
        this.list.push(entity);
      }
      return this;
    };

    Entities.prototype.init = function() {
      var entity, param, _i, _len, _ref, _results;
      _ref = this.list;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        entity = _ref[_i];
        if (entity.type_id === 'Sprite') {
          _results.push((function() {
            var _j, _len1, _ref1, _results1;
            _ref1 = entity.params;
            _results1 = [];
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              param = _ref1[_j];
              if (param.name === 'name') {
                _results1.push(this.assets.anims.push(param.value));
              } else {
                _results1.push(void 0);
              }
            }
            return _results1;
          }).call(this));
        } else if (entity.type_id === 'EndOfLevel') {
          _results.push(this.assets.anims.push('flower00'));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Entities.prototype.display = function(ctx) {
      var entity, image, param, _i, _j, _len, _len1, _ref, _ref1, _results;
      _ref = this.list;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        entity = _ref[_i];
        if (entity.type_id === 'Sprite') {
          _ref1 = entity.params;
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            param = _ref1[_j];
            if (param.name === 'name') {
              image = param.value;
            }
          }
          ctx.save();
          ctx.translate(entity.position.x, entity.position.y);
          ctx.scale(1, -1);
          ctx.drawImage(this.assets.get(image), 0, 0, entity.size.r * 4, -entity.size.r * 4);
          _results.push(ctx.restore());
        } else if (entity.type_id === 'EndOfLevel') {
          ctx.save();
          ctx.translate(entity.position.x - entity.size.r, entity.position.y - entity.size.r);
          ctx.scale(1, -1);
          ctx.drawImage(this.assets.get('flower00'), 0, 0, entity.size.r * 4, -entity.size.r * 4);
          _results.push(ctx.restore());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    return Entities;

  })();

  Infos = (function() {
    function Infos(level) {
      this.level = level;
      this.assets = level.assets;
    }

    Infos.prototype.parse = function(xml) {
      var xml_border, xml_infos, xml_level, xml_music;
      xml_level = $(xml).find('level');
      this.identifier = xml_level.attr('id');
      this.pack_name = xml_level.attr('levelpack');
      this.pack_id = xml_level.attr('levelpackNum');
      this.r_version = xml_level.attr('rversion');
      xml_infos = $(xml).find('level').find('info');
      this.name = xml_infos.find('name').text();
      this.description = xml_infos.find('description').text();
      this.author = xml_infos.find('author').text();
      this.date = xml_infos.find('date').text();
      xml_border = xml_infos.find('border');
      this.border = xml_border.attr('texture');
      xml_music = xml_infos.find('music');
      this.music = xml_music.attr('name');
      return this;
    };

    Infos.prototype.init = function() {};

    Infos.prototype.display = function(ctx) {};

    return Infos;

  })();

  LayerOffsets = (function() {
    function LayerOffsets(level) {
      this.level = level;
      this.assets = level.assets;
      this.list = [];
    }

    LayerOffsets.prototype.parse = function(xml) {
      var layer_offset, xml_layer_offset, xml_layer_offsets, _i, _len;
      xml_layer_offsets = $(xml).find('layeroffsets layeroffset');
      for (_i = 0, _len = xml_layer_offsets.length; _i < _len; _i++) {
        xml_layer_offset = xml_layer_offsets[_i];
        layer_offset = {
          x: parseFloat($(xml_layer_offset).attr('x')),
          y: parseFloat($(xml_layer_offset).attr('y')),
          front_layer: $(xml_layer_offset).attr('frontlayer')
        };
        this.list.push(layer_offset);
      }
      return this;
    };

    LayerOffsets.prototype.init = function() {};

    LayerOffsets.prototype.display = function(ctx) {};

    return LayerOffsets;

  })();

  Level = (function() {
    function Level() {
      var canvas;
      canvas = $('#game').get(0);
      this.ctx = canvas.getContext('2d');
      this.assets = new Assets();
      this.physics = new Physics(this);
      this.world = this.physics.world;
      this.moto = new Moto(this);
      this.infos = new Infos(this);
      this.sky = new Sky(this);
      this.blocks = new Blocks(this);
      this.limits = new Limits(this);
      this.layer_offsets = new LayerOffsets(this);
      this.script = new Script(this);
      this.entities = new Entities(this);
    }

    Level.prototype.load_from_file = function(file_name) {
      return $.ajax({
        type: "GET",
        url: "data/Levels/" + file_name,
        dataType: "xml",
        success: this.load_level,
        async: false,
        context: this
      });
    };

    Level.prototype.load_level = function(xml) {
      this.moto.init();
      this.infos.parse(xml).init();
      this.sky.parse(xml).init();
      this.blocks.parse(xml).init();
      this.limits.parse(xml).init();
      this.layer_offsets.parse(xml).init();
      this.script.parse(xml).init();
      return this.entities.parse(xml).init();
    };

    Level.prototype.display = function() {
      var canvas, canvas_height, canvas_width, translate;
      canvas = $('#game').get(0);
      canvas_width = parseFloat(canvas.width);
      canvas_height = canvas.width * (this.limits.size.y / this.limits.size.x);
      $('#game').attr('height', canvas_height);
      this.scale = {
        x: canvas_width / this.limits.size.x,
        y: -canvas_height / this.limits.size.y
      };
      translate = {
        x: -this.limits.screen.left,
        y: -this.limits.screen.top
      };
      this.ctx.scale(this.scale.x, this.scale.y);
      this.ctx.translate(translate.x, translate.y);
      this.ctx.lineWidth = 0.1;
      this.sky.display(this.ctx);
      this.limits.display(this.ctx);
      this.blocks.display(this.ctx);
      this.entities.display(this.ctx);
      return this.moto.display(this.ctx);
    };

    return Level;

  })();

  Limits = (function() {
    function Limits(level) {
      this.level = level;
      this.assets = level.assets;
    }

    Limits.prototype.parse = function(xml) {
      var xml_limits;
      xml_limits = $(xml).find('limits');
      this.screen = {
        left: parseFloat(xml_limits.attr('left')) * 1.15,
        right: parseFloat(xml_limits.attr('right')) * 1.15,
        top: parseFloat(xml_limits.attr('top')) * 1.15,
        bottom: parseFloat(xml_limits.attr('bottom')) * 1.15
      };
      this.player = {
        left: parseFloat(xml_limits.attr('left')),
        right: parseFloat(xml_limits.attr('right')),
        top: parseFloat(xml_limits.attr('top')),
        bottom: parseFloat(xml_limits.attr('bottom'))
      };
      this.size = {
        x: this.screen.right - this.screen.left,
        y: this.screen.top - this.screen.bottom
      };
      return this;
    };

    Limits.prototype.init = function() {
      return this.assets.textures.push('dirt');
    };

    Limits.prototype.display = function(ctx) {
      ctx.beginPath();
      ctx.moveTo(this.screen.left, this.screen.top);
      ctx.lineTo(this.screen.left, this.screen.bottom);
      ctx.lineTo(this.player.left, this.screen.bottom);
      ctx.lineTo(this.player.left, this.screen.top);
      ctx.closePath();
      this.save_apply_texture_and_restore(ctx);
      ctx.beginPath();
      ctx.moveTo(this.screen.right, this.screen.top);
      ctx.lineTo(this.screen.right, this.screen.bottom);
      ctx.lineTo(this.player.right, this.screen.bottom);
      ctx.lineTo(this.player.right, this.screen.top);
      ctx.closePath();
      this.save_apply_texture_and_restore(ctx);
      ctx.beginPath();
      ctx.moveTo(this.player.right, this.player.bottom);
      ctx.lineTo(this.player.left, this.player.bottom);
      ctx.lineTo(this.player.left, this.screen.bottom);
      ctx.lineTo(this.player.right, this.screen.bottom);
      ctx.closePath();
      return this.save_apply_texture_and_restore(ctx);
    };

    Limits.prototype.save_apply_texture_and_restore = function(ctx) {
      ctx.save();
      ctx.scale(1.0 / this.level.scale.x, 1.0 / this.level.scale.y);
      ctx.fillStyle = ctx.createPattern(this.assets.get('dirt'), "repeat");
      ctx.fill();
      return ctx.restore();
    };

    return Limits;

  })();

  $(function() {
    var level;
    level = new Level();
    level.load_from_file('l1038.lvl');
    return level.assets.load(function() {
      var update;
      level.display();
      update = function() {
        var _this = this;
        level.world.Step(1 / 60, 10, 10);
        level.world.ClearForces();
        level.display();
        $(document).off('keydown');
        return $(document).on('keydown', function(event) {
          var force, left_wheel_body;
          force = 0.3;
          left_wheel_body = level.moto.left_wheel.GetBody();
          switch (event.which || event.keyCode) {
            case 38:
              return left_wheel_body.ApplyForce(new b2Vec2(0, force), left_wheel_body.GetWorldCenter());
            case 40:
              return left_wheel_body.ApplyForce(new b2Vec2(0, -force), left_wheel_body.GetWorldCenter());
            case 37:
              left_wheel_body.ApplyTorque(0.01);
              return left_wheel_body.ApplyForce(new b2Vec2(-force / 2, 0), left_wheel_body.GetWorldCenter());
            case 39:
              left_wheel_body.ApplyTorque(-0.01);
              return left_wheel_body.ApplyForce(new b2Vec2(force / 2, 0), left_wheel_body.GetWorldCenter());
          }
        });
      };
      return setInterval(update, 1000 / 60);
    });
  });

  b2World = Box2D.Dynamics.b2World;

  b2Vec2 = Box2D.Common.Math.b2Vec2;

  b2AABB = Box2D.Collision.b2AABB;

  b2BodyDef = Box2D.Dynamics.b2BodyDef;

  b2Body = Box2D.Dynamics.b2Body;

  b2FixtureDef = Box2D.Dynamics.b2FixtureDef;

  b2Fixture = Box2D.Dynamics.b2Fixture;

  b2MassData = Box2D.Collision.Shapes.b2MassData;

  b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;

  b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;

  b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

  b2MouseJointDef = Box2D.Dynamics.Joints.b2MouseJointDef;

  Moto = (function() {
    function Moto(level) {
      this.level = level;
      this.assets = level.assets;
    }

    Moto.prototype.display = function() {
      var position, radius;
      position = this.left_wheel.GetBody().GetPosition();
      radius = this.left_wheel.GetShape().m_radius;
      this.level.ctx.save();
      this.level.ctx.translate(position.x * this.level.physics.scale, position.y * this.level.physics.scale);
      this.level.ctx.rotate(this.left_wheel.GetBody().GetAngle());
      this.level.ctx.drawImage(this.assets.get('playerbikerwheel'), -radius * this.level.physics.scale, radius * this.level.physics.scale, radius * this.level.physics.scale * 2, -radius * this.level.physics.scale * 2);
      return this.level.ctx.restore();
    };

    Moto.prototype.init = function() {
      var texture, textures, _i, _len;
      textures = ['front1', 'lowerarm1', 'lowerleg1', 'playerbikerbody', 'playerbikerwheel', 'playerlowerarm', 'playerlowerleg', 'playertorso', 'playerupperarm', 'playerupperleg', 'rear1', 'upperarm1', 'upperleg1'];
      for (_i = 0, _len = textures.length; _i < _len; _i++) {
        texture = textures[_i];
        this.assets.moto.push(texture);
      }
      return this.left_wheel = this.create_wheel(1, 7, 1);
    };

    Moto.prototype.create_wheel = function(x, y, radius) {
      var bodyDef, fixDef;
      fixDef = new b2FixtureDef();
      fixDef.shape = new b2CircleShape(radius / this.level.physics.scale);
      bodyDef = new b2BodyDef();
      bodyDef.position.x = x / this.level.physics.scale;
      bodyDef.position.y = y / this.level.physics.scale;
      bodyDef.type = b2Body.b2_dynamicBody;
      fixDef.density = 1.0;
      fixDef.restitution = 0.5;
      fixDef.friction = 1.0;
      return this.level.world.CreateBody(bodyDef).CreateFixture(fixDef);
    };

    return Moto;

  })();

  b2World = Box2D.Dynamics.b2World;

  b2Vec2 = Box2D.Common.Math.b2Vec2;

  b2AABB = Box2D.Collision.b2AABB;

  b2BodyDef = Box2D.Dynamics.b2BodyDef;

  b2Body = Box2D.Dynamics.b2Body;

  b2FixtureDef = Box2D.Dynamics.b2FixtureDef;

  b2Fixture = Box2D.Dynamics.b2Fixture;

  b2MassData = Box2D.Collision.Shapes.b2MassData;

  b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;

  b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;

  b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

  b2MouseJointDef = Box2D.Dynamics.Joints.b2MouseJointDef;

  Physics = (function() {
    function Physics(level) {
      var context, debugDraw;
      this.scale = 30;
      this.level = level;
      this.world = new b2World(new b2Vec2(0, -10), true);
      context = this.level.ctx;
      debugDraw = new b2DebugDraw();
      debugDraw.SetSprite(context);
      debugDraw.SetFillAlpha(0.3);
      debugDraw.SetLineThickness(1.0);
      debugDraw.SetDrawScale(this.scale);
      debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
      this.world.SetDebugDraw(debugDraw);
      this.world;
    }

    Physics.prototype.createBody = function(type, x, y, dimensions, fixed, userData) {
      var bodyDef, fixDef;
      if (typeof fixed === 'undefined') {
        fixed = true;
      }
      fixDef = new b2FixtureDef();
      fixDef.userData = userData;
      switch (type) {
        case 'box':
          fixDef.shape = new b2PolygonShape();
          fixDef.shape.SetAsBox(dimensions.width / this.scale, dimensions.height / this.scale);
          break;
        case 'ball':
          fixDef.shape = new b2CircleShape(dimensions.radius / this.scale);
      }
      bodyDef = new b2BodyDef();
      bodyDef.position.x = x / this.scale;
      bodyDef.position.y = y / this.scale;
      if (fixed) {
        bodyDef.type = b2Body.b2_staticBody;
      } else {
        bodyDef.type = b2Body.b2_dynamicBody;
        fixDef.density = 1.0;
        fixDef.restitution = 0.5;
      }
      fixDef.friction = 1.0;
      return this.world.CreateBody(bodyDef).CreateFixture(fixDef);
    };

    Physics.prototype.createBox = function(x, y, width, height, fixed, userData) {
      var dimensions;
      dimensions = {
        width: width,
        height: height
      };
      return this.createBody('box', x, y, dimensions, fixed, userData);
    };

    Physics.prototype.createTriangle = function(vertices, fixed, userData) {
      var bodyDef, fixDef;
      if (typeof fixed === 'undefined') {
        fixed = true;
      }
      fixDef = new b2FixtureDef();
      fixDef.userData = userData;
      fixDef.shape = new b2PolygonShape();
      fixDef.shape.SetAsArray([new b2Vec2(vertices[0].x / this.scale, vertices[0].y / this.scale), new b2Vec2(vertices[1].x / this.scale, vertices[1].y / this.scale), new b2Vec2(vertices[2].x / this.scale, vertices[2].y / this.scale)]);
      bodyDef = new b2BodyDef();
      bodyDef.position.x = 0;
      bodyDef.position.y = 0;
      if (fixed) {
        bodyDef.type = b2Body.b2_staticBody;
      } else {
        bodyDef.type = b2Body.b2_dynamicBody;
        fixDef.density = 1.0;
        fixDef.restitution = 0.5;
      }
      return this.world.CreateBody(bodyDef).CreateFixture(fixDef);
    };

    return Physics;

  })();

  Script = (function() {
    function Script(level) {
      this.level = level;
      this.assets = level.assets;
    }

    Script.prototype.parse = function(xml) {
      var xml_script;
      xml_script = $(xml).find('script');
      this.code = xml_script.text();
      return this;
    };

    Script.prototype.init = function() {};

    Script.prototype.display = function(ctx) {};

    return Script;

  })();

  Sky = (function() {
    function Sky(level) {
      this.level = level;
      this.assets = level.assets;
    }

    Sky.prototype.parse = function(xml) {
      var xml_sky;
      xml_sky = $(xml).find('level info sky');
      this.name = xml_sky.text().toLowerCase();
      this.color_r = parseInt(xml_sky.attr('color_r'));
      this.color_g = parseInt(xml_sky.attr('color_g'));
      this.color_b = parseInt(xml_sky.attr('color_b'));
      this.color_a = parseInt(xml_sky.attr('color_a'));
      this.zoom = parseFloat(xml_sky.attr('zoom'));
      this.offset = parseFloat(xml_sky.attr('offset'));
      return this;
    };

    Sky.prototype.init = function() {
      return this.assets.textures.push(this.name);
    };

    Sky.prototype.display = function(ctx) {
      return ctx.drawImage(this.assets.get(this.name), this.level.limits.screen.left, this.level.limits.screen.bottom, this.level.limits.size.x, this.level.limits.size.y);
    };

    return Sky;

  })();

}).call(this);
