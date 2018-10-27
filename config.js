const base = {
    tooltip:'',
    closeAfter: 5000,
    enabled: true
}

exports.config = {
  bar: {
    ...base,
    text:'NIKETA_READY',
    afterText:'===',
  },
  secondBar: {
    ...base,
    afterText:'---',
    text:'MODE@INIT2',
  },
  thirdBar: {
    ...base,
    afterText:'||',
    text:'MODE@INIT3',
  },
}