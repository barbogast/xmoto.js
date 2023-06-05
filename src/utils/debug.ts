//  Special debug mode to change constants visually
import $ from 'jquery'

import Constants from '../constants.js'

const bind_debug_button = function () {
  $('#debug .debug-button').on('click', () => {
    ;(window as Window).location =
      '?level=' + $('#levels option:selected').text() + '&debug=true'
    return false
  })

  $('.normal-button').on('click', () => {
    ;(window as Window).location =
      '?level=' + $('#levels option:selected').text()
    return false
  })
}

const bind_delete_params_buttons = function () {
  $('#debug span.delete').on('click', () => {
    $(this).closest('.template').remove()
    $('#debug form').submit()
  })
}

const override_constants_by_url_params = function (params) {
  for (const key in params) {
    const value = params[key]
    const array_keys = key.split('.')
    let array = Constants
    for (const [i, array_key] of array_keys.entries()) {
      if (i === array_keys.length - 1) {
        if (value === '') {
          delete params[key]
        } else {
          if (value === 'true' || value === 'false') {
            array[array_key] = value === 'true'
          } else if (array_key !== 'level') {
            array[array_key] = parseFloat(value)
          }
        }
      } else {
        array = array[array_key]
      }
    }
  }
  Constants.chain_reaction()
}

const display_constants = function () {
  // display all the keys with direct link
  let html = '<ul>'
  for (const key of Object.keys(Constants)) {
    const value = Constants[key]
    if (typeof value !== 'object' && typeof value !== 'function') {
      html += `<li><a href=\"${document.URL}&${key}=#{value}\">${key}</a> (${value})</li>`
    } else {
      html += `<li>${key}<ul>`
      for (const [sub_key, sub_value] of Object.entries(Constants[key])) {
        if (typeof sub_value !== 'object') {
          html += `<li><a href="${document.URL}&${key}.${sub_key}=${sub_value}">${sub_key}</a> (${sub_value})</li>`
        }
      }
      html += '</ul></li>'
    }
  }
  html += '</ul>'
  $('#debug .variables').html(html)

  // Hide ul without li (object with only other objects as value)
  $('ul > li > ul:not(:has(> li))').parent().hide()
}

const create_form_with_url_params = function (params: URLSearchParams) {
  for (const [key, value] of Object.entries(params)) {
    const new_input = $('form.debug .template:first')
      .clone()
      .insertBefore('form.debug input[type=submit]')
    new_input.find('label').attr('for', key).text(key)
    new_input.find('input').attr('name', key).attr('id', key).val(value)
    new_input.show()
    $('form.debug .template:first').hide()
  }
}

$(function () {
  const params = new URLSearchParams(window.location.search)

  if (Constants.debug || ('debug' in params && params.debug === 'true')) {
    $('.debug').show()
    $('.debug-button').hide()
    $('body').addClass('debug')

    override_constants_by_url_params(params)
    create_form_with_url_params(params)
    display_constants()
  }

  bind_debug_button()
  bind_delete_params_buttons()
})
