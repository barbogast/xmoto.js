class Camera

  constructor: (level) ->
    @level  = level

    # level unities * scale = pixels
    @scale =
      x: Constants.default_scale.x
      y: Constants.default_scale.y

  init: ->
    if Constants.manual_scale
      @init_scroll()

  move: ->
    if Constants.automatic_scale
      speed = Math2D.distance_between_points(new b2Vec2(0, 0), @level.moto.body.GetLinearVelocity())
      @scale.x = @scale.x * 0.995 + (Constants.default_scale.x / (1.0 + speed/10.0)) * 0.005
      @scale.y = @scale.y * 0.995 + (Constants.default_scale.y / (1.0 + speed/10.0)) * 0.005

  # must be an object with x and y values
  target: ->
    options = @level.options
    if options.replay_mode
      @level.ghosts.replay.current_frame().body.position
    else
      @level.moto.body.GetPosition()

  # If there are some issues on other systems than MacOS,
  # check this to find a solution : http://stackoverflow.com/questions/5527601/normalizing-mousewheel-speed-across-browsers
  init_scroll : ->
    scroll = (event) =>
      if event.wheelDelta
        delta = event.wheelDelta/40
      else if event.detail
        delta = -event.detail
      else
        delta = 0

      # zoom / dezoom
      @scale.x += (@scale.x/200) * delta
      @scale.y += (@scale.y/200) * delta

      # boundaries
      min_limit_x = Constants.default_scale.x / 2
      min_limit_y = Constants.default_scale.y / 2

      max_limit_x = Constants.default_scale.x * 2
      max_limit_y = Constants.default_scale.y * 2

      @scale.x = min_limit_x if @scale.x < min_limit_x
      @scale.y = min_limit_y if @scale.y > min_limit_y

      @scale.x = max_limit_x if @scale.x > max_limit_x
      @scale.y = max_limit_y if @scale.y < max_limit_y

      return event.preventDefault() && false

    canvas = $(@level.options.canvas).get(0)
    canvas.addEventListener('DOMMouseScroll', scroll, false)
    canvas.addEventListener('mousewheel',     scroll, false)
