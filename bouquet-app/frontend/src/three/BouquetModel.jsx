import { useLoader, useFrame } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { useRef } from "react";

export default function BouquetModel() {
  const gltf = useLoader(GLTFLoader, "/scene.gltf");
  const modelRef = useRef();

  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.005; // Auto-rotate on Y axis
    }
  });

  return (
    <primitive
      ref={modelRef}
      object={gltf.scene}
      scale={3.5}
      position={[0, -0.5, 0]}
      rotation={[0, 0, -0.15]}
    />
  );
}
