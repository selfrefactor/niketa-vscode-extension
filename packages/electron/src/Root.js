import './App.css'
import React, { Component } from 'react'
import Sockette from 'sockette'
import { ipcRenderer } from 'electron'

const DEMO_LINES = [
  'aa ff'.repeat(5),
  'are faa'.repeat(15),
  'aa ff'.repeat(25),
  'are faa'.repeat(35),
  'ww ffwww'.repeat(25),
  'uuu uufaa uu'.repeat(35),
]

export default class Root extends Component{
  constructor(props){
    super(props)
    this.state = {
      lines : [],
      hold  : false,
    }
    this.holdOn = this.holdOn.bind(this)
  }

  holdOn(){
    this.setState({ hold : true })
    ipcRenderer.send('holdon', '')
  }

  componentDidMount(){
    new Sockette('ws://localhost:3013', {
      timeout     : 5e3,
      maxAttempts : 25,
      onopen      : () => console.log('Connected 1'),
      onclose     : () => console.log('Closed 1'),
      onerror     : e => console.log('Error 1', e),
      onmessage   : ({ data }) => {
        const parsed = data.split('\n')

        this.setState({
          hold  : false,
          lines : parsed,
        })
      },
    })

    new Sockette('ws://localhost:3023', {
      timeout     : 5e3,
      maxAttempts : 25,
      onopen      : () => console.log('Connected 2'),
      onclose     : () => console.log('Closed 2'),
      onerror     : e => console.log('Error 2', e),
      onmessage   : ({ data }) => {
        const parsed = data.split('\n')

        this.setState({
          hold  : false,
          lines : parsed,
        })
      },
    })
  }

  render(){
    const style = this.state.hold ?
      { outline : '1px solid #DF897A' } :
      {}

    return (
      <div
        className="container" style={ style }
        onClick={ this.holdOn }
      >
        {this.state.lines.map((x, i) =>

          <p key={ i }>
            {x}
          </p>

        )}
      </div>
    )
  }
}
