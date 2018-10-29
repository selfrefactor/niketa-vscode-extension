const {MODES} = require('./constants')

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
    text:MODES[0],
    afterText:'',
  },
  thirdBar: {
    ...base,
    text:'INFO BAR',
    afterText:'',
  },
}