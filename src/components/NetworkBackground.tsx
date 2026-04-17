import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════
//  SUBTLE CYBER SPHERE — toned-down version for UI readability
// ═══════════════════════════════════════════════════════════════

const sphereVertexShader = `
  uniform float uTime;
  uniform vec2  uMouse;
  varying vec3  vNormal;
  varying vec3  vPosition;
  varying float vDisplace;

  vec3 mod289v(vec3 x){ return x - floor(x*(1./289.))*289.; }
  vec4 mod289v(vec4 x){ return x - floor(x*(1./289.))*289.; }
  vec4 permute(vec4 x){ return mod289v(((x*34.)+1.)*x); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291-0.85373472*r; }

  float snoise(vec3 v){
    const vec2 C=vec2(1./6.,1./3.);
    const vec4 D=vec4(0.,.5,1.,2.);
    vec3 i=floor(v+dot(v,C.yyy));
    vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);
    vec3 l=1.-g;
    vec3 i1=min(g.xyz,l.zxy);
    vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;
    vec3 x2=x0-i2+C.yyy;
    vec3 x3=x0-D.yyy;
    i=mod289v(i);
    vec4 p=permute(permute(permute(
      i.z+vec4(0.,i1.z,i2.z,1.))
      +i.y+vec4(0.,i1.y,i2.y,1.))
      +i.x+vec4(0.,i1.x,i2.x,1.));
    float n_=.142857142857;
    vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z);
    vec4 y_=floor(j-7.*x_);
    vec4 x=x_*ns.x+ns.yyyy;
    vec4 y=y_*ns.x+ns.yyyy;
    vec4 h=1.-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);
    vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.+1.;
    vec4 s1=floor(b1)*2.+1.;
    vec4 sh=-step(h,vec4(0.));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
    vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);
    vec3 p1=vec3(a0.zw,h.y);
    vec3 p2=vec3(a1.xy,h.z);
    vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
    vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
    m=m*m;
    return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  void main(){
    vNormal   = normalize(normalMatrix * normal);
    vPosition = position;
    float t      = uTime * 0.18;
    float noise  = snoise(vec3(normal.x*2.+t, normal.y*2.+t, normal.z*2.+t));
    float noise2 = snoise(vec3(normal.x*3.-t*.5, normal.y*3., normal.z*3.+t*.4));
    float d      = noise*0.14 + noise2*0.06;
    vDisplace    = d;
    vec3 displaced = position + normal*(d+0.01);
    displaced.xy += uMouse * 0.15 * sin(uTime*0.4+position.z);
    gl_Position  = projectionMatrix * modelViewMatrix * vec4(displaced,1.);
  }
`;

const sphereFragmentShader = `
  uniform float uTime;
  varying vec3  vNormal;
  varying vec3  vPosition;
  varying float vDisplace;

  void main(){
    vec3 viewDir  = normalize(cameraPosition - vPosition);
    float fresnel = pow(1. - dot(vNormal, viewDir), 3.5);

    vec3 colA = vec3(0.10, 0.05, 0.35);
    vec3 colB = vec3(0.35, 0.15, 0.65);
    vec3 colC = vec3(0.55, 0.30, 0.85);

    float band  = sin(vPosition.y * 5. + uTime * 0.9) * 0.5 + 0.5;
    float pulse = sin(uTime * 0.6 + vDisplace*8.) * 0.5 + 0.5;

    vec3 base  = mix(colA, colB, band);
    base       = mix(base, colC, vDisplace * 1.8);
    vec3 rim   = mix(colB, vec3(0.5, 0.9, 1.0), fresnel);

    vec3 final = mix(base * 0.18, rim, fresnel * 0.45);
    final     += base * pulse * 0.05;

    float lat  = abs(sin(vPosition.y * 12.));
    float lon  = abs(sin(vPosition.x * 12.));
    float grid = smoothstep(0.95, 1.0, max(lat,lon));
    final     += vec3(0.05, 0.45, 0.65) * grid * 0.25;

    float alpha = 0.08 + fresnel * 0.22 + grid * 0.15;
    gl_FragColor = vec4(final, alpha);
  }
`;

// ── PARTICLE RING shaders ──────────────────────────────────────────
const ringVertexShader = `
  attribute float aAngle;
  attribute float aRadius;
  attribute float aSpeed;
  attribute float aSize;
  uniform   float uTime;
  varying   float vAlpha;

  void main(){
    float angle  = aAngle + uTime * aSpeed;
    float x      = cos(angle) * aRadius;
    float z      = sin(angle) * aRadius;
    float y      = position.y;
    vAlpha       = 0.15 + 0.25 * abs(sin(angle * 2.3 + uTime));
    vec4 mv      = modelViewMatrix * vec4(x, y, z, 1.);
    gl_PointSize = aSize * (180. / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`;
const ringFragmentShader = `
  varying float vAlpha;
  void main(){
    vec2  c = 2.*gl_PointCoord - 1.;
    float r = dot(c,c);
    if(r > 1.) discard;
    gl_FragColor = vec4(0.45, 0.15, 0.85, vAlpha * 0.7);
  }
`;

// ── Deep field shaders ─────────────────────────────────────────────
const fieldVertShader = `
  attribute float aSize;
  attribute vec3  aColor;
  attribute float aOff;
  uniform   float uTime;
  varying   vec3  vCol;
  void main(){
    vCol = aColor;
    float pulse = sin(uTime*0.3 + aOff)*0.5+0.5;
    vec4 mv = modelViewMatrix * vec4(position,1.);
    gl_PointSize = aSize*(160./-mv.z)*(0.6+pulse*0.4);
    gl_Position  = projectionMatrix*mv;
  }
`;
const fieldFragShader = `
  varying vec3 vCol;
  void main(){
    vec2 c=2.*gl_PointCoord-1.;
    float r=dot(c,c);
    if(r>1.)discard;
    gl_FragColor=vec4(vCol*0.7, exp(-r*4.) * 0.5);
  }
`;

// ═══════════════════════════════════════════════════════════════
//  MODULE-LEVEL precomputed particle data (avoids Math.random
//  inside useMemo → no react-hooks/purity errors)
// ═══════════════════════════════════════════════════════════════

// Orbit ring particles
const RING_N = 1800;
const RING_DATA = (() => {
  const angles = new Float32Array(RING_N);
  const radii  = new Float32Array(RING_N);
  const speeds = new Float32Array(RING_N);
  const sizes  = new Float32Array(RING_N);
  const ys     = new Float32Array(RING_N);
  const pos    = new Float32Array(RING_N * 3);
  for (let i = 0; i < RING_N; i++) {
    const ring = Math.floor(Math.random() * 4);
    radii[i]   = 7.0 + ring * 1.6 + Math.random() * 0.5;
    speeds[i]  = (0.04 + Math.random() * 0.15) * (Math.random() > 0.5 ? 1 : -1);
    sizes[i]   = Math.random() * 1.2 + 0.3;
    ys[i]      = (Math.random() - 0.5) * 0.3;
    pos[i*3]   = 0;
    pos[i*3+1] = ys[i];
    pos[i*3+2] = 0;
  }
  return { angles, radii, speeds, sizes, positions: pos };
})();

// Deep field particles
const FIELD_N = 12000;
const FIELD_DATA = (() => {
  const positions = new Float32Array(FIELD_N * 3);
  const colors    = new Float32Array(FIELD_N * 3);
  const sizes     = new Float32Array(FIELD_N);
  const offs      = new Float32Array(FIELD_N);
  const palette   = [
    new THREE.Color('#8B5CF6'), new THREE.Color('#C084FC'),
    new THREE.Color('#4a2891'), new THREE.Color('#2e1065'),
  ];
  for (let i = 0; i < FIELD_N; i++) {
    const r   = 20 + Math.pow(Math.random(), 0.4) * 60;
    const th  = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i*3]   = r * Math.sin(phi) * Math.cos(th);
    positions[i*3+1] = r * Math.sin(phi) * Math.sin(th);
    positions[i*3+2] = r * Math.cos(phi);
    const c = palette[Math.floor(Math.random() * palette.length)].clone();
    c.lerp(new THREE.Color('#020306'), Math.min(1, r / 55));
    colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b;
    sizes[i] = Math.random() * 0.5 + 0.05;
    offs[i]  = Math.random() * Math.PI * 2;
  }
  return { positions, colors, sizes, offs };
})();

// ═══════════════════════════════════════════════════════════════
//  COMPONENTS
// ═══════════════════════════════════════════════════════════════

function CyberSphere({ mouseRef }: { mouseRef: React.MutableRefObject<[number,number]> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef  = useRef<THREE.ShaderMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const [mx, my] = mouseRef.current;
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.04 + mx * 0.08;
      meshRef.current.rotation.x = t * 0.03 + my * 0.06;
    }
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = t;
      matRef.current.uniforms.uMouse.value.x += (mx - matRef.current.uniforms.uMouse.value.x) * 0.04;
      matRef.current.uniforms.uMouse.value.y += (my - matRef.current.uniforms.uMouse.value.y) * 0.04;
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[5.8, 20]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={sphereVertexShader}
        fragmentShader={sphereFragmentShader}
        uniforms={{
          uTime:  { value: 0 },
          uMouse: { value: new THREE.Vector2(0, 0) },
        }}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function OrbitRings() {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position"  count={RING_N} array={RING_DATA.positions} itemSize={3} args={[RING_DATA.positions, 3]} />
        <bufferAttribute attach="attributes-aAngle"    count={RING_N} array={RING_DATA.angles}    itemSize={1} args={[RING_DATA.angles, 1]} />
        <bufferAttribute attach="attributes-aRadius"   count={RING_N} array={RING_DATA.radii}     itemSize={1} args={[RING_DATA.radii, 1]} />
        <bufferAttribute attach="attributes-aSpeed"    count={RING_N} array={RING_DATA.speeds}    itemSize={1} args={[RING_DATA.speeds, 1]} />
        <bufferAttribute attach="attributes-aSize"     count={RING_N} array={RING_DATA.sizes}     itemSize={1} args={[RING_DATA.sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={ringVertexShader}
        fragmentShader={ringFragmentShader}
        uniforms={{ uTime: { value: 0 } }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function DeepField() {
  const ref    = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.getElapsedTime();
    if (ref.current)    ref.current.rotation.y += 0.0002;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={FIELD_N} array={FIELD_DATA.positions} itemSize={3} args={[FIELD_DATA.positions, 3]} />
        <bufferAttribute attach="attributes-aColor"   count={FIELD_N} array={FIELD_DATA.colors}    itemSize={3} args={[FIELD_DATA.colors, 3]} />
        <bufferAttribute attach="attributes-aSize"    count={FIELD_N} array={FIELD_DATA.sizes}     itemSize={1} args={[FIELD_DATA.sizes, 1]} />
        <bufferAttribute attach="attributes-aOff"     count={FIELD_N} array={FIELD_DATA.offs}      itemSize={1} args={[FIELD_DATA.offs, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={fieldVertShader}
        fragmentShader={fieldFragShader}
        uniforms={{ uTime: { value: 0 } }}
        transparent depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ── ROOT SCENE ─────────────────────────────────────────────────────
function Scene() {
  const mouseRef = useRef<[number, number]>([0, 0]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      mouseRef.current = [
        (e.clientX / window.innerWidth)  * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1,
      ];
    };
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);

  return (
    <>
      <fog attach="fog" args={['#01020a', 14, 80]} />
      <CyberSphere mouseRef={mouseRef} />
      <OrbitRings />
      <DeepField />
    </>
  );
}

export default function NetworkBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', inset: 0, background: '#01020a' }} />

      <Canvas camera={{ position: [0, 0, 22], fov: 50 }} style={{ position: 'absolute', inset: 0 }}>
        <Scene />
      </Canvas>

      {/* Strong dark overlay for UI readability */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse 55% 45% at 50% 50%, rgba(1,2,10,0.55) 0%, rgba(1,2,10,0.88) 65%, rgba(1,2,10,0.97) 100%),
          radial-gradient(circle at 20% 30%, rgba(10,80,200,0.04) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(13,160,140,0.03) 0%, transparent 50%)
        `,
        pointerEvents: 'none',
      }} />
    </div>
  );
}
