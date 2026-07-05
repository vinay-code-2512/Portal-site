/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
  namespace JSX {
    interface IntrinsicElements {
      primitive: any;
      group: any;
      mesh: any;
      ambientLight: any;
      directionalLight: any;
      pointLight: any;
      spotLight: any;
      perspectiveCamera: any;
      bufferGeometry: any;
      bufferAttribute: any;
      planeGeometry: any;
      boxGeometry: any;
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      points: any;
      pointsMaterial: any;
      color: any;
      fog: any;
      rectAreaLight: any;
    }
  }
}

export {};
