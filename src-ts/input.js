var Input

Input = (function () {
  function Input(level) {
    this.level = level
    this.assets = level.assets
    this.up = false
    this.down = false
    this.left = false
    this.right = false
    this.space = false
  }

  Input.prototype.init = function () {
    this.disable_scroll()
    return this.init_keyboard()
  }

  Input.prototype.disable_scroll = function () {
    var keydown, keys, preventDefault
    keys = [37, 38, 39, 40, 32]
    preventDefault = function (e) {
      e = e || window.event
      if (e.preventDefault) {
        return e.preventDefault()
      } else {
        return (e.returnValue = false)
      }
    }
    keydown = function (e) {
      var i, j, len
      for (j = 0, len = keys.length; j < len; j++) {
        i = keys[j]
        if (e.keyCode === i) {
          preventDefault(e)
          return
        }
      }
    }
    return (document.onkeydown = keydown)
  }

  Input.prototype.init_keyboard = function () {
    $(document).off('keydown')
    $(document).on(
      'keydown',
      (function (_this) {
        return function (event) {
          var url
          switch (event.which || event.keyCode) {
            case 38:
              return (_this.up = true)
            case 40:
              return (_this.down = true)
            case 37:
              return (_this.left = true)
            case 39:
              return (_this.right = true)
            case 32:
              return (_this.space = true)
            case 13:
              return (_this.level.need_to_restart = true)
            case 69:
              if (!$('input').is(':focus')) {
                return _this.level.moto.rider.eject()
              }
              break
            case 67:
              url = document.URL
              url =
                url.substr(url.length - 1) !== '/'
                  ? url + '/capture'
                  : url + 'capture'
              return $.post(url, {
                steps: _this.level.physics.steps,
                image: $(_this.level.options.canvas)[0].toDataURL(),
              })
                .done(function () {
                  return alert('Capture uploaded')
                })
                .fail(function () {
                  return alert('Capture failed')
                })
          }
        }
      })(this)
    )
    return $(document).on(
      'keyup',
      (function (_this) {
        return function (event) {
          switch (event.which || event.keyCode) {
            case 38:
              return (_this.up = false)
            case 40:
              return (_this.down = false)
            case 37:
              return (_this.left = false)
            case 39:
              return (_this.right = false)
          }
        }
      })(this)
    )
  }

  return Input
})()

export default Input
