'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Icosahedron } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

function GlowMesh() {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.08;
            meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.12;
        }
    });

    return (
        <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.8}>
            <Icosahedron ref={meshRef} args={[2, 4]} position={[2, 0, -1]}>
                <MeshDistortMaterial
                    color="#00ff88"
                    attach="material"
                    distort={0.25}
                    speed={1.5}
                    roughness={0.6}
                    metalness={0.3}
                    wireframe={true}
                    transparent={true}
                    opacity={0.15}
                />
            </Icosahedron>
        </Float>
    );
}

function GridParticles() {
    const count = 80;
    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 20;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }
        return pos;
    }, []);

    const ref = useRef<THREE.Points>(null);

    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.y = state.clock.getElapsedTime() * 0.02;
        }
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                color="#00ff88"
                size={0.03}
                transparent
                opacity={0.4}
                sizeAttenuation
            />
        </points>
    );
}

export default function HeroScene() {
    return (
        <div className="w-full h-full absolute inset-0 -z-10">
            <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
                <ambientLight intensity={0.15} />
                <directionalLight position={[5, 5, 5]} intensity={0.3} color="#00ff88" />
                <directionalLight position={[-5, -5, 5]} intensity={0.1} color="#004422" />
                <GlowMesh />
                <GridParticles />
            </Canvas>
        </div>
    );
}
