import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import BouquetModel from "./BouquetModel";

export default function Canvas3D() {
  return (
    <div style={{ width: "100%", height: "420px" }}>
      <Canvas camera={{ position: [0, 0.8, 2.5], fov: 50 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 2, 2]} intensity={1.2} />
        <Suspense fallback={null}>
          <BouquetModel />
        </Suspense>
      </Canvas>
    </div>
  );
}
