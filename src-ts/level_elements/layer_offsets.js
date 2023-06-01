// Generated by CoffeeScript 1.12.7
var LayerOffsets;

LayerOffsets = (function() {
  function LayerOffsets(level) {
    this.level = level;
    this.assets = level.assets;
    this.list = [];
  }

  LayerOffsets.prototype.parse = function(xml) {
    var i, layer_offset, len, xml_layer_offset, xml_layer_offsets;
    xml_layer_offsets = $(xml).find('layeroffsets layeroffset');
    for (i = 0, len = xml_layer_offsets.length; i < len; i++) {
      xml_layer_offset = xml_layer_offsets[i];
      layer_offset = {
        x: parseFloat($(xml_layer_offset).attr('x')),
        y: parseFloat($(xml_layer_offset).attr('y')),
        front_layer: $(xml_layer_offset).attr('frontlayer')
      };
      this.list.push(layer_offset);
    }
    return this;
  };

  LayerOffsets.prototype.init = function() {};

  LayerOffsets.prototype.display = function(ctx) {};

  return LayerOffsets;

})();
