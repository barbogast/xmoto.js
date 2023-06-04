import $ from 'jquery'
import Level from './level'
import Assets from './utils/assets'

class Input {
  level: Level
  assets: Assets
  up: boolean
  down: boolean
  left: boolean
  right: boolean
  space: boolean

  constructor(level) {
    this.level = level
    this.assets = level.assets
    this.up = false
    this.down = false
    this.left = false
    this.right = false
    this.space = false
  }

  init() {
    this.disable_scroll()
    this.init_keyboard()
  }

  disable_scroll() {
    // Disable up, down, left, right to scroll
    // left: 37, up: 38, right: 39, down: 40, spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36
    const keys = [37, 38, 39, 40, 32]
    const preventDefault = function (e) {
      e = e || window.event
      if (e.preventDefault) {
        e.preventDefault()
      } else {
        e.returnValue = false
      }
    }
    const keydown = function (e) {
      for (const i of keys) {
        if (e.keyCode === i) {
          preventDefault(e)
          return
        }
      }
    }
    document.onkeydown = keydown
  }

  init_keyboard() {
    $(document).off('keydown')
    $(document).on('keydown', (event) => {
      switch (event.which || event.keyCode) {
        case 38:
          this.up = true
          break
        case 40:
          this.down = true
          break
        case 37:
          this.left = true
          break
        case 39:
          this.right = true
          break
        case 32:
          this.space = true
          break
        case 13:
          this.level.need_to_restart = true
          break
        case 69: // e
          if (!$('input').is(':focus')) {
            this.level.moto.rider.eject()
          }
          break
        case 67: // c
          let url = document.URL
          url =
            url.substr(url.length - 1) !== '/'
              ? url + '/capture'
              : url + 'capture'

          $.post(url, {
            steps: this.level.physics.steps,
            image: $(this.level.options.canvas)[0].toDataURL(),
          })
            .done(() => alert('Capture uploaded'))
            .fail(() => alert('Capture failed'))
      }
    })

    return $(document).on('keyup', (event) => {
      switch (event.which || event.keyCode) {
        case 38:
          this.up = false
          break
        case 40:
          this.down = false
          break
        case 37:
          this.left = false
          break
        case 39:
          this.right = false
          break
      }
    })
  }
}

export default Input
