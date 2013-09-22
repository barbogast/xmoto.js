class Input

  constructor: (level) ->
    @level  = level
    @assets = level.assets

  init: ->
    @disable_scroll()
    @init_keyboard()

  disable_scroll: ->
    # Disable up, down, left, right to scroll
    # left: 37, up: 38, right: 39, down: 40, spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36
    keys = [37, 38, 39, 40]

    preventDefault = (e) ->
      e = e || window.event
      if e.preventDefault
        e.preventDefault()
      e.returnValue = false

    keydown = (e) ->
      for i in keys
        if e.keyCode == i
          preventDefault(e)
          return

    document.onkeydown = keydown

  init_keyboard: ->
    $(document).off('keydown')
    $(document).on('keydown', (event) =>
      switch(event.which || event.keyCode)
        when 38
          @up = true
        when 40
          @down = true
        when 37
          @left = true
        when 39
          @right = true
        when 13
          @level.moto = new Moto(@level)
          @level.moto.init()
    )

    $(document).on('keyup', (event) =>
      switch(event.which || event.keyCode)
        when 38
          @up = false
        when 40
          @down = false
        when 37
          @left = false
        when 39
          @right = false
    )

  move_moto: ->
    force = 13
    moto = @level.moto

    if @up
      @level.moto.left_wheel.ApplyTorque(- force/3)
      #left_wheel_body.ApplyForce(new b2Vec2(  force/2, 0), left_wheel_body.GetWorldCenter())
    if @down
      @level.moto.left_wheel.ApplyTorque(force/5)
      #left_wheel_body.ApplyForce(new b2Vec2( -force/2, 0), left_wheel_body.GetWorldCenter())
    if @left
      @level.moto.body.ApplyTorque(force)
      #@level.moto.bike_body.ApplyForce(new b2Vec2( 0, -force), right_wheel_body.GetWorldCenter())
    if @right
      @level.moto.body.ApplyTorque(-force)
      #right_wheel_body.ApplyForce(new b2Vec2( 0,  force), right_wheel_body.GetWorldCenter())

    moto.right_prismatic_joint.SetMaxMotorForce(4+Math.abs(800*Math.pow(moto.right_prismatic_joint.GetJointTranslation(), 2)))
    moto.right_prismatic_joint.SetMotorSpeed(-3*moto.right_prismatic_joint.GetJointTranslation())

    moto.left_prismatic_joint.SetMaxMotorForce(8+Math.abs(800*Math.pow(moto.left_prismatic_joint.GetJointTranslation(), 2)))
    moto.left_prismatic_joint.SetMotorSpeed(-3*moto.left_prismatic_joint.GetJointTranslation())


    #moto.rider.foot_joint    .SetMaxMotorTorque(8+Math.abs(800*Math.pow(moto.rider.foot_joint    .GetJointAngle(), 2)))
    #moto.rider.hand_joint    .SetMaxMotorTorque(8+Math.abs(800*Math.pow(moto.rider.hand_joint    .GetJointAngle(), 2)))
    #moto.rider.knee_joint    .SetMaxMotorTorque(8+Math.abs(800*Math.pow(moto.rider.knee_joint    .GetJointAngle(), 2)))
    #moto.rider.elbow_joint   .SetMaxMotorTorque(8+Math.abs(800*Math.pow(moto.rider.elbow_joint   .GetJointAngle(), 2)))
    #moto.rider.shoulder_joint.SetMaxMotorTorque(8+Math.abs(800*Math.pow(moto.rider.shoulder_joint.GetJointAngle(), 2)))
    #moto.rider.hip_joint     .SetMaxMotorTorque(8+Math.abs(800*Math.pow(moto.rider.hip_joint     .GetJointAngle(), 2)))
#
    #moto.rider.foot_joint    .SetMotorSpeed(-3*moto.rider.foot_joint    .GetJointAngle())
    #moto.rider.hand_joint    .SetMotorSpeed(-3*moto.rider.hand_joint    .GetJointAngle())
    #moto.rider.knee_joint    .SetMotorSpeed(-3*moto.rider.knee_joint    .GetJointAngle())
    #moto.rider.elbow_joint   .SetMotorSpeed(-3*moto.rider.elbow_joint   .GetJointAngle())
    #moto.rider.shoulder_joint.SetMotorSpeed(-3*moto.rider.shoulder_joint.GetJointAngle())
    #moto.rider.hip_joint     .SetMotorSpeed(-3*moto.rider.hip_joint     .GetJointAngle())
#
