import Constants from '../constants.js'

var bind_debug_button,
  bind_delete_params_buttons,
  create_form_with_url_params,
  display_constants,
  override_constants_by_url_params

bind_debug_button = function () {
  $('#debug .debug-button').on('click', function () {
    window.location =
      '?level=' + $('#levels option:selected').text() + '&debug=true'
    return false
  })
  return $('.normal-button').on('click', function () {
    window.location = '?level=' + $('#levels option:selected').text()
    return false
  })
}

bind_delete_params_buttons = function () {
  return $('#debug span.delete').on('click', function () {
    $(this).closest('.template').remove()
    return $('#debug form').submit()
  })
}

override_constants_by_url_params = function (params) {
  var array, array_key, array_keys, i, j, key, len, value
  for (key in params) {
    value = params[key]
    array_keys = key.split('.')
    array = Constants
    for (i = j = 0, len = array_keys.length; j < len; i = ++j) {
      array_key = array_keys[i]
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
  return Constants.chain_reaction()
}

display_constants = function () {
  var html, j, key, len, ref, ref1, sub_key, sub_value, value
  html = '<ul>'
  ref = Object.keys(Constants)
  for (j = 0, len = ref.length; j < len; j++) {
    key = ref[j]
    value = Constants[key]
    if (typeof value !== 'object' && typeof value !== 'function') {
      html +=
        '<li><a href="' +
        document.URL +
        '&' +
        key +
        '=' +
        value +
        '">' +
        key +
        '</a> (' +
        value +
        ')</li>'
    } else {
      html += '<li>' + key + '<ul>'
      ref1 = Constants[key]
      for (sub_key in ref1) {
        sub_value = ref1[sub_key]
        if (typeof sub_value !== 'object') {
          html +=
            '<li><a href="' +
            document.URL +
            '&' +
            key +
            '.' +
            sub_key +
            '=' +
            sub_value +
            '">' +
            sub_key +
            '</a> (' +
            sub_value +
            ')</li>'
        }
      }
      html += '</ul></li>'
    }
  }
  html += '</ul>'
  $('#debug .variables').html(html)
  return $('ul > li > ul:not(:has(> li))').parent().hide()
}

create_form_with_url_params = function (params) {
  var key, new_input, results, value
  results = []
  for (key in params) {
    value = params[key]
    new_input = $('form.debug .template:first')
      .clone()
      .insertBefore('form.debug input[type=submit]')
    new_input.find('label').attr('for', key).text(key)
    new_input.find('input').attr('name', key).attr('id', key).val(value)
    new_input.show()
    results.push($('form.debug .template:first').hide())
  }
  return results
}

$(function () {
  var params
  params = $.url().param()
  if (Constants.debug || params.debug === 'true') {
    $('.debug').show()
    $('.debug-button').hide()
    $('body').addClass('debug')
    override_constants_by_url_params(params)
    create_form_with_url_params(params)
    display_constants()
  }
  bind_debug_button()
  return bind_delete_params_buttons()
})
