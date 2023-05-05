function flatArr(arr) {
  return arr.flat(Infinity);
}

function initArrBuffer(gl, code, value, perLen) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, value, gl.STATIC_DRAW);
  let aVal = gl.getAttribLocation(gl.program, code);
  //给管线指定顶点着色器数据
  gl.vertexAttribPointer(aVal, perLen, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(aVal); //启用顶点着色器数据
}

function initElmtBuffer(gl, value) {
  var indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, value, gl.STATIC_DRAW);
}

function initUniform(gl, code, value, type) {
  if (type[type.length - 1] == 'v') {
    gl[type](gl.getUniformLocation(gl.program, code), false, value);
  } else if (Array.isArray(value)) {
    gl[type](gl.getUniformLocation(gl.program, code), ...value);
  } else {
    gl[type](gl.getUniformLocation(gl.program, code), value);
  }
}

function initAttibute(gl, code, value, type) {
  if (type[type.length - 1] == 'v') {
    gl[type](gl.getAttribLocation(gl.program, code), value);
  } else if (Array.isArray(value)) {
    gl[type](gl.getAttribLocation(gl.program, code), ...value);
  } else {
    gl[type](gl.getAttribLocation(gl.program, code), value);
  }
}

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.log('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  gl.useProgram(shaderProgram);
  gl.program = shaderProgram;
  // If creating the shader program failed, console.log

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.log('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}
function initGl(id) {
  var canvas = document.getElementById(id);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  var gl = canvas.getContext('webgl');
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  });
  return gl;
}
function cleanGl(gl) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
  gl.clearDepth(1.0); // Clear everything
  gl.enable(gl.DEPTH_TEST); // Enable depth testing
  gl.depthFunc(gl.LEQUAL); // Near things obscure far things
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}
function initProjectionMatrix(gl) {
  const fieldOfView = (75 * Math.PI) / 180;
  const aspect = gl.canvas.width / gl.canvas.height;
  const zNear = 1;
  const zFar = 10000.0;
  const projectionMatrix = mat4.create();

  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
  gl.uniformMatrix4fv(
    gl.getUniformLocation(gl.program, 'uProjectionMatrix'),
    false,
    projectionMatrix
  );
  return projectionMatrix;
}
