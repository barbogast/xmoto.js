var Infos

Infos = (function () {
  function Infos(level) {
    this.level = level
    this.assets = level.assets
  }

  Infos.prototype.parse = function (xml) {
    var xml_border, xml_infos, xml_level, xml_music
    xml_level = $(xml).find('level')
    this.identifier = xml_level.attr('id')
    this.pack_name = xml_level.attr('levelpack')
    this.pack_id = xml_level.attr('levelpackNum')
    this.r_version = xml_level.attr('rversion')
    xml_infos = $(xml).find('level').find('info')
    this.name = xml_infos.find('name').text()
    this.description = xml_infos.find('description').text()
    this.author = xml_infos.find('author').text()
    this.date = xml_infos.find('date').text()
    xml_border = xml_infos.find('border')
    this.border = xml_border.attr('texture')
    xml_music = xml_infos.find('music')
    this.music = xml_music.attr('name')
    return this
  }

  return Infos
})()

export default Infos
