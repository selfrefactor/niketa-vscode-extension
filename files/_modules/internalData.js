let dataHolder = {}

const getData = key => dataHolder[key]

const setData = (key, value) => {
  dataHolder[key] = value
}

exports.getData = getData
exports.setData = setData

