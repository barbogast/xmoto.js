var Script

Script = (function () {
  function Script(level) {
    this.level = level
    this.assets = level.assets
  }

  Script.prototype.parse = function (xml) {
    var xml_script
    xml_script = $(xml).find('script')
    this.code = xml_script.text()
    return this
  }

  Script.prototype.init = function () {}

  Script.prototype.display = function (ctx) {}

  return Script
})()
