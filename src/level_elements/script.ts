import $ from 'jquery'

class Script {
  level: any
  assets: any
  code: any

  constructor(level) {
    this.level = level
    this.assets = level.assets
  }

  parse(xml) {
    var xml_script
    xml_script = $(xml).find('script')
    this.code = xml_script.text()
    return this
  }

  init() {}

  display(ctx) {}
}

export default Script
