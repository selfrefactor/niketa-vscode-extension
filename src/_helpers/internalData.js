let dataHolder = {}

const getter = key => dataHolder[key]

const setter = (key, value) => {
  dataHolder[key] = value
}

exports.getter = getter
exports.setter = setter

