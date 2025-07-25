import React from 'react'
import { createRoot } from 'react-dom/client'
import { ThreeCanary, defaultConfig } from './lib'

import './styles.css'

// Utils
const choose = (choices) => {
  let index = Math.floor(Math.random() * choices.length)
  return choices[index]
}

const nodesDataFactory = (n) => {
  let data = []
  for (let i = 0; i < n; i += 1) {
    data.push({
      id: Math.floor(Math.random() * 100),
      name: choose(['Arthur C. Clarke', 'Douglas Adams', 'Isaac Asimov']),
      level: choose(['human', 'cyborg']),
      hash: choose(['0x08eded6a76d84e309e3f09705ea2853f', '0xdeadbeefe6a76d84e309e3f09705ea28589']),
      img: choose(['/assets/t1.jpg', '/assets/t2.jpg'])
    })
  }
  return data
}

// Example hosting component
class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      nodesData: nodesDataFactory(150),
      nodeSelected: null
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  render() {
    return (
      <>
        <div
          className={'App'}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            height: '100%'
          }}
        >
          <ThreeCanary
            objectUrl={defaultConfig['cyborg'].objectUrl}
            nodes={this.state.nodesData}
            onNodeClick={(nodeId) => {
              console.log('onNodeClick', nodeId)
            }}
            config={defaultConfig['cyborg']}
          />

          <div
            className={'Info'}
            style={{
              padding: 10,
              color: this.state.nodeSelected ? this.state.nodeSelected.color : '#ffffff'
            }}
          >
            {this.state.nodeSelected ? this.state.nodeSelected.name : ''}
          </div>
        </div>
      </>
    )
  }
}

const rootElement = document.getElementById('root')
const root = createRoot(rootElement)
root.render(<App />)
