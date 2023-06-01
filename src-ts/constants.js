var Constants, b2Vec2

b2Vec2 = Box2D.Common.Math.b2Vec2

Constants = (function () {
  function Constants() {}

  Constants.debug = false

  Constants.debug_physics = false

  Constants.debug_clipping = false

  Constants.hooking = false

  Constants.gravity = 9.81

  Constants.max_moto_speed = 70.0

  Constants.air_density = 0.02

  Constants.moto_acceleration = 9.0

  Constants.biker_force = 11.0

  Constants.fps = 60.0

  Constants.replay_key_step = 60

  Constants.replay_key_step_precision = 4

  Constants.automatic_scale = true

  Constants.manual_scale = true

  Constants.default_scale = {
    x: 70.0,
    y: -70.0,
  }

  Constants.body = {
    density: 1.5,
    restitution: 0.5,
    friction: 1.0,
    position: {
      x: 0.0,
      y: 1.0,
    },
    shape: [
      new b2Vec2(0.4, -0.3),
      new b2Vec2(0.5, 0.4),
      new b2Vec2(-0.75, 0.16),
      new b2Vec2(-0.35, -0.3),
    ],
    collisions: true,
    texture: 'playerbikerbody',
    ghost_texture: 'ghostbikerbody',
    texture_size: {
      x: 2.0,
      y: 1.0,
    },
  }

  Constants.left_wheel = {
    radius: 0.35,
    density: 1.8,
    restitution: 0.3,
    friction: 1.4,
    position: {
      x: -0.7,
      y: 0.48,
    },
    collisions: true,
    texture: 'playerbikerwheel',
    ghost_texture: 'ghostbikerwheel',
  }

  Constants.right_wheel = {
    radius: 0.35,
    density: 1.8,
    restitution: 0.3,
    friction: 1.4,
    position: {
      x: 0.7,
      y: 0.48,
    },
    collisions: true,
    texture: 'playerbikerwheel',
    ghost_texture: 'ghostbikerwheel',
  }

  Constants.left_axle = {
    density: 1.0,
    restitution: 0.5,
    friction: 1.0,
    position: {
      x: 0.0,
      y: 1.0,
    },
    shape: [
      new b2Vec2(-0.1, -0.3),
      new b2Vec2(-0.25, -0.3),
      new b2Vec2(-0.8, -0.58),
      new b2Vec2(-0.65, -0.58),
    ],
    collisions: true,
    texture: 'rear1',
    ghost_texture: 'rear_ghost',
  }

  Constants.right_axle = {
    density: 1.5,
    restitution: 0.5,
    friction: 1.0,
    position: {
      x: 0.0,
      y: 1.0,
    },
    shape: [
      new b2Vec2(0.58, -0.02),
      new b2Vec2(0.48, -0.02),
      new b2Vec2(0.66, -0.58),
      new b2Vec2(0.76, -0.58),
    ],
    collisions: true,
    texture: 'front1',
    ghost_texture: 'front_ghost',
  }

  Constants.head = {
    density: 0.4,
    restitution: 0.0,
    friction: 1.0,
    position: {
      x: -0.27,
      y: 2.26,
    },
    radius: 0.18,
    collisions: true,
  }

  Constants.torso = {
    density: 0.4,
    restitution: 0.0,
    friction: 1.0,
    position: {
      x: -0.31,
      y: 1.89,
    },
    angle: -Math.PI / 30.0,
    shape: [
      new b2Vec2(0.1, -0.55),
      new b2Vec2(0.13, 0.15),
      new b2Vec2(-0.2, 0.22),
      new b2Vec2(-0.18, -0.55),
    ],
    collisions: true,
    texture: 'playertorso',
    ghost_texture: 'ghosttorso',
    texture_size: {
      x: 0.5,
      y: 1.2,
    },
  }

  Constants.lower_leg = {
    density: 0.4,
    restitution: 0.0,
    friction: 1.0,
    position: {
      x: 0.07,
      y: 0.9,
    },
    angle: -Math.PI / 6.0,
    shape: [
      new b2Vec2(0.2, -0.33),
      new b2Vec2(0.2, -0.27),
      new b2Vec2(0.0, -0.2),
      new b2Vec2(0.02, 0.33),
      new b2Vec2(-0.17, 0.33),
      new b2Vec2(-0.14, -0.33),
    ],
    collisions: true,
    texture: 'playerlowerleg',
    ghost_texture: 'ghostlowerleg',
    texture_size: {
      x: 0.4,
      y: 0.66,
    },
  }

  Constants.upper_leg = {
    density: 0.4,
    restitution: 0.0,
    friction: 1.0,
    position: {
      x: -0.15,
      y: 1.27,
    },
    angle: -Math.PI / 11.0,
    shape: [
      new b2Vec2(0.4, -0.14),
      new b2Vec2(0.4, 0.07),
      new b2Vec2(-0.4, 0.14),
      new b2Vec2(-0.4, -0.08),
    ],
    collisions: true,
    texture: 'playerupperleg',
    ghost_texture: 'ghostupperleg',
    texture_size: {
      x: 0.78,
      y: 0.28,
    },
  }

  Constants.lower_arm = {
    density: 0.4,
    restitution: 0.0,
    friction: 1.0,
    position: {
      x: 0.07,
      y: 1.54,
    },
    angle: -Math.PI / 10.0,
    shape: [
      new b2Vec2(0.28, -0.07),
      new b2Vec2(0.28, 0.04),
      new b2Vec2(-0.3, 0.07),
      new b2Vec2(-0.3, -0.06),
    ],
    collisions: true,
    texture: 'playerlowerarm',
    ghost_texture: 'ghostlowerarm',
    texture_size: {
      x: 0.53,
      y: 0.2,
    },
  }

  Constants.upper_arm = {
    density: 0.4,
    restitution: 0.0,
    friction: 1.0,
    position: {
      x: -0.2,
      y: 1.85,
    },
    angle: Math.PI / 10.0,
    shape: [
      new b2Vec2(0.09, -0.29),
      new b2Vec2(0.09, 0.22),
      new b2Vec2(-0.11, 0.26),
      new b2Vec2(-0.1, -0.29),
    ],
    collisions: true,
    texture: 'playerupperarm',
    ghost_texture: 'ghostupperarm',
    texture_size: {
      x: 0.24,
      y: 0.56,
    },
  }

  Constants.left_suspension = {
    angle: new b2Vec2(0, 1),
    lower_translation: -0.03,
    upper_translation: 0.2,
    back_force: 3.0,
    rigidity: 8.0,
  }

  Constants.right_suspension = {
    angle: new b2Vec2(-0.2, 1),
    lower_translation: -0.01,
    upper_translation: 0.2,
    back_force: 3.0,
    rigidity: 4.0,
  }

  Constants.ankle = {
    axe_position: {
      x: -0.18,
      y: -0.2,
    },
  }

  Constants.wrist = {
    axe_position: {
      x: 0.25,
      y: -0.07,
    },
  }

  Constants.knee = {
    axe_position: {
      x: 0.12,
      y: 0.28,
    },
  }

  Constants.elbow = {
    axe_position: {
      x: 0.03,
      y: -0.21,
    },
  }

  Constants.shoulder = {
    axe_position: {
      x: -0.12,
      y: 0.22,
    },
  }

  Constants.hip = {
    axe_position: {
      x: -0.25,
      y: 0.14,
    },
  }

  Constants.ground = {
    density: 1.0,
    restitution: 0.2,
    friction: 1.2,
  }

  Constants.chain_reaction = function () {
    var element, i, len, ref, results
    if (this.hooking === true) {
      ref = [
        'body',
        'left_axle',
        'right_axle',
        'torso',
        'lower_leg',
        'upper_leg',
        'lower_arm',
        'upper_arm',
      ]
      results = []
      for (i = 0, len = ref.length; i < len; i++) {
        element = ref[i]
        results.push((Constants[element].collisions = false))
      }
      return results
    }
  }

  Constants.chain_reaction()

  return Constants
})()

export default Constants
