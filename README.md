---
theme: cyanosis
---

这是 THREE.js 官方的一个经典示例，改用 webgl 实现，通过这个示例来更好地学会在 webgl 画点

## Three.js 官方示例-波浪点

https://threejs.org/examples/#webgl_points_waves

## 1.创建 webgl

```js
function initGl(id) {
  var canvas = document.getElementById(id);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  var gl = canvas.getContext('webgl');
  //监听window大小改变，设置窗口视图
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  });
  return gl;
}
```

## 2. 加载着色器

```js
//加载着色器
function loadShader(gl, type, source) {
  //创建着色器
  const shader = gl.createShader(type);
  //设置着色器的代码
  gl.shaderSource(shader, source);
  //编译着色器
  gl.compileShader(shader);
  //编译错误打印日志，返回null
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.log('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}
```

```c++
       attribute vec3 position;
            attribute float scale;
            attribute vec3 color;
            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            varying vec3 vColor;
      void main() {
          vec4 mvPosition = uModelViewMatrix * vec4( position, 1.0 );
          //根据距离远近显示点的大小
          gl_PointSize = scale * ( 300.0 / - mvPosition.z );
          gl_Position = uProjectionMatrix * mvPosition   ;
          vColor=color;
      }
```

```c++
precision highp float;
            varying vec3 vColor;
      void main() {
      //超过一定视觉范围内，不显示
          if ( length( gl_PointCoord - vec2( 0.5, 0.5 ) ) > 0.475 ) discard;
          gl_FragColor = vec4( vColor, 1.0 );
      }
```

## 3.初始化 program

```js
function initShaderProgram(gl, vsSource, fsSource) {
  //顶点着色器
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  //片元着色器
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  //创建
  const shaderProgram = gl.createProgram();
  //绑定顶点着色器
  gl.attachShader(shaderProgram, vertexShader);
  //绑定片元着色器
  gl.attachShader(shaderProgram, fragmentShader);
  //绑定着色器程序
  gl.linkProgram(shaderProgram);
  //使用着色器程序
  gl.useProgram(shaderProgram);
  //把着色器程序挂在gl上方便后面操作
  gl.program = shaderProgram;
  //编译错误打印日志，返回null
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.log('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}
```

## 4. 批量创建波浪的点

```js
const SEPARATION = 100,
  AMOUNTX = 50,
  AMOUNTY = 50;
const numParticles = AMOUNTX * AMOUNTY;
var count = 0;
const positions = new Float32Array(numParticles * 3);
const scales = new Float32Array(numParticles);
const colors = new Float32Array(numParticles * 3);
function createPoints() {
  let i = 0,
    j = 0;
  for (let ix = 0; ix < AMOUNTX; ix++) {
    //随即颜色
    let c = [Math.random(), Math.random(), Math.random()];
    for (let iy = 0; iy < AMOUNTY; iy++) {
      //设置点x,z位置
      positions[i] = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2; // x
      positions[i + 1] = 0; // y
      positions[i + 2] = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2; // z

      scales[j] = 1;
      //每一列的颜色相同
      colors[i] = c[0];
      colors[i + 1] = c[1];
      colors[i + 2] = c[2];

      i += 3;
      j++;
    }
  }
}
```

## 5. 让点动起来

### 移动点的 y 轴位置，对应大小的改变

```js
function movePoints() {
  let i = 0,
    j = 0;

  for (let ix = 0; ix < AMOUNTX; ix++) {
    for (let iy = 0; iy < AMOUNTY; iy++) {
      positions[i + 1] = Math.sin((ix + count) * 0.3) * 50 + Math.sin((iy + count) * 0.5) * 50;

      scales[j] = (Math.sin((ix + count) * 0.3) + 1) * 20 + (Math.sin((iy + count) * 0.5) + 1) * 20;

      i += 3;
      j++;
    }
  }
}
```

### 清空重画

```js
function cleanGl(gl) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0); //清空背景色为黑色
  gl.clearDepth(1.0); //清空所有
  gl.enable(gl.DEPTH_TEST); //开启深度检测
  gl.depthFunc(gl.LEQUAL); //深度检测方法设置为近处物体阻挡远处物体
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); //清空缓存
}
```

### 正交投影

```js
function initProjectionMatrix(gl) {
  //视角
  const fieldOfView = (75 * Math.PI) / 180;
  const aspect = gl.canvas.width / gl.canvas.height;
  const zNear = 1; //近处
  const zFar = 10000.0; //远处
  const projectionMatrix = mat4.create();
  //正交投影
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
  gl.uniformMatrix4fv(
    gl.getUniformLocation(gl.program, 'uProjectionMatrix'),
    false,
    projectionMatrix
  );
  return projectionMatrix;
}
```

### 设置缓冲区

```js
function initArrBuffer(gl, code, value, perLen) {
  //创建缓冲区
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, value, gl.STATIC_DRAW);
  let aVal = gl.getAttribLocation(gl.program, code);
  //给管线指定顶点着色器数据
  gl.vertexAttribPointer(aVal, perLen, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(aVal); //启用顶点着色器数据
}
```

### 动画帧

```js
function animate() {
  cleanGl(gl);
  //正交投影
  var projectionMatrix = initProjectionMatrix(gl);

  const modelViewMatrix = mat4.create();
  //整体后移300，使点在视角范围内
  mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -300.0]);

  gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uModelViewMatrix'), false, modelViewMatrix);

  movePoints();
  //设置缓存区，赋值对应着色器参数
  initArrBuffer(gl, 'position', positions, 3);
  initArrBuffer(gl, 'color', colors, 3);
  initArrBuffer(gl, 'scale', scales, 1);

  //画点
  gl.drawArrays(gl.POINTS, 0, scales.length);
  count += 0.1;
  requestAnimationFrame(animate);
}
```

## github 代码地址

https://github.com/xiaolidan00/webgl-wave-points
