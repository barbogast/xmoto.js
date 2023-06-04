export function distance_between_points(point1, point2) {
  const a = Math.pow(point1.x - point2.x, 2)
  const b = Math.pow(point1.y - point2.y, 2)
  return Math.sqrt(a + b)
}

export function angle_between_points(point1, point2) {
  if (point1.y - point2.y === 0) {
    if (point1.y > point2.y) {
      return Math.PI / 2
    } else {
      return -Math.PI / 2
    }
  } else {
    if (point1.y > point2.y) {
      return -Math.atan((point1.x - point2.x) / (point1.y - point2.y))
    } else {
      return -Math.atan((point2.x - point1.x) / (point2.y - point1.y)) + Math.PI
    }
  }
}

// Rotate point from angle around axe
export function rotate_point(point, angle, rotation_axe) {
  return {
    x: rotation_axe.x + point.x * Math.cos(angle) - point.y * Math.sin(angle),
    y: rotation_axe.y + point.x * Math.sin(angle) + point.y * Math.cos(angle),
  }
}

// If shape has 3 collinear vertices, move them around to avoid that
export function not_collinear_vertices(vertices) {
  const size = vertices.length
  for (const [i, vertex] of vertices.entries()) {
    if (vertex.x === vertices[(i + 1) % size].x && vertices[(i + 2) % size].x) {
      vertex.x = vertex.x + 0.001
      vertices[(i + 1) % size].x = vertex.x - 0.001
    }
    if (vertex.y === vertices[(i + 1) % size].y && vertices[(i + 2) % size].y) {
      vertex.y = vertex.y + 0.001
      vertices[(i + 1) % size].y = vertex.y - 0.001
    }
  }
  return false
}
