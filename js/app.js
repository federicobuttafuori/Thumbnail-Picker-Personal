var video = document.querySelector("#video");
var canvas = document.querySelector("#canvas");
var file = document.querySelector("#videofile");
var videoControls = document.querySelector("#videoControls");
var videow = document.querySelector("#videow");
var snapd = document.querySelector("#snapd");
var snap = document.querySelector("#snap");
var snap2 = document.querySelector("#snap2");
var save = document.querySelector("#save");
var saveall = document.querySelector("#saveall");
var clear = document.querySelector("#clear");
var videoInfo = document.querySelector("#videoInfo");
var snapSize = document.querySelector("#snapsize");
var context = canvas.getContext("2d");
var slider = document.querySelector("#slider");
var w, h, ratio;
var snapProc = null;
var autosnapCancelled = false;
//add loadedmetadata which will helps to identify video attributes

function timeUpdate() {
  slider.setAttribute("max", Math.ceil(video.duration));
  slider.value = video.currentTime;
  videoInfo.style.display = "block";
  videoInfo.innerHTML = [
    "Video size: " + video.videoWidth + "x" + video.videoHeight,
    "Video length: " + Math.round(video.duration * 10) / 10 + "sec",
    "Playback position: " + Math.round(video.currentTime * 10) / 10 + "sec",
  ].join("<br>");
}

function goToTime(video, time) {
  console.log('goToTime',time)
  video.currentTime = Math.min(video.duration, Math.max(0, time));
  timeUpdate();
}

video.addEventListener("timeupdate", timeUpdate);
setInterval( function () {
  console.log(video.paused)
  if (!video) return
  if (video.paused){
    document.querySelector(".play-control").style.display = "block";
    document.querySelector(".pause-control").style.display = "none";
  } else {
    document.querySelector(".play-control").style.display = "none";
    document.querySelector(".pause-control").style.display = "block";
  }
},1000)

video.addEventListener(
  "loadedmetadata",
  function () {
    console.log("Metadata loaded");
    // videow.value = video.videoWidth;
    videoInfo.innerHTML = [
      "Video size: " + video.videoWidth + "x" + video.videoHeight,
      "Video length: " + Math.round(video.duration * 10) / 10 + "sec",
    ].join("<br>");
    video.objectURL = false;
    video.play();
    video.pause();
    resize();
  },
  false
);

function resize() {
  ratio = video.videoWidth / video.videoHeight;
  w = videow.value;
  h = parseInt(w / ratio, 10);
  canvas.width = w;
  canvas.height = h;
  snapSize.innerHTML = w + "x" + h;
}

function getDisplaySettings() {
  return {
    showTime: document.getElementById('show-time') ? document.getElementById('show-time').checked : false,
    showDimensions: document.getElementById('show-dimensions') ? document.getElementById('show-dimensions').checked : true,
    showSize: document.getElementById('show-size') ? document.getElementById('show-size').checked : true
  };
}

function formatImageLabel(time, width, height, sizeMB) {
  var settings = getDisplaySettings();
  var parts = [];
  
  if (settings.showTime) {
    parts.push(time.toFixed(2) + 's');
  }
  if (settings.showDimensions) {
    parts.push(width + 'x' + height);
  }
  if (settings.showSize) {
    parts.push(sizeMB + 'MB');
  }
  
  return parts.join(' ');
}

function snapPicture() {
  context.fillRect(0, 0, w, h);
  context.drawImage(video, 0, 0, w, h);
  var time = video.currentTime;
  var dataURL = canvas.toDataURL("image/png");

  // Calculate file size in MB
  var byteString = atob(dataURL.split(',')[1]);
  var ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);
  for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
  }
  var blob = new Blob([ab], {type: "image/png"});
  var sizeMB = (blob.size / (1024 * 1024)).toFixed(2);

  const container = document.querySelector("#outputs");
  const img = document.createElement("img");
  img.src = dataURL;
  img.className = "output";
  img.addEventListener("click", () => selectImage(img));
  img.title="t"+("000" + time.toFixed(2)).slice(-7)+'seg';
  img.onclick=function(){ goToTime(video,time) };
  img.setAttribute("data-time", time);
  img.setAttribute("data-width", w);
  img.setAttribute("data-height", h);
  img.setAttribute("data-size", sizeMB);

  var cont = document.createElement("div");
  cont.className = "output-container";
  cont.style.display = "inline-block";
  cont.appendChild(img);
  var label=document.createElement("label");
  label.className = "output-label";
  label.innerHTML = formatImageLabel(time, w, h, sizeMB);
  cont.appendChild(label);

  var close = document.createElement("a");
  close.className = "output-remove";
  close.innerHTML = "x";
  close.addEventListener("click", function () {
    container.removeChild(cont);
    if (container.children.length == 0) {
      save.disabled = true;
      saveall.disabled = true;
      clear.disabled = true;
    }
  });
  cont.appendChild(close);

  container.appendChild(cont);
  img.setAttribute("size",w + "x" + h);
  selectImage(img);
}

function updateAllImageLabels() {
  var labels = document.querySelectorAll('.output-label');
  labels.forEach(function(label) {
    var container = label.closest('.output-container');
    if (container) {
      var img = container.querySelector('.output');
      if (img) {
        var time = parseFloat(img.getAttribute('data-time')) || 0;
        var width = parseInt(img.getAttribute('data-width')) || 0;
        var height = parseInt(img.getAttribute('data-height')) || 0;
        var sizeMB = parseFloat(img.getAttribute('data-size')) || 0;
        label.innerHTML = formatImageLabel(time, width, height, sizeMB);
      }
    }
  });
}
function autoSnapPictureAfterSelection(){
  var sel = document.querySelector('#snap_each')
  var value = 0
  if (sel.value.indexOf('%')>0){
    value = sel.value.replace('%','')*1.0/100
    autoSnapPictureAfterPercent(value)
  }
  if (sel.value.indexOf('m')>0){
    value = sel.value.replace('m','')*1.0
    autoSnapPictureAfterMin(value)
  }
}

function zipAllImages(){
  var zip = new JSZip();
  const container = document.querySelector("#outputs");
  var images = container.querySelectorAll("img");
  var imgFolder = zip.folder("images");
  images.forEach(function(img){
    var imgData = img.src.replace(/^data:image\/(png|jpg);base64,/, "");
    imgFolder.file(img.title+".png", imgData, {base64: true});
  })
  zip.generateAsync({type:"blob"})
  .then(function(content) {
      console.log('save',content)
      saveAs(content, "images.zip");
  }); 
}

function autoSnapPictureAfterPercent(percentage) {
  // Check if video is loaded
  if (!video.duration) {
    alert("Please load a video first");
    return;
  }
  // Cancel any existing autosnap process
  autosnapCancelled = true;
  clearSnaps();
  autosnapCancelled = false; // Reset for new process

  var duration = video.duration;
  var interval = percentage * duration;
  var time = 0.1;
  var times = [];
  
  // Pre-calculate all seek times
  while (time < duration) {
    times.push(time);
    time += interval;
  }

  var currentIndex = 0;
  snapProc = true; // Mark that autosnap is active
  
  function seekAndSnap() {
    if (autosnapCancelled || currentIndex >= times.length) {
      snapProc = null;
      return; // Done or cancelled
    }
    
    var targetTime = times[currentIndex];
    currentIndex++;
    
    // Wait for seek to complete using the 'seeked' event
    var onSeeked = function() {
      video.removeEventListener('seeked', onSeeked);
      
      if (autosnapCancelled) {
        snapProc = null;
        return;
      }
      
      // Wait for video frame to be ready using requestAnimationFrame
      // This ensures the frame is actually rendered before capturing
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          // Double RAF ensures frame is painted
          if (!autosnapCancelled && video.readyState >= video.HAVE_CURRENT_DATA) {
            snapPicture();
          }
          if (!autosnapCancelled) {
            seekAndSnap(); // Continue to next frame
          } else {
            snapProc = null;
          }
        });
      });
    };
    
    video.addEventListener('seeked', onSeeked, { once: true });
    video.currentTime = targetTime;
  }
  
  video.pause(); // Pause video for consistent snapshots
  seekAndSnap(); // Start the process
}

function autoSnapPictureAfterMin(minutes) {
  // Check if video is available
  if (!video.duration) {
    alert("Please load a video first");
    return;
  }
  // Cancel any existing autosnap process
  autosnapCancelled = true;
  clearSnaps();
  autosnapCancelled = false; // Reset for new process

  var duration = video.duration;
  var interval = 60 * minutes;
  var time = 0.1;
  var times = [];
  
  // Pre-calculate all seek times
  while (time < duration) {
    times.push(time);
    time += interval;
  }

  var currentIndex = 0;
  snapProc = true; // Mark that autosnap is active
  
  function seekAndSnap() {
    if (autosnapCancelled || currentIndex >= times.length) {
      snapProc = null;
      return; // Done or cancelled
    }
    
    var targetTime = times[currentIndex];
    currentIndex++;
    
    // Wait for seek to complete using the 'seeked' event
    var onSeeked = function() {
      video.removeEventListener('seeked', onSeeked);
      
      if (autosnapCancelled) {
        snapProc = null;
        return;
      }
      
      // Wait for video frame to be ready using requestAnimationFrame
      // This ensures the frame is actually rendered before capturing
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          // Double RAF ensures frame is painted
          if (!autosnapCancelled && video.readyState >= video.HAVE_CURRENT_DATA) {
            snapPicture();
          }
          if (!autosnapCancelled) {
            seekAndSnap(); // Continue to next frame
          } else {
            snapProc = null;
          }
        });
      });
    };
    
    video.addEventListener('seeked', onSeeked, { once: true });
    video.currentTime = targetTime;
  }
  
  video.pause(); // Pause video for consistent snapshots
  seekAndSnap(); // Start the process
}

function clearSnaps(){
  // Cancel any active autosnap process
  autosnapCancelled = true;
  snapProc = null;
  
  const container = document.querySelector("#outputs");
  container.innerHTML = "";
  save.disabled = true;
  saveall.disabled = true;
  clear.disabled = true;
}

function selectImage(img) {
  // Find parent and remove selected class from all children except the selected one
  var parent = img.parentElement.parentElement;
  var images = parent.querySelectorAll('.output-container > img');
  for (let index = 0; index < images.length; index++) {
    const element = images[index];
    if (element != img) {
      element.classList.remove("selected");
    }
  }
  img.classList.add("selected");

  // Preview the selected image in the image with id "preview"
  var preview = document.querySelector("#preview");
  preview.src = img.src;
  preview.style.display = '';
  preview.title=img.title
  save.disabled = false;
  saveall.disabled = false;
  clear.disabled = false;
}

function selectVideo() {
  file.click();
}

function loadVideoFile() {
  var fileInput = file.files[0];
  if (fileInput) {
    console.log("Loading...");
    console.log(fileInput);
    /*
    var reader  = new FileReader();
    reader.addEventListener("error", function () {
      console.log("Error loading video data");
    });
    reader.addEventListener('progress',function(ev){
      console.log("progress", ev.loaded, ev.total, Math.round(ev.loaded*100.0/ev.total));
    });
    reader.addEventListener("load", function () {
        console.log("Video data loaded");
        video.preload="metadata";
        video.src = reader.result;
      }, false);
    reader.readAsDataURL(fileInput);
    */
    if (video.objectURL && video.src) {
      URL.revokeObjectURL(video.src);
    }
    video.pleload = "metadata";
    video.objectURL = true;
    video.src = URL.createObjectURL(fileInput);
    snap.disabled = false;
    snap2.disabled = false;
    videoControls.style.display = "";
    resize(); // Add this line to update the snapshot size
  }
}

function loadVideoFromFile(file) {
  let reader = new FileReader();
  reader.readAsArrayBuffer(file);
  reader.onload = function (e) {
    // The file reader gives us an ArrayBuffer:
    let buffer = e.target.result;
    // We have to convert the buffer to a blob:
    let videoBlob = new Blob([new Uint8Array(buffer)], { type: "video/mp4" });
    // The blob gives us a URL to the video file:
    let url = window.URL.createObjectURL(videoBlob);
    video.src = url;
  };
}

function savePicture(btn) {
  // btn.disabled = true
  // var dataURL = canvas.toDataURL();
  // var link = document.getElementById("imagelink");
  // link.style.display = '';
  // link.style.opacity = 0
  // link.href = dataURL;
  // var rnd = Math.round((Math.random() * 10000));
  // link.setAttribute("download", "video-capture-" + rnd + ".png");
  // link.click();
  // setTimeout(function(){
  //   btn.disabled = false
  //   link.style.display = 'none';
  // },100)

  // Save the selected image
  var selected = document.querySelector(".selected");
  if (selected) {
    var dataURL = selected.src;
    var link = document.getElementById("imagelink");
    link.style.display = "";
    link.style.opacity = 0;
    link.href = dataURL;
    var rnd = Math.round(Math.random() * 10000);
    link.setAttribute("download", "video-capture-" + selected.title+ "-" + rnd + ".png");
    link.click();
    setTimeout(function () {
      link.style.display = "none";
    }, 100);
  }
}

window.addEventListener("load", function () {
  var buttons = document.querySelectorAll("button");
  for (let index = 0; index < buttons.length; index++) {
    var element = buttons[index];
    element.addEventListener("click", function () {
      var name = this.innerText.trim();
      var category = "button";
      if (this.getAttribute("category") == "controls") {
        name = "Video Controls";
        category = "controls";
      }
      var id = name.toLowerCase().replace(" ", "_");
      gtag("event", category + "-" + id, {});
    });
  }
});
