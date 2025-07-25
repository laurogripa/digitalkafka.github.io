// https://github.com/jsx-eslint/eslint-plugin-react/issues/3423
/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
import { useGLTF, useHelper, Instances, Instance, OrbitControls, Html, Text } from '@react-three/drei'
import { useThree, extend, useFrame } from '@react-three/fiber'
import React, { useMemo, useRef, useState, useLayoutEffect, useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import * as THREE from 'three'
import { OrbitControls as OC } from 'three/examples/jsm/controls/OrbitControls'
import { brandPalette, resolve, randomN } from './helpers'

const color = new THREE.Color()

const Texts = () => {
  const textsGroupRef = useRef()

  useFrame(({ camera }) => {
    if (textsGroupRef.current) {
      const { x, y, z } = camera.rotation
      textsGroupRef.current.rotation.set(x, y, z)
    }
  })

  const createTextMesh = (text, position, color, fontSize, fontWeight) => {
    return (
      <Text
        key={text}
        position={position}
        color={color}
        fontSize={fontSize}
        fontWeight={fontWeight}
        maxWidth={10}
        lineHeight={1}
        letterSpacing={-0.05}
        textAlign="center"
      >
        {text}
      </Text>
    )
  }

  return (
    <group ref={textsGroupRef}>
      {createTextMesh('WANTED', [0, 2.75, 0], 'red', 0.5)}
      {createTextMesh('FOR SUBVERSION', [0, 2.35, 0], 'white', 0.25)}
      {createTextMesh('REWARD $150.000', [0, -0.65, 0], 'white', 0.25)}
      {createTextMesh('DEAD OR ALIVE', [0, -1, 0], 'white', 0.25, 'bold')}
    </group>
  )
}

const Points = ({ objectUrl, nodesData, onNodeClick, config }) => {
  // Note: useGLTF caches it already
  const { nodes } = useGLTF(objectUrl ? objectUrl : config.objectUrl)
  const [selected, setSelected] = useState(0)

  // Or nodes.Scene.children[0].geometry.attributes.position
  const positions = config.nodeCoords ? resolve(config.nodeCoords, nodes) : []
  const numPositions = positions ? positions.count : 0
  const numNodes = nodesData.length
  const randomIndexes = useMemo(() => randomN(0, numPositions, numNodes), [numPositions, numNodes])

  const selectedPositions = randomIndexes.map((i) => [positions.getX(i), positions.getY(i), positions.getZ(i)])

  const handleSelectedNode = (nodeId) => {
    setSelected(nodeId)
  }

  return (
    <>
      {selected ? (
        <group scale={config.nodeGroupScale}>
          <PointDialog
            position={selectedPositions[selected]}
            dialogData={nodesData[selected]}
            onNodeClick={onNodeClick}
            config={config}
          />
        </group>
      ) : null}
      <Instances
        range={selectedPositions.length}
        material={new THREE.MeshBasicMaterial()}
        geometry={new THREE.SphereGeometry(0.1)}
      >
        {selectedPositions.map((position, i) => (
          <Point
            key={i}
            nodeId={i}
            position={position}
            onNodeSelected={handleSelectedNode}
            dialogData={nodesData[selected]}
            onNodeClick={onNodeClick}
            config={config}
            primaryColor={config.pointColorIndex.primary}
            hoveredColor={config.pointColorIndex.hovered}
            activeColor={config.pointColorIndex.active}
          />
        ))}
      </Instances>
    </>
  )
}

const Point = ({
  nodeId,
  position,
  dialogData,
  onNodeSelected,
  onNodeClick,
  config,
  primaryColor,
  hoveredColor,
  activeColor
}) => {
  const ref = useRef()
  const [hovered, setHover] = useState(false)
  const [active] = useState(false)

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    const defaultScale = config.nodeScale
    ref.current.position.x = position[0] * config.nodeSigns[0]
    ref.current.position.z = position[1] * config.nodeSigns[1]
    ref.current.position.y = position[2] * config.nodeSigns[2]
    ref.current.scale.x = ref.current.scale.y = ref.current.scale.z = defaultScale
    ref.current.scale.x =
      ref.current.scale.y =
      ref.current.scale.z =
        THREE.MathUtils.lerp(ref.current.scale.z, hovered ? 6 : 1, defaultScale)
    ref.current.scale.x =
      ref.current.scale.y =
      ref.current.scale.z =
        THREE.MathUtils.lerp(ref.current.scale.z, active ? 5 : 1, defaultScale)
    ref.current.color.lerp(
      color.set(hovered || active ? brandPalette[hoveredColor] : brandPalette[primaryColor]),
      hovered || active ? 1 : defaultScale
    )

    if (hovered) {
      ref.current.color.lerp(
        color.set(hovered ? brandPalette[hoveredColor] : brandPalette[primaryColor]),
        hovered ? 1 : defaultScale
      )
    }

    if (active) {
      ref.current.scale.x = ref.current.scale.y = ref.current.scale.z += Math.sin(t) / 4
      ref.current.color.lerp(
        color.set(active ? brandPalette[activeColor] : brandPalette[primaryColor]),
        active ? 1 : defaultScale
      )
    }
  })
  return (
    <group scale={config.nodeGroupScale}>
      <>
        <Instance
          ref={ref}
          onPointerOver={(e) => (e.stopPropagation(), setHover(true), onNodeSelected(nodeId))}
          onPointerOut={() => setHover(false)}
          onClick={() => onNodeClick(dialogData.hash)}
        />
      </>
    </group>
  )
}

const PointDialog = ({ position, dialogData, config }) => {
  const ref = useRef()

  const scale = 1.002

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    ref.current.position.copy(
      new THREE.Vector3(
        position[0] * config.nodeSigns[0] * scale,
        position[2] * config.nodeSigns[2] * scale,
        position[1] * config.nodeSigns[1] * scale
      )
    )
    ref.current.scale.x = ref.current.scale.y = ref.current.scale.z = 0.05
    ref.current.position.y += Math.sin(t) / 16
  })
  return (
    <mesh ref={ref}>
      <meshStandardMaterial roughness={0.75} metalness={0.8} emissive={brandPalette.ciano} />
      <Html distanceFactor={2}>
        <DialogContent>{dialogData.hash ? <DialogHash>{dialogData.hash}</DialogHash> : null}</DialogContent>
      </Html>
    </mesh>
  )
}

const Model = (props) => {
  const { scene, nodes, materials } = useGLTF(props.objectUrl)
  const modelRef = useRef()
  const boxHelperRef = useRef()

  useLayoutEffect(() => {
    if (props.meshScale && nodes.canary) {
      nodes.canary.scale.set(4, 4, 4)
    }

    scene.traverse((obj) => {
      if (obj.type === 'Mesh') {
        obj.receiveShadow = true
        obj.castShadow = true
      }
    })

    const material = materials[props.model.material]
    Object.assign(material, {
      wireframe: false,
      metalness: props.model.metalness,
      roughness: props.model.roughness,
      opacity: props.model.opacity,
      color: new THREE.Color(brandPalette[props.model.color])
    })

    const boxHelper = new THREE.BoxHelper(modelRef.current, 0xffffff)
    const scaleFactor = new THREE.Vector3(4, 4, 4)
    boxHelper.scale.copy(scaleFactor)

    scene.add(boxHelper)
    boxHelperRef.current = boxHelper

    return () => {
      scene.remove(boxHelperRef.current)
    }
  }, [scene, nodes, materials, props])

  return <primitive object={scene} ref={modelRef} {...props} />
}

const Lights = ({ config }) => {
  const groupL = useRef()
  const groupR = useRef()
  const front = useRef()
  const lightL = useRef()
  const lightR = useRef()
  const lightF = useRef()

  useFrame((state) => {
    const t = state.clock.getElapsedTime()

    // storm effect
    let currentPosition = 15
    if (parseInt(t) % 4 === 1) {
      currentPosition = (Math.random() * 15) | 0
    }

    groupL.current.position.x = (Math.sin(t) / 4) * currentPosition
    groupL.current.position.y = (Math.cos(t) / 4) * currentPosition
    groupL.current.position.z = (Math.cos(t) / 4) * currentPosition

    groupR.current.position.x = (Math.cos(t) / 4) * 10
    groupR.current.position.y = (Math.sin(t) / 4) * 10
    groupR.current.position.z = (Math.sin(t) / 4) * 10

    front.current.position.x = (Math.sin(t) / 4) * 10
    front.current.position.y = (Math.cos(t) / 4) * 10
    front.current.position.z = (Math.sin(t) / 4) * 10
  })

  if (config.debug === true) {
    useHelper(lightL, THREE.PointLightHelper)
    useHelper(lightR, THREE.PointLightHelper)
    useHelper(lightF, THREE.PointLightHelper)
  }

  return (
    <>
      <group ref={groupL}>
        <pointLight
          ref={lightL}
          color={brandPalette[config.pointLight.color[0]]}
          position={config.pointLight.position}
          distance={config.pointLight.distance}
          intensity={config.pointLight.intensity[0]}
        />
      </group>
      <group ref={groupR}>
        <pointLight
          ref={lightR}
          color={brandPalette[config.pointLight.color[1]]}
          position={config.pointLight.position}
          distance={config.pointLight.distance}
          intensity={config.pointLight.intensity[1]}
        />
      </group>
      <group ref={front}>
        <pointLight
          ref={lightF}
          color={brandPalette[config.pointLight.color[2]]}
          position={config.pointLight.position}
          distance={config.pointLight.distance}
          intensity={config.pointLight.intensity[2]}
        />
      </group>
    </>
  )
}

const Particles = ({ count }) => {
  const mesh = useRef()

  const dummy = useMemo(() => new THREE.Object3D(), [])

  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100
      const factor = 20 + Math.random() * 10
      const speed = 0.001 + Math.random() / 20000
      const xFactor = -5 + Math.random() * 10
      const yFactor = -5 + Math.random() * 10
      const zFactor = -5 + Math.random() * 10
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 })
    }
    return temp
  }, [count])

  useFrame(() => {
    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle

      t = particle.t += speed / 4
      const a = Math.cos(t) + Math.sin(t * 1) / 10
      const b = Math.sin(t) + Math.cos(t * 2) / 10
      const s = Math.cos(t) / 6

      dummy.position.set(
        (particle.mx / 10) * a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
        (particle.my / 10) * b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
        (particle.my / 10) * b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
      )
      dummy.scale.set(s, s, s)
      dummy.rotation.set(s * 5, s * 5, s * 5)
      dummy.updateMatrix()

      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })
  return (
    <>
      <instancedMesh ref={mesh} args={[null, null, count]}>
        <sphereGeometry args={[1]} />
        <pointsMaterial color={brandPalette.red} size={0.02} transparent={true} sizeAttenuation={false} opacity={0.1} />
      </instancedMesh>
    </>
  )
}

extend({ OC })

const CameraControls = ({ config }) => {
  const controlsRef = useRef()
  const { camera, gl } = useThree()

  useEffect(() => {
    if (!config.debug) return

    const controls = new OC(camera, gl.domElement)

    controls.addEventListener('change', () => {
      console.log(camera.position)
      console.log(controlsRef.current.target)
    })

    return () => controls.dispose()
  }, [controlsRef, camera, gl.domElement])

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(config.targetPosition[0], config.targetPosition[1], config.targetPosition[2])
      controlsRef.current.update()
    }
  }, [controlsRef, camera, gl])

  return (
    <OrbitControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      minPolarAngle={Math.PI / 2.8}
      maxPolarAngle={Math.PI / 2.1}
    />
  )
}

// Styling
const fadeIn = keyframes`
    0% {
      opacity: 0;
    }
    100% {
      opacity: 0.9;
    }
  `

const DialogContent = styled.div`
  animation: ${fadeIn} ease-in-out 0.5s;
  animation-iteration-count: 1;
  animation-fill-mode: forwards;

  text-align: left;
  background: ${brandPalette.magenta};

  color: ${brandPalette.white};
  padding: 10px 20px;
  border-radius: 5px;
  margin: 20px 0 0 20px;

  font-family: monospace;
`

const DialogHash = styled.div`
  color: ${brandPalette.white};
  padding-top: 5px;
`

export { CameraControls, Lights, Model, Particles, Point, Points, Texts }
