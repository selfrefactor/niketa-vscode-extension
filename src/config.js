const base = {
    tooltip:'',
    closeAfter: 5000,
    enabled: true
}

exports.config = {
  bar: {
    ...base,
    text:'NIKETA',
    afterText:'NIKETA',
  },
  secondBar: {
    ...base,
    text:'',
    afterText:'',
  },
  thirdBar: {
    ...base,
    text:'',
    afterText:'',
  },
}