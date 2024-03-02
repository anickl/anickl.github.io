/**
 * @file MP5.js - A simple WebGL rendering engine
 * @author Ian Rudnick <itr2@illinois.edu>
 * @brief Starter code for CS 418 MP5 at the University of Illinois at
 * Urbana-Champaign.
 * 
 * Updated Spring 2021 for WebGL 2.0/GLSL 3.00 ES.
 */

/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas to draw on */
var canvas;

/** @global The GLSL shader program */
var shaderProgram;

/** @global An object holding the geometry for your 3D model */
var sphere1;

var texture;

/** @global list of position data for each sphere */
var position=[0,-20,0];
/** @global list of scales for each sphere */
var scale=[4,4,4];
/** @global list holding color for each velocity */
var color=[1.0,1.0,1.0];



/** @global The Model matrix */
var modelViewMatrix = glMatrix.mat4.create();
/** @global The Model matrix */
var viewMatrix = glMatrix.mat4.create();
/** @global The Projection matrix */
var projectionMatrix = glMatrix.mat4.create();




var isDown = false;
var x = -1;
var y = -1;
var rotY = 0;

/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

//-----------------------------------------------------------------------------
// Setup functions (run once when the webpage loads)
/**
 * Startup function called from the HTML code to start program.
 */
function startup() {
  // Set up the canvas with a WebGL context.
  canvas = document.getElementById("glCanvas");
  gl = createGLContext(canvas);

  
  // Compile and link a shader program.
  setupShaders();
    
    loadTexture("https://anickl.github.io/writeups/black-hole/starmap_random_2020_4k.jpg");
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(shaderProgram.locations.uSampler,0);
    
    
    canvas.addEventListener('mousedown', e=> {
        x = e.offsetX;
        y=e.offsetY;
        isDown = true;
    });
    canvas.addEventListener('mouseup', e => {
    isDown = false;
  });
  canvas.addEventListener('mousemove', e => {
    if(isDown){
      rotY-=e.offsetX - x;
    }
    x = e.offsetX;
    y = e.offsetY;
  });
  // Create a sphere mesh and set up WebGL buffers for it.
  sphere1 = new Sphere(5);
  sphere1.setupBuffers(shaderProgram);
  
  // Create the projection matrix with perspective projection.
  const near = 0.1;
  const far = 100.0;
  glMatrix.mat4.perspective(projectionMatrix, degToRad(60), 
                            gl.viewportWidth / gl.viewportHeight,
                            near, far);
    
  // Set the background color to black (you can change this if you like).    
  gl.clearColor(0.0, 1.0, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);


  // Start animating.
  requestAnimationFrame(animate);
}


/**
 * Creates a WebGL 2.0 context.
 * @param {element} canvas The HTML5 canvas to attach the context to.
 * @return {Object} The WebGL 2.0 context.
 */
function createGLContext(canvas) {
  var context = null;
  context = canvas.getContext("webgl2");
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}


/**
 * Loads a shader from the HTML document and compiles it.
 * @param {string} id ID string of the shader script to load.
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
    
  // Return null if we don't find an element with the specified id
  if (!shaderScript) {
    return null;
  }
    
  var shaderSource = shaderScript.text;
  
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
  
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader; 
}


/**
 * Sets up the vertex and fragment shaders.
 */
function setupShaders() {
  // Compile the shaders' source code.
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  // Link the shaders together into a program.
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  // If you have multiple different shader programs, you'll need to move this
  // function to draw() and call it whenever you want to switch programs
  gl.useProgram(shaderProgram);

  // Query the index of each attribute and uniform in the shader program.
  shaderProgram.locations = {};
  shaderProgram.locations.vertexPosition =
    gl.getAttribLocation(shaderProgram, "vertexPosition");
  shaderProgram.locations.vertexNormal =
    gl.getAttribLocation(shaderProgram, "vertexNormal");

  shaderProgram.locations.modelViewMatrix =
    gl.getUniformLocation(shaderProgram, "modelViewMatrix");
  shaderProgram.locations.projectionMatrix =
    gl.getUniformLocation(shaderProgram, "projectionMatrix");
  shaderProgram.locations.viewMatrix = 
      gl.getUniformLocation(shaderProgram, "viewMatrix");
  shaderProgram.locations.uSampler =
    gl.getUniformLocation(shaderProgram, "u_texture");
  shaderProgram.locations.box =
    gl.getUniformLocation(shaderProgram, "box");

}

//-----------------------------------------------------------------------------
// Animation functions (run every frame)
/**
 * Draws the current frame and then requests to draw the next frame.
 * @param {number} currentTime The elapsed time in milliseconds since the
 *    webpage loaded. 
 */
function animate(currentTime) {
  // Add code here using currentTime if you want to add animations
  // Set up the canvas for this frame
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  var modelMatrix = glMatrix.mat4.create();
  var pos = glMatrix.vec3.fromValues(0.0,-20,0.0);

  // Create the view matrix using lookat.
  const lookAtPt = glMatrix.vec3.fromValues(0.0, -20.0, 0.0);
  const eyePt = glMatrix.vec3.fromValues(0.0, 0.0, 0.0);
  var trueLook=glMatrix.vec3.fromValues(0.0,0.0,0.0);
  const up = glMatrix.vec3.fromValues(0.0, 0.0, 1.0); 
  glMatrix.vec3.rotateZ(trueLook,lookAtPt,up,degToRad(rotY));
  glMatrix.vec3.rotateZ(pos,pos,up,degToRad(rotY));
  glMatrix.mat4.lookAt(viewMatrix, eyePt, trueLook, up);

  // Concatenate the model and view matrices.
  // Remember matrix multiplication order is important.

  // Transform the light position to view coordinates
  

  // You can draw multiple spheres by changing the modelViewMatrix, calling
  // setMatrixUniforms() again, and calling gl.drawArrays() again for each
  // sphere. You can use the same sphere object and VAO for all of them,
  // since they have the same triangle mesh.
  sphere1.bindVAO();
    var qIdentity=glMatrix.quat.create();
    glMatrix.quat.identity(qIdentity);

    glMatrix.mat4.fromRotationTranslationScale(modelMatrix,qIdentity,pos,scale);
    glMatrix.mat4.multiply(modelViewMatrix,viewMatrix,modelMatrix);
    gl.uniform1f(shaderProgram.locations.box,0.0);
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLES, 0, sphere1.numTriangles*3);


    glMatrix.mat4.fromRotationTranslationScale(modelMatrix,qIdentity,eyePt,[40,40,40]);
    glMatrix.mat4.multiply(modelViewMatrix,viewMatrix,modelMatrix);
     gl.uniform1f(shaderProgram.locations.box,1.0);
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLES, 0, sphere1.numTriangles*3);
    
    
  sphere1.unbindVAO();
  // Use this function as the callback to animate the next frame.
  requestAnimationFrame(animate);
}


/**
 * Sends the three matrix uniforms to the shader program.
 */
function setMatrixUniforms() {
  gl.uniformMatrix4fv(shaderProgram.locations.viewMatrix, false, viewMatrix);
  gl.uniformMatrix4fv(shaderProgram.locations.modelViewMatrix, false,
                      modelViewMatrix);
  gl.uniformMatrix4fv(shaderProgram.locations.projectionMatrix, false,
                      projectionMatrix);


}
function loadTexture(filename){
	// Create a texture.
	texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
 
	// Fill the texture with a 1x1 blue pixel.
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([0, 0, 255, 255]));
 
	// Asynchronously load an image
	// If image load unsuccessful, it will be a blue surface
	var image = new Image();
    image.crossOrigin = "anonymous";
	image.src = filename;
	image.addEventListener('load', function() {
  		// Now that the image has loaded make copy it to the texture.
  		gl.bindTexture(gl.TEXTURE_2D, texture);
  		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
  		gl.generateMipmap(gl.TEXTURE_2D);
  		console.log("loaded ", filename);
		});
}
