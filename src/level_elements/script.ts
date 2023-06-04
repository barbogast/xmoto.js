import $ from 'jquery'
import Level from '../level'
import Assets from '../utils/assets'

class Script {
  level: Level
  assets: Assets
  code: string

  constructor(level) {
    this.level = level
    this.assets = level.assets
  }

  parse(xml) {
    const xml_script = $(xml).find('script')
    this.code = xml_script.text()

    return this
  }

  init() {}

  display(ctx) {}
}

export default Script
