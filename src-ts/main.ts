import Level from './level.js'
import Constants from './constants.js'

// @ts-ignore
$.xmoto = function (level_filename, options) {
  var bind_render_to_dom,
    bind_stats_fps,
    bind_stats_ms,
    initialize,
    load_options,
    main_loop
  if (options == null) {
    options = {}
  }
  initialize = function () {
    var renderer
    options = load_options(options)
    // @ts-ignore
    PIXI.settings.MIPMAP_TEXTURES = PIXI.MIPMAP_MODES.OFF
    // @ts-ignore
    renderer = new PIXI.Renderer({
      width: options.width,
      height: options.height,
      backgroundColor: 0xffffff,
      clearBeforeRender: false,
      preserveDrawingBuffer: true,
    })
    // @ts-ignore
    window.cancelAnimationFrame(window.game_loop)
    bind_render_to_dom(renderer, options)
    return main_loop(level_filename, renderer, options)
  }
  load_options = function (options) {
    var defaults
    defaults = {
      canvas: '#xmoto',
      loading: '#loading',
      chrono: '#chrono',
      width: 800,
      height: 600,
      replays: [],
      playable: true,
      zoom: Constants.default_scale.x,
      levels_path: '/data/Levels',
      scores_path: '/scores',
      replays_path: '/data/Replays',
    }
    options = $.extend(defaults, options)
    Constants.default_scale = {
      x: options.zoom,
      y: -options.zoom,
    }
    return options
  }
  bind_render_to_dom = function (renderer, options) {
    $('#xmoto canvas').remove()
    $(options.loading).show()
    $('#xmoto').css('height', options.height)
    $('#xmoto')[0].appendChild(renderer.view)
    $('#xmoto').append(
      '<canvas id="xmoto-debug" width="' +
        options.width +
        '" height="' +
        options.height +
        '"></canvas>'
    )
    return $('#xmoto-debug').hide()
  }
  bind_stats_fps = function () {
    var stats
    // @ts-ignore
    stats = new Stats()
    stats.showPanel(0)
    $('#xmoto')[0].appendChild(stats.dom)
    $('#xmoto div:last').addClass('stats-fps')
    return stats
  }
  bind_stats_ms = function () {
    var stats
    // @ts-ignore
    stats = new Stats()
    stats.showPanel(1)
    $('#xmoto')[0].appendChild(stats.dom)
    $('#xmoto div:last').addClass('stats-ms')
    return stats
  }
  main_loop = function (level_filename, renderer, options) {
    var level, stats_fps, stats_ms
    if (Constants.debug) {
      stats_fps = bind_stats_fps()
    }
    if (Constants.debug) {
      stats_ms = bind_stats_ms()
    }
    level = new Level(renderer, options)
    return level.load_from_file(
      level_filename,
      (function (_this) {
        return function () {
          var update
          level.init(renderer)
          $(options.loading).hide()
          update = function () {
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
          return update()
        }
      })(this)
    )
  }
  return initialize()
}
