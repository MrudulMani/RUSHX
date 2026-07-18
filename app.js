// RUSH X Fitness Studio - Tactical 3D Anatomy Engine & Web Interactions

document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     1. WORKOUT DATABASE (Shared by 3D Engine & HUD)
     ========================================================================== */
  const workoutDatabase = {
    chest: {
      title: "PECTORALIS MAJOR",
      function: "Arm Adduction & Flexion",
      workouts: [
        "Bench Press (Intermediate)",
        "Dumbbell Flys (Beginner)",
        "Cable Crossovers (Advanced)"
      ]
    },
    shoulders: {
      title: "DELTOIDS",
      function: "Arm Abduction & Rotation",
      workouts: [
        "Overhead Press (Intermediate)",
        "Lateral Raises (Beginner)",
        "Face Pulls (Intermediate)"
      ]
    },
    arms: {
      title: "BICEPS BRACHII",
      function: "Elbow Flexion & Forearm Supination",
      workouts: [
        "Barbell Curls (Beginner)",
        "Incline Dumbbell Curls (Intermediate)",
        "Hammer Curls (Beginner)"
      ]
    },
    triceps: {
      title: "TRICEPS BRACHII",
      function: "Elbow Extension",
      workouts: [
        "Close Grip Bench (Intermediate)",
        "Overhead Extensions (Advanced)",
        "Rope Pushdowns (Beginner)"
      ]
    },
    core: {
      title: "ABDOMINALS",
      function: "Spinal Flexion & Core Stability",
      workouts: [
        "Hanging Knee Raises (Beginner)",
        "Cable Ab Crunches (Intermediate)",
        "Plank holds (Beginner)"
      ]
    },
    quads: {
      title: "QUADRICEPS",
      function: "Knee Extension & Hip Flexion",
      workouts: [
        "Barbell Squats (Intermediate)",
        "Hack Squats (Advanced)",
        "Leg Extensions (Beginner)"
      ]
    },
    back: {
      title: "LATISSIMUS DORSI",
      function: "Shoulder Extension & Adduction",
      workouts: [
        "Bent Over Rows (Intermediate)",
        "Lat Pulldowns (Beginner)",
        "Dumbbell Pullovers (Advanced)"
      ]
    },
    glutes: {
      title: "GLUTEUS MAXIMUS",
      function: "Hip Extension & External Rotation",
      workouts: [
        "Barbell Hip Thrusts (Intermediate)",
        "Bulgarian Split Squats (Advanced)"
      ]
    },
    hamstrings: {
      title: "HAMSTRINGS",
      function: "Knee Flexion & Hip Extension",
      workouts: [
        "Romanian Deadlifts (Intermediate)",
        "Lying Leg Curls (Beginner)"
      ]
    },
    calves: {
      title: "CALVES",
      function: "Plantar Flexion & Ankle Mobility",
      workouts: [
        "Standing Calf Raises (Beginner)",
        "Seated Calf Raises (Intermediate)"
      ]
    }
  };

  /* ==========================================================================
     2. THREE.JS 3D SCENE SETUP & ENGINE (Tactical Dark Grid Style)
     ========================================================================= */
  const canvas = document.getElementById('three-canvas');
  const container = document.getElementById('canvas-container');
  const wrapper = document.getElementById('scene-wrapper');
  
  if (canvas && container) {
    let scene, camera, renderer, controls;
    let mannequinGroup;
    let chestMeshRef = null; // Tracked target for projected leader line
    let interactiveMeshes = [];
    let hoveredMuscleKey = null;
    let selectedMuscleKey = null;
    let fiberBumpTexture = null;

    // Default positions
    const defaultCameraPos = { x: 0.8, y: 0.8, z: 2.8 };
    const defaultTargetPos = { x: 0, y: 0.1, z: 0 };

    // Procedural Muscle Fiber Texture Generator
    function createFiberTexture() {
      const texCanvas = document.createElement('canvas');
      texCanvas.width = 128;
      texCanvas.height = 128;
      const ctx = texCanvas.getContext('2d');
      
      // Neutral gray base for heightmap/bumpmap
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 128, 128);
      
      // Draw fine parallel vertical lines representing muscle fibers
      ctx.strokeStyle = '#ffffff';
      for (let i = 0; i < 150; i++) {
        ctx.lineWidth = 0.5 + Math.random() * 1.5;
        ctx.globalAlpha = 0.04 + Math.random() * 0.12;
        const x = Math.random() * 128;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 128);
        ctx.stroke();
      }
      
      // Apply noise/cross striations
      ctx.strokeStyle = '#000000';
      for (let i = 0; i < 80; i++) {
        ctx.lineWidth = 0.5 + Math.random() * 1;
        ctx.globalAlpha = 0.02 + Math.random() * 0.08;
        const x = Math.random() * 128;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 128);
        ctx.stroke();
      }
      
      const texture = new THREE.CanvasTexture(texCanvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(3, 3); // Repetitions over mesh coordinates
      return texture;
    }

    // Material Definitions
    // Matte Black skeleton
    const skeletonMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a0c,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: false
    });

    // Rich reflective metallic gold material
    fiberBumpTexture = createFiberTexture();
    const goldMuscleMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Anatomical Rich Gold
      metalness: 0.95,  // Highly reflective metal
      roughness: 0.18,  // Clean, slightly brushed shine
      bumpMap: fiberBumpTexture,
      bumpScale: 0.008, // Fine muscle striations
      side: THREE.DoubleSide
    });

    const goldMuscleMaterialDimmed = goldMuscleMaterial.clone();
    goldMuscleMaterialDimmed.opacity = 0.12;
    goldMuscleMaterialDimmed.transparent = true;

    function init3D() {
      // Create Scene
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000); // Pure black environment

      // Create Camera
      camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
      camera.position.set(defaultCameraPos.x, defaultCameraPos.y, defaultCameraPos.z);

      // Create WebGLRenderer
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;

      // OrbitControls
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 1.0;
      controls.maxDistance = 5.0;
      controls.minPolarAngle = Math.PI * 0.15;
      controls.maxPolarAngle = Math.PI * 0.82; // Prevent turning upside down
      controls.target.set(defaultTargetPos.x, defaultTargetPos.y, defaultTargetPos.z);

      // Lights: dramatic three-point setup
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
      scene.add(ambientLight);

      // Cold Front Key Light
      const keyLight = new THREE.DirectionalLight(0xddeeff, 1.0);
      keyLight.position.set(2, 3, 3);
      scene.add(keyLight);

      // Warm Side Fill Light
      const fillLight = new THREE.DirectionalLight(0xffeedd, 0.4);
      fillLight.position.set(-3, -1, 1);
      scene.add(fillLight);

      // Gold Rim Light (Highlighting muscle definition contours)
      const rimLight = new THREE.DirectionalLight(0xffaa44, 2.5);
      rimLight.position.set(-2, 3, -4);
      scene.add(rimLight);

      const rimLight2 = new THREE.DirectionalLight(0xffd700, 1.5);
      rimLight2.position.set(2, 2, -4);
      scene.add(rimLight2);

      // Floors Grid (Tactical Orange lines)
      const grid = new THREE.GridHelper(12, 24, 0xff8200, 0x181818);
      grid.position.y = -1.6;
      scene.add(grid);

      // Build Mannequin group
      mannequinGroup = new THREE.Group();
      buildMannequin();
      scene.add(mannequinGroup);

      // Animation / Render loop
      animate();

      // Window resize listener
      window.addEventListener('resize', onWindowResize);
    }

    /* ==========================================================================
       3. ANATOMICAL MUSCLE SCULPTING (image_3.png style)
       ========================================================================== */
    function buildMannequin() {
      // Helper function to create skeleton bones (matte black)
      function addSkeleton(geom, pos, scale, rot = null) {
        const mesh = new THREE.Mesh(geom, skeletonMaterial);
        mesh.position.copy(pos);
        mesh.scale.copy(scale);
        if (rot) mesh.rotation.set(rot.x, rot.y, rot.z);
        mannequinGroup.add(mesh);
      }

      // Helper function to add a sculpted muscle mesh
      function addSculptedMuscle(geom, pos, scale, groupName, rot = null) {
        const mesh = new THREE.Mesh(geom, goldMuscleMaterial.clone());
        mesh.position.copy(pos);
        mesh.scale.copy(scale);
        if (rot) mesh.rotation.set(rot.x, rot.y, rot.z);
        mesh.userData = {
          muscleGroup: groupName,
          originalPosition: pos.clone(),
          originalScale: scale.clone(),
          originalRotation: rot ? rot.clone() : new THREE.Vector3(0,0,0),
          isMuscle: true
        };
        mannequinGroup.add(mesh);
        interactiveMeshes.push(mesh);
        return mesh;
      }

      // Base Geometries
      const sphereGeom = new THREE.SphereGeometry(1, 24, 24);
      const cylinderGeom = new THREE.CylinderGeometry(1, 1, 1, 16);
      const absGeom = new THREE.BoxGeometry(1, 1, 1);

      // A. Skeletal Base Structure (Matte black)
      // Head
      addSkeleton(sphereGeom, new THREE.Vector3(0, 1.3, 0), new THREE.Vector3(0.11, 0.15, 0.11));
      // Neck post
      addSkeleton(cylinderGeom, new THREE.Vector3(0, 1.1, 0), new THREE.Vector3(0.035, 0.2, 0.035));
      // Shoulder core crossbar (horizontal)
      addSkeleton(cylinderGeom, new THREE.Vector3(0, 0.9, -0.01), new THREE.Vector3(0.04, 0.44, 0.04), new THREE.Vector3(0, 0, Math.PI / 2));
      // Spine spine post
      addSkeleton(cylinderGeom, new THREE.Vector3(0, 0.35, -0.04), new THREE.Vector3(0.045, 1.1, 0.045));
      // Pelvis crossbar
      addSkeleton(cylinderGeom, new THREE.Vector3(0, -0.2, -0.04), new THREE.Vector3(0.05, 0.22, 0.05), new THREE.Vector3(0, 0, Math.PI / 2));

      // Joint Spheres (matte black joints)
      const jointGeom = new THREE.SphereGeometry(0.045, 12, 12);
      addSkeleton(jointGeom, new THREE.Vector3(-0.22, 0.9, -0.01), new THREE.Vector3(1, 1, 1)); // L shoulder joint
      addSkeleton(jointGeom, new THREE.Vector3(0.22, 0.9, -0.01), new THREE.Vector3(1, 1, 1));  // R shoulder joint
      addSkeleton(jointGeom, new THREE.Vector3(-0.25, 0.4, 0), new THREE.Vector3(1, 1, 1));     // L elbow joint
      addSkeleton(jointGeom, new THREE.Vector3(0.25, 0.4, 0), new THREE.Vector3(1, 1, 1));      // R elbow joint
      addSkeleton(jointGeom, new THREE.Vector3(-0.27, 0.02, 0), new THREE.Vector3(0.8, 0.8, 0.8)); // L wrist joint
      addSkeleton(jointGeom, new THREE.Vector3(0.27, 0.02, 0), new THREE.Vector3(0.8, 0.8, 0.8));  // R wrist joint

      // B. Sculpted Gold Muscle Meshes (Catching directional highlights)

      // 1. PECTORALIS MAJOR (Curved chest blocks, as shown in image_3.png)
      // Left Chest - Upper clavicular head
      addSculptedMuscle(sphereGeom, new THREE.Vector3(-0.08, 0.80, 0.08), new THREE.Vector3(0.085, 0.065, 0.06), 'chest', new THREE.Vector3(0.1, 0, 0.2));
      // Left Chest - Lower sternocostal head (Track target)
      chestMeshRef = addSculptedMuscle(sphereGeom, new THREE.Vector3(-0.09, 0.73, 0.07), new THREE.Vector3(0.095, 0.085, 0.065), 'chest', new THREE.Vector3(-0.1, 0.1, -0.2));
      
      // Right Chest - Upper clavicular head
      addSculptedMuscle(sphereGeom, new THREE.Vector3(0.08, 0.80, 0.08), new THREE.Vector3(0.085, 0.065, 0.06), 'chest', new THREE.Vector3(0.1, 0, -0.2));
      // Right Chest - Lower sternocostal head
      addSculptedMuscle(sphereGeom, new THREE.Vector3(0.09, 0.73, 0.07), new THREE.Vector3(0.095, 0.085, 0.065), 'chest', new THREE.Vector3(-0.1, -0.1, 0.2));

      // 2. ABDOMINALS (Sculpted 3x2 six-pack grid + side obliques)
      // Abs - Top row
      addSculptedMuscle(sphereGeom, new THREE.Vector3(-0.038, 0.52, 0.08), new THREE.Vector3(0.034, 0.042, 0.04), 'core');
      addSculptedMuscle(sphereGeom, new THREE.Vector3(0.038, 0.52, 0.08), new THREE.Vector3(0.034, 0.042, 0.04), 'core');
      // Abs - Middle row
      addSculptedMuscle(sphereGeom, new THREE.Vector3(-0.038, 0.44, 0.08), new THREE.Vector3(0.034, 0.042, 0.04), 'core');
      addSculptedMuscle(sphereGeom, new THREE.Vector3(0.038, 0.44, 0.08), new THREE.Vector3(0.034, 0.042, 0.04), 'core');
      // Abs - Bottom row
      addSculptedMuscle(sphereGeom, new THREE.Vector3(-0.038, 0.36, 0.08), new THREE.Vector3(0.034, 0.042, 0.04), 'core');
      addSculptedMuscle(sphereGeom, new THREE.Vector3(0.038, 0.36, 0.08), new THREE.Vector3(0.034, 0.042, 0.04), 'core');
      // Lower core/linea alba base
      addSculptedMuscle(sphereGeom, new THREE.Vector3(0, 0.26, 0.07), new THREE.Vector3(0.08, 0.08, 0.05), 'core');
      // External Obliques (sides of abs)
      addSculptedMuscle(cylinderGeom, new THREE.Vector3(-0.11, 0.42, 0.04), new THREE.Vector3(0.035, 0.22, 0.035), 'core', new THREE.Vector3(0, 0, 0.25));
      addSculptedMuscle(cylinderGeom, new THREE.Vector3(0.11, 0.42, 0.04), new THREE.Vector3(0.035, 0.22, 0.035), 'core', new THREE.Vector3(0, 0, -0.25));

      // 3. SHOULDERS (Three-lobed deltoid cap)
      // L Deltoid (Anterior, Lateral, Posterior lobes)
      addSculptedMuscle(sphereGeom, new THREE.Vector3(-0.25, 0.90, 0.04), new THREE.Vector3(0.065, 0.09, 0.065), 'shoulders', new THREE.Vector3(0.2, 0.1, 0.1));
      addSculptedMuscle(sphereGeom, new THREE.Vector3(-0.27, 0.90, -0.01), new THREE.Vector3(0.07, 0.10, 0.07), 'shoulders', new THREE.Vector3(0, 0, 0.15));
      addSculptedMuscle(sphereGeom, new THREE.Vector3(-0.25, 0.90, -0.05), new THREE.Vector3(0.065, 0.09, 0.065), 'shoulders', new THREE.Vector3(-0.2, -0.1, 0.1));
      
      // R Deltoid
      addSculptedMuscle(sphereGeom, new THREE.Vector3(0.25, 0.90, 0.04), new THREE.Vector3(0.065, 0.09, 0.065), 'shoulders', new THREE.Vector3(0.2, -0.1, -0.1));
      addSculptedMuscle(sphereGeom, new THREE.Vector3(0.27, 0.90, -0.01), new THREE.Vector3(0.07, 0.10, 0.07), 'shoulders', new THREE.Vector3(0, 0, -0.15));
      addSculptedMuscle(sphereGeom, new THREE.Vector3(0.25, 0.90, -0.05), new THREE.Vector3(0.065, 0.09, 0.065), 'shoulders', new THREE.Vector3(-0.2, 0.1, -0.1));

      // 4. ARMS & FOREARMS
      // Biceps (Front upper arm)
      addSculptedMuscle(cylinderGeom, new THREE.Vector3(-0.24, 0.65, 0.03), new THREE.Vector3(0.052, 0.22, 0.052), 'arms', new THREE.Vector3(0, 0, 0.1));
      addSculptedMuscle(cylinderGeom, new THREE.Vector3(0.24, 0.65, 0.03), new THREE.Vector3(0.052, 0.22, 0.052), 'arms', new THREE.Vector3(0, 0, -0.1));
      // Triceps (Back upper arm)
      addSculptedMuscle(cylinderGeom, new THREE.Vector3(-0.24, 0.63, -0.04), new THREE.Vector3(0.052, 0.24, 0.052), 'triceps', new THREE.Vector3(0, 0, 0.08));
      addSculptedMuscle(cylinderGeom, new THREE.Vector3(0.24, 0.63, -0.04), new THREE.Vector3(0.052, 0.24, 0.052), 'triceps', new THREE.Vector3(0, 0, -0.08));
      // Forearms
      addSculptedMuscle(cylinderGeom, new THREE.Vector3(-0.26, 0.21, 0.01), new THREE.Vector3(0.044, 0.32, 0.044), 'arms', new THREE.Vector3(0, 0, 0.05));
      addSculptedMuscle(cylinderGeom, new THREE.Vector3(0.26, 0.21, 0.01), new THREE.Vector3(0.044, 0.32, 0.044), 'arms', new THREE.Vector3(0, 0, -0.05));

      // 5. BACK & LATS (Wing structure)
      // Lats (Left and Right wings)
      addSculptedMuscle(absGeom, new THREE.Vector3(-0.13, 0.58, -0.07), new THREE.Vector3(0.08, 0.26, 0.045), 'back', new THREE.Vector3(0.1, 0.1, 0.28));
      addSculptedMuscle(absGeom, new THREE.Vector3(0.13, 0.58, -0.07), new THREE.Vector3(0.08, 0.26, 0.045), 'back', new THREE.Vector3(0.1, -0.1, -0.28));

      // 6. GLUTES
      addSculptedMuscle(sphereGeom, new THREE.Vector3(-0.08, -0.23, -0.1), new THREE.Vector3(0.09, 0.11, 0.1), 'glutes');
      addSculptedMuscle(sphereGeom, new THREE.Vector3(0.08, -0.23, -0.1), new THREE.Vector3(0.09, 0.11, 0.1), 'glutes');

      // 7. LEGS (Sculpted Quadriceps teardrops & sweeps, Hamstrings, Adductors)
      // Left Quad - Rectus Femoris (central)
      addSculptedMuscle(cylinderGeom, new THREE.Vector3(-0.11, -0.62, 0.06), new THREE.Vector3(0.052, 0.36, 0.052), 'quads', new THREE.Vector3(-0.05, 0, 0));
      // Left Quad - Vastus Lateralis (outer sweep)
      addSculptedMuscle(cylinderGeom, new THREE.Vector3(-0.17, -0.63, 0.03), new THREE.Vector3(0.05, 0.38, 0.052), 'quads', new THREE.Vector3(-0.05, 0, 0.15));
      // Left Quad - Vastus Medialis (inner teardrop above knee)
      addSculptedMuscle(sphereGeom, new THREE.Vector3(-0.065, -0.76, 0.055), new THREE.Vector3(0.054, 0.12, 0.064), 'quads', new THREE.Vector3(0.1, -0.1, 0));
      // Left Adductors (inner thigh)
      addSculptedMuscle(cylinderGeom, new THREE.Vector3(-0.06, -0.58, 0.01), new THREE.Vector3(0.045, 0.32, 0.045), 'quads', new THREE.Vector3(0, 0, -0.1));

      // Right Quad - Rectus Femoris (central)
      addSculptedMuscle(cylinderGeom, new THREE.Vector3(0.11, -0.62, 0.06), new THREE.Vector3(0.052, 0.36, 0.052), 'quads', new THREE.Vector3(-0.05, 0, 0));
      // Right Quad - Vastus Lateralis (outer sweep)
      addSculptedMuscle(cylinderGeom, new THREE.Vector3(0.17, -0.63, 0.03), new THREE.Vector3(0.05, 0.38, 0.052), 'quads', new THREE.Vector3(-0.05, 0, -0.15));
      // Right Quad - Vastus Medialis (inner teardrop above knee)
      addSculptedMuscle(sphereGeom, new THREE.Vector3(0.065, -0.76, 0.055), new THREE.Vector3(0.054, 0.12, 0.064), 'quads', new THREE.Vector3(0.1, 0.1, 0));
      // Right Adductors (inner thigh)
      addSculptedMuscle(cylinderGeom, new THREE.Vector3(0.06, -0.58, 0.01), new THREE.Vector3(0.045, 0.32, 0.045), 'quads', new THREE.Vector3(0, 0, 0.1));

      // Hamstrings (Legs back)
      addSculptedMuscle(cylinderGeom, new THREE.Vector3(-0.12, -0.65, -0.06), new THREE.Vector3(0.08, 0.42, 0.08), 'hamstrings');
      addSculptedMuscle(cylinderGeom, new THREE.Vector3(0.12, -0.65, -0.06), new THREE.Vector3(0.08, 0.42, 0.08), 'hamstrings');

      // Calves (Lower legs)
      addSculptedMuscle(sphereGeom, new THREE.Vector3(-0.11, -1.22, -0.04), new THREE.Vector3(0.064, 0.22, 0.064), 'calves', new THREE.Vector3(0.05, 0, 0));
      addSculptedMuscle(sphereGeom, new THREE.Vector3(0.11, -1.22, -0.04), new THREE.Vector3(0.064, 0.22, 0.064), 'calves', new THREE.Vector3(-0.05, 0, 0));
      
      // Feet structure (Mannequin feet)
      addSculptedMuscle(absGeom, new THREE.Vector3(-0.12, -1.5, 0.08), new THREE.Vector3(0.055, 0.04, 0.16), 'calves', new THREE.Vector3(0.05, 0, 0));
      addSculptedMuscle(absGeom, new THREE.Vector3(0.12, -1.5, 0.08), new THREE.Vector3(0.055, 0.04, 0.16), 'calves', new THREE.Vector3(0.05, 0, 0));
    }

    /* ==========================================================================
       4. INTERACTION & RAYCASTING STATE HANDLERS
       ========================================================================== */
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // Dynamic overlay SVGs and DOM panel
    const svgOverlay = document.getElementById('svg-overlay');
    const leaderLine = document.getElementById('leader-line');
    const leaderDotStart = document.getElementById('leader-dot-start');
    const leaderDotEnd = document.getElementById('leader-dot-end');
    const hudPanel = document.getElementById('hud-panel');
    
    const hudTitle = document.getElementById('hud-title');
    const hudFunction = document.getElementById('hud-function');
    const hudWorkouts = document.getElementById('hud-workouts');

    let pointerStartX = 0;
    let pointerStartY = 0;

    // Attach listeners directly to the canvas (renderer.domElement) to bypass OrbitControls event consumption on mobile
    renderer.domElement.addEventListener('pointerdown', (e) => {
      pointerStartX = e.clientX;
      pointerStartY = e.clientY;
    });

    renderer.domElement.addEventListener('pointerup', (e) => {
      const deltaX = e.clientX - pointerStartX;
      const deltaY = e.clientY - pointerStartY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Filter out drags (rotation/zooms)
      if (distance > 8) return;

      if (gsap.isTweening(camera.position)) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);

      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;
        const key = clickedMesh.userData.muscleGroup;

        if (selectedMuscleKey !== key) {
          selectedMuscleKey = key;
          zoomToMuscle(key, clickedMesh);
          activateMuscleHUD(key, clickedMesh); // Force activate panel on click (essential for mobile tap)
        } else {
          resetSceneState();
        }
      } else {
        resetSceneState();
      }
    });

    // Trigger state checks (PointerMove hovers on desktop only)
    renderer.domElement.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return; // Ignore fake hover movements triggered on mobile touchscreens

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        const key = hitMesh.userData.muscleGroup;

        container.style.cursor = 'pointer';

        if (hoveredMuscleKey !== key) {
          deactivateMuscleHUD();
          hoveredMuscleKey = key;
          activateMuscleHUD(key, hitMesh);
        }
      } else {
        container.style.cursor = 'grab';
        deactivateMuscleHUD();
        hoveredMuscleKey = null;
      }
    });

    function activateMuscleHUD(key, hitMesh) {
      // 1. Set tracked mesh target for leader line projection
      chestMeshRef = hitMesh;

      // 2. Highlight all meshes in the same group in 3D
      interactiveMeshes.forEach(mesh => {
        if (mesh.userData.muscleGroup === key) {
          mesh.material.color.setHex(0xffaa44);
          mesh.material.emissive.setHex(0xff8200);
          mesh.material.emissiveIntensity = 0.3;
        }
      });

      // 3. Load contents into panel
      const data = workoutDatabase[key];
      if (data) {
        hudTitle.textContent = data.title;
        hudFunction.textContent = data.function;
        
        hudWorkouts.innerHTML = '';
        data.workouts.forEach(w => {
          const li = document.createElement('li');
          li.textContent = `- ${w}`;
          hudWorkouts.appendChild(li);
        });

        // 4. Fade in HUD Card Overlay
        hudPanel.style.opacity = '1';
        hudPanel.style.pointerEvents = 'auto';
      }
    }

    function deactivateMuscleHUD() {
      if (selectedMuscleKey) return; // Keep active if clicked/isolated

      // Reset all meshes color/emissive
      interactiveMeshes.forEach(mesh => {
        mesh.material.color.setHex(0xd4af37);
        mesh.material.emissive.setHex(0x000000);
        mesh.material.emissiveIntensity = 0;
      });

      // Fade out HUD panel
      hudPanel.style.opacity = '0';
      hudPanel.style.pointerEvents = 'none';
      
      // Clear SVG line overlay
      leaderLine.setAttribute('d', '');
      leaderDotStart.setAttribute('r', '0');
      leaderDotEnd.setAttribute('r', '0');
      
      chestMeshRef = null;
    }

    function zoomToMuscle(key, representativeMesh) {
      // 1. Dim all other parts in the scene
      mannequinGroup.children.forEach(child => {
        if (child.userData.isMuscle) {
          if (child.userData.muscleGroup !== key) {
            child.material.opacity = 0.12;
            child.material.transparent = true;
          } else {
            child.material.opacity = 1.0;
            child.material.color.setHex(0xffaa44);
            child.material.emissive.setHex(0xff8200);
            child.material.emissiveIntensity = 0.4;
          }
        } else {
          child.material.opacity = 0.15;
          child.material.transparent = true;
        }
      });

      // 2. Camera flight curves using GSAP
      controls.enabled = false;
      const targetCoord = representativeMesh.userData.originalPosition.clone();

      // Customize offset camera position based on the muscle group
      let camOffset = new THREE.Vector3(0, 0, 1.4);
      if (key === 'shoulders') camOffset.set(representativeMesh.position.x > 0 ? 0.7 : -0.7, 0.1, 1.0);
      else if (key === 'arms') camOffset.set(representativeMesh.position.x > 0 ? 0.8 : -0.8, 0, 1.0);
      else if (key === 'triceps') camOffset.set(representativeMesh.position.x > 0 ? 0.6 : -0.6, 0, -1.0);
      else if (key === 'back') camOffset.set(0, 0.1, -1.3);
      else if (key === 'glutes') camOffset.set(0, -0.1, -1.2);
      else if (key === 'hamstrings') camOffset.set(0, -0.2, -1.4);
      else if (key === 'calves') camOffset.set(0, -0.4, -1.2);
      else if (key === 'quads') camOffset.set(0, -0.2, 1.4);

      const targetCamPos = targetCoord.clone().add(camOffset);

      gsap.to(controls.target, {
        x: targetCoord.x,
        y: targetCoord.y,
        z: targetCoord.z,
        duration: 0.8,
        ease: 'power2.out'
      });

      gsap.to(camera.position, {
        x: targetCamPos.x,
        y: targetCamPos.y,
        z: targetCamPos.z,
        duration: 0.8,
        ease: 'power2.out',
        onComplete: () => {
          controls.enabled = true;
        }
      });
    }

    function resetSceneState() {
      selectedMuscleKey = null;
      deactivateMuscleHUD();

      controls.enabled = false;

      // Reset camera
      gsap.to(controls.target, {
        x: defaultTargetPos.x,
        y: defaultTargetPos.y,
        z: defaultTargetPos.z,
        duration: 0.8,
        ease: 'power2.inOut'
      });

      gsap.to(camera.position, {
        x: defaultCameraPos.x,
        y: defaultCameraPos.y,
        z: defaultCameraPos.z,
        duration: 0.8,
        ease: 'power2.inOut',
        onComplete: () => {
          controls.enabled = true;
        }
      });

      // Restore all mesh materials
      interactiveMeshes.forEach(mesh => {
        mesh.material.color.setHex(0xd4af37);
        mesh.material.opacity = 0.75;
        mesh.material.emissive.setHex(0x000000);
        mesh.material.emissiveIntensity = 0;
      });

      // Restore skeleton core
      mannequinGroup.children.forEach(child => {
        if (!child.userData.isMuscle) {
          child.material.opacity = 1.0;
        }
      });
    }

    /* ==========================================================================
       5. 3D-TO-2D COORDINATES PROJECTION (Dynamic Tracking Line)
       ========================================================================== */
    function updateLeaderLine() {
      // Verify chest target and HUD panel are visible
      if (!chestMeshRef || hudPanel.style.opacity === '0') {
        leaderLine.setAttribute('d', '');
        leaderDotStart.setAttribute('r', '0');
        leaderDotEnd.setAttribute('r', '0');
        return;
      }

      // Calculate chest mesh world position
      const worldPos = new THREE.Vector3();
      chestMeshRef.getWorldPosition(worldPos);

      // Project 3D vector to 2D screen coordinates (-1 to +1 range)
      worldPos.project(camera);

      // Convert projected coordinates to pixels matching parent container bounds
      const rect = wrapper.getBoundingClientRect();
      const x1 = (worldPos.x * 0.5 + 0.5) * rect.width;
      const y1 = (-worldPos.y * 0.5 + 0.5) * rect.height;

      // Find HUD left/top entry point coordinates relative to wrapper bounds
      const isMobile = window.innerWidth < 768;
      const hudRect = hudPanel.getBoundingClientRect();
      let x2, y2, dPath;

      if (isMobile) {
        // Connect to the top-center of the HUD card on mobile
        x2 = (hudRect.left + hudRect.right) / 2 - rect.left;
        y2 = hudRect.top - rect.top;
        
        // Mobile path: goes down slightly, then straight to card top-center
        dPath = `M ${x1} ${y1} L ${x1} ${y1 + 18} L ${x2} ${y2}`;
      } else {
        // Connect to the left edge of the HUD card on desktop (image_3.png style)
        x2 = hudRect.left - rect.left;
        y2 = (hudRect.top - rect.top) + 26;
        
        // Desktop path: goes right slightly, then straight to card left edge
        dPath = `M ${x1} ${y1} L ${x1 + 25} ${y1} L ${x2} ${y2}`;
      }

      // Update SVG coordinates
      leaderLine.setAttribute('d', dPath);
      
      leaderDotStart.setAttribute('cx', x1);
      leaderDotStart.setAttribute('cy', y1);
      leaderDotStart.setAttribute('r', '4');

      leaderDotEnd.setAttribute('cx', x2);
      leaderDotEnd.setAttribute('cy', y2);
      leaderDotEnd.setAttribute('r', '4');
    }

    /* ==========================================================================
       UTILITIES & ENGINE RENDER LOOP
       ========================================================================== */
    function animate() {
      requestAnimationFrame(animate);
      
      // Update OrbitControls
      controls.update();

      // Slow mannequin rotation if not zoomed/focusing on chest
      if (!selectedMuscleKey && mannequinGroup) {
        mannequinGroup.rotation.y += 0.003;
      } else if (mannequinGroup) {
        mannequinGroup.rotation.y *= 0.95; // ease back to center Y rotation
      }

      // Render Three.js scene
      renderer.render(scene, camera);

      // Project & update leader line overlay
      updateLeaderLine();
    }

    function onWindowResize() {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }

    // Initialize 3D Engine
    init3D();
  }

  /* ==========================================================================
     6. MEMBERSHIP TIERS PRICING SWITCHER (Monthly vs Annual)
     ========================================================================== */
  const pricingToggle = document.getElementById('pricing-toggle');
  const priceAmounts = document.querySelectorAll('.price-amount');

  if (pricingToggle) {
    pricingToggle.addEventListener('change', () => {
      const isAnnual = pricingToggle.checked;
      
      priceAmounts.forEach(price => {
        const monthlyVal = price.getAttribute('data-monthly');
        const annualVal = price.getAttribute('data-annual');
        const period = price.parentElement.querySelector('.period');
        
        // Animate price update
        price.style.opacity = 0;
        price.style.transform = 'translateY(-10px)';
        price.style.transition = 'opacity 0.2s, transform 0.2s';
        
        setTimeout(() => {
          price.textContent = isAnnual ? annualVal : monthlyVal;
          if (period) {
            period.textContent = isAnnual ? '/yr' : '/mo';
          }
          price.style.opacity = 1;
          price.style.transform = 'translateY(0)';
        }, 200);
      });
    });
  }

  /* ==========================================================================
     7. STATS COUNT-UP NUMBERS ANIMATION
     ========================================================================== */
  const statsSection = document.querySelector('.stats-panel');
  const statNumbers = document.querySelectorAll('.stat-number');
  let statsAnimated = false;

  const runStatsAnimation = () => {
    statNumbers.forEach(stat => {
      const target = parseInt(stat.getAttribute('data-target'), 10);
      const duration = 2000;
      const stepTime = Math.abs(Math.floor(duration / target));
      let current = 0;
      
      const timer = setInterval(() => {
        current += Math.ceil(target / 100);
        if (current >= target) {
          stat.textContent = target;
          clearInterval(timer);
        } else {
          stat.textContent = current;
        }
      }, stepTime || 20);
    });
  };

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !statsAnimated) {
        runStatsAnimation();
        statsAnimated = true;
      }
    });
  }, { threshold: 0.3 });

  if (statsSection && statNumbers.length > 0) {
    statsObserver.observe(statsSection);
  }

  /* ==========================================================================
     8. MOBILE HAMBURGER MENU NAVIGATION
     ========================================================================== */
  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');
  const headerLinks = document.querySelectorAll('.nav-link');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('open');
      navLinks.classList.toggle('open');
    });

    headerLinks.forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('open');
        navLinks.classList.remove('open');
      });
    });
  }

  // Sticky Navbar shadow on scroll
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  /* ==========================================================================
     9. CONTACT FORM SUBMISSION MOCKUP
     ========================================================================== */
  const trialForm = document.getElementById('trial-form');
  const formFeedback = document.getElementById('form-feedback');

  if (trialForm) {
    trialForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const goalSelect = document.getElementById('goal');
      const goalText = goalSelect.options[goalSelect.selectedIndex].text;
      const sendWhatsApp = document.getElementById('send-whatsapp').checked;
      
      if (name && email && phone.length === 10) {
        formFeedback.className = "form-feedback success p-4 mt-4 bg-green-950/20 border border-green-800/40 text-green-400 rounded-md text-sm text-center";
        formFeedback.textContent = `Success! Thank you, ${name}. Your trial pass request has been registered.`;
        formFeedback.classList.remove('hidden');
        
        if (sendWhatsApp) {
          // Construct pre-filled message for WhatsApp Click-to-Chat
          const message = `Hello RUSH X Fitness Studio! I would like to request a trial pass:\n\n` + 
                          `*Name*: ${name}\n` +
                          `*Email*: ${email}\n` +
                          `*Phone*: ${phone}\n` +
                          `*Main Goal*: ${goalText}`;
          
          const encodedMessage = encodeURIComponent(message);
          const whatsappUrl = `https://wa.me/917975364369?text=${encodedMessage}`;
          
          // Redirect to WhatsApp after 800ms
          setTimeout(() => {
            window.open(whatsappUrl, '_blank');
          }, 800);
        }
        
        trialForm.reset();
      } else {
        formFeedback.className = "form-feedback error p-4 mt-4 bg-red-950/20 border border-red-800/40 text-red-400 rounded-md text-sm text-center";
        formFeedback.textContent = "Please fill out all fields correctly, including a valid 10-digit mobile number.";
        formFeedback.classList.remove('hidden');
      }
    });
  }

  /* ==========================================================================
     9.5. WORLD-CLASS GEAR SCROLL-TRIGGER (Vertical to Horizontal Scroll)
     ========================================================================== */
  gsap.registerPlugin(ScrollTrigger);

  const horizontalTrack = document.querySelector('.horizontal-track');
  const scrollWrapper = document.querySelector('.horizontal-scroll-wrapper');
  
  if (horizontalTrack && scrollWrapper) {
    const getScrollAmount = () => {
      return horizontalTrack.scrollWidth - window.innerWidth + (window.innerWidth * 0.2);
    };

    let mm = gsap.matchMedia();

    // Desktop: Pinned vertical-to-horizontal scrolling
    mm.add("(min-width: 768px)", () => {
      gsap.to(horizontalTrack, {
        x: () => -getScrollAmount(),
        ease: 'none',
        scrollTrigger: {
          trigger: '.gear-section',
          pin: true,
          scrub: 1.2,
          start: 'top top',
          end: () => `+=${getScrollAmount()}`,
          invalidateOnRefresh: true,
          markers: false
        }
      });
    });
    
    // Mobile: Reset/Clear GSAP inline styles to allow standard swiping
    mm.add("(max-width: 767px)", () => {
      gsap.set(horizontalTrack, { clearProps: "all" });
    });
  }

  /* ==========================================================================
     10. SCROLL ANIMATION FALLBACKS (If Scroll-Timeline is unsupported)
     ========================================================================== */
  if (!CSS.supports('(animation-timeline: view()) and (animation-range: entry)')) {
    console.log("Native CSS scroll-timeline is not supported. Activating IntersectionObserver fallbacks.");
    
    const animateOnScrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = 1;
          entry.target.style.transform = 'translateY(0)';
          animateOnScrollObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    const animatedElements = document.querySelectorAll('.feature-card, .class-card, .pricing-card, .map-container, .contact-form-container');
    
    animatedElements.forEach(el => {
      el.style.opacity = 0;
      el.style.transform = 'translateY(40px)';
      el.style.transition = 'opacity 0.8s ease, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
      
      animateOnScrollObserver.observe(el);
    });
  }

});
