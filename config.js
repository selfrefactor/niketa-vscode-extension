const base = {
    tooltip:'',
    closeAfter: 5000,
    enabled: true
}

exports.config = {
  bar: {
    ...base,
    text:'NIKETA_READY',
  },
  secondBar: {
    ...base,
    text:'MODE@INIT2',
  },
  thirdBar: {
    ...base,
    text:'MODE@INIT3',
  },
}