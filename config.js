const base = {
    tooltip:'',
    closeAfter: 5000,
    enabled: true
}

exports.config = {
  bar: {
    ...base,
    text:'NIKETA',
    afterText:'=',
  },
  secondBar: {
    ...base,
    text:'DEFAULT MODE',
    afterText:'',
  },
  thirdBar: {
    ...base,
    text:'LINT STATUS',
    afterText:'',
  },
}