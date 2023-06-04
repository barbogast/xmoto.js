import Stats from 'stats.js'
import $ from 'jquery'

import Level, { Options } from './level.js'
import Constants from './constants.js'

// @ts-ignore
$.xmoto = function (level_filename, options: Options = {}) {
  const initialize = function () {
    options = load_options(options)

    // To make sprites of moto more "sharp" (less blurry),
    // we disable midmapping. It may impact rendering speed
    // because midmap generate lower images to speed up
    // rendering  (only for pow2 sizes)
    // @ts-ignore
    PIXI.settings.MIPMAP_TEXTURES = PIXI.MIPMAP_MODES.OFF

    // If midmapping is enabled, sharper rendering is done using
    // this line (maybe blurrier is better? Need to test on bike)
    // PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST

    // @ts-ignore
    const renderer = new PIXI.Renderer({
      width: options.width,
      height: options.height,
      backgroundColor: 0xffffff,
      clearBeforeRender: false, // Should be faster (because we always render everything)
      preserveDrawingBuffer: true, //  Need to be true if clearBeforeRender is false

      // transparent: true  // May be useful later (moto on website)
      // antialias: true, // antiliasing is false by default and we keep it that way because
      // of significative FPS drop and small visual changes
    })

    // @ts-ignore
    window.cancelAnimationFrame(window.game_loop)

    bind_render_to_dom(renderer, options)
    main_loop(level_filename, renderer, options)
  }

  const load_options = function (options) {
    const defaults = {
      // Selectors
      canvas: '#xmoto', // canvas selector
      loading: '#loading', // loading selector
      chrono: '#chrono', // chrono selector

      // Size
      width: 800,
      height: 600,

      // Replays
      replays: [], // [ { replay: , follow: , name: , picture: }, ... ]
      playable: true, // if false, just watch replays

      // Zoom
      zoom: Constants.default_scale.x,

      // Paths
      levels_path: '/data/Levels', // Path where are the levels (ex. /data/Levels/l1.lvl)
      scores_path: '/scores', // Path where to POST a score
      replays_path: '/data/Replays', // Path where all the replay files are stored (ex. /data/Replays/1.replay)
    }

    options = $.extend(defaults, options)

    Constants.default_scale = {
      x: options.zoom,
      y: -options.zoom,
    }

    return options
  }

  const bind_render_to_dom = function (renderer, options) {
    $('#xmoto canvas').remove()

    $(options.loading).show()
    $('#xmoto').css('height', options.height)
    $('#xmoto')[0].appendChild(renderer.view)
    $('#xmoto').append(
      `<canvas id="xmoto-debug" width="${options.width}" height="${options.height}"></canvas>`
    )
    $('#xmoto-debug').hide()
  }

  const bind_stats_fps = function () {
    const stats = new Stats()
    stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
    $('#xmoto')[0].appendChild(stats.dom)
    $('#xmoto div:last').addClass('stats-fps')
    return stats
  }

  const bind_stats_ms = function () {
    const stats = new Stats()
    stats.showPanel(1) // 0: fps, 1: ms, 2: mb, 3+: custom
    $('#xmoto')[0].appendChild(stats.dom)
    $('#xmoto div:last').addClass('stats-ms')
    return stats
  }

  const main_loop = function (level_filename, renderer, options) {
    let stats_fps, stats_ms
    if (Constants.debug) {
      stats_fps = bind_stats_fps()
    }
    if (Constants.debug) {
      stats_ms = bind_stats_ms()
    }

    const level = new Level(renderer, options)

    return level.load_from_file(level_filename, () => {
      level.init()
      $(options.loading).hide()

      const update = function () {
        if (Constants.debug) {
          stats_fps.begin()
        }
        if (Constants.debug) {
          stats_ms.begin()
        }
        level.update()
        if (!Constants.debug_physics) {
          renderer.render(level.stage)
        }
        // @ts-ignore
        window.game_loop = requestAnimationFrame(update)
        if (Constants.debug) {
          stats_fps.end()
        }
        if (Constants.debug) {
          return stats_ms.end()
        }
      }
      update()
    })
  }

  // const full_screen = function () {
  //   window.onresize = function () {
  //    $("#xmoto").width($("body").width())
  //    $("#xmoto").height($("body").height())
  //   }
  //   window.onresize()
  // }

  return initialize()
}
