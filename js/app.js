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

  var cont = document.createElement("div");
  cont.className = "output-container";
  cont.style.display = "inline-block";
  cont.appendChild(img);
  var label=document.createElement("label");
  label.innerHTML=(time.toFixed(2))+'s '+w+"x"+h+' '+sizeMB+'MB';
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
  clearInterval(snapProc);
  clearSnaps()

  var duration = video.duration
  var interval = percentage * duration;
  var time = 0.1;

  // Loop through the video without delay and take a snapshot every 10% of the video
  snapProc = setInterval(function () {
    goToTime(video, time);
    setTimeout(snapPicture,snapd.value * 1 || 400)
    time += interval;
    if (time >= duration) {
      clearInterval(snapProc);
    }
  }, (snapd.value * 1 || 400) + 100);
}

function autoSnapPictureAfterMin(minutes) {
  // Check if video is available
  if (!video.duration) {
    alert("Please load a video first");
    return;
  }
  clearInterval(snapProc);
  clearSnaps();

  var duration = video.duration
  var interval = 60 * minutes;
  var time = 0.1;

  // Loop through the video without delay and take a snapshot every 1 minute
  snapProc = setInterval(function () {
    goToTime(video, time);
    setTimeout(snapPicture,snapd.value * 1 || 400)
    time += interval;
    if (time >= duration) {
      clearInterval(snapProc);
    }
  }, (snapd.value * 1 || 400) + 100);
}

function clearSnaps(){
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

// Extract YouTube video ID from various URL formats
function extractYouTubeVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

// Check if URL is a YouTube URL
function isYouTubeURL(url) {
  return /(youtube\.com|youtu\.be)/.test(url);
}

// Function to fetch YouTube direct URL using a public service
async function fetchYouTubeDirectURL(videoId) {
  // Method 1: Try using YouTube's player API with CORS proxy
  try {
    const videoPageURL = `https://www.youtube.com/watch?v=${videoId}`;
    const proxyURL = `https://api.allorigins.win/get?url=${encodeURIComponent(videoPageURL)}`;
    
    const response = await fetch(proxyURL);
    const data = await response.json();
    const html = data.contents;
    
    // Extract player response from the page HTML
    const playerResponseMatch = html.match(/var ytInitialPlayerResponse = ({.+?});/);
    if (playerResponseMatch) {
      const playerResponse = JSON.parse(playerResponseMatch[1]);
      const streamingData = playerResponse.streamingData;
      
      if (streamingData) {
        // Try formats first (progressive downloads)
        if (streamingData.formats && streamingData.formats.length > 0) {
          const videoFormats = streamingData.formats.filter(f => 
            f.mimeType && f.mimeType.startsWith('video/mp4')
          );
          if (videoFormats.length > 0) {
            const bestFormat = videoFormats.sort((a, b) => {
              const aQuality = (a.width || 0) * (a.height || 0) + (a.bitrate || 0);
              const bQuality = (b.width || 0) * (b.height || 0) + (b.bitrate || 0);
              return bQuality - aQuality;
            })[0];
            
            if (bestFormat.url) {
              return bestFormat.url;
            }
            
            if (bestFormat.signatureCipher) {
              const cipherParams = new URLSearchParams(bestFormat.signatureCipher);
              return cipherParams.get('url');
            }
          }
        }
        
        // Try adaptiveFormats
        if (streamingData.adaptiveFormats && streamingData.adaptiveFormats.length > 0) {
          const videoFormats = streamingData.adaptiveFormats.filter(f => 
            f.mimeType && f.mimeType.startsWith('video/mp4') && f.url
          );
          if (videoFormats.length > 0) {
            const bestFormat = videoFormats.sort((a, b) => {
              const aQuality = (a.width || 0) * (a.height || 0) + (a.bitrate || 0);
              const bQuality = (b.width || 0) * (b.height || 0) + (b.bitrate || 0);
              return bQuality - aQuality;
            })[0];
            
            if (bestFormat.url) {
              return bestFormat.url;
            }
          }
        }
      }
    }
    
    // Alternative: Try to find video URL in other patterns
    const urlPattern = /"url":"(https:\/\/[^"]*googlevideo\.com[^"]*)"/g;
    const matches = html.match(urlPattern);
    if (matches && matches.length > 0) {
      const urlMatch = matches[0].match(/"url":"([^"]*)"/);
      if (urlMatch && urlMatch[1]) {
        return urlMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
      }
    }
  } catch (e) {
    console.error('YouTube conversion failed:', e);
  }
  
  return null;
}

async function loadVideoURL(url) {
  // Validate URL
  if (!url || url.trim() === '') {
    alert('Please enter a valid video URL');
    return;
  }
  
  // Check if it's a YouTube URL
  if (isYouTubeURL(url)) {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      alert('Could not extract YouTube video ID from URL. Please check the URL format.');
      return;
    }
    
    // Show loading state
    const originalSrc = video.src;
    video.src = 'blank.mp4';
    
    try {
      const directVideoURL = await fetchYouTubeDirectURL(videoId);
      
      if (directVideoURL) {
        // Load the direct video URL
        video.preload = "metadata";
        video.objectURL = false;
        video.crossOrigin = "anonymous";
        video.src = directVideoURL;
        video.load();
      } else {
        throw new Error('Could not get direct video URL');
      }
    } catch (error) {
      console.error('Error converting YouTube URL:', error);
      alert('YouTube videos require conversion to direct URL.\n\n' +
            'Please use one of these methods:\n' +
            '1. Use a YouTube to MP4 converter website (e.g., yt1s.com, loader.to)\n' +
            '2. Download the video and use "Video from file" option\n' +
            '3. Or paste the direct video URL here\n\n' +
            'Note: Direct YouTube URL conversion may not work for all videos due to YouTube restrictions.');
      video.src = originalSrc || 'blank.mp4';
      return;
    }
  } else {
    // Regular URL (non-YouTube)
    try {
      new URL(url);
    } catch (e) {
      alert('Please enter a valid URL (e.g., https://example.com/video.mp4)');
      return;
    }
    
    // Clean up previous object URL if it exists
    if (video.objectURL && video.src && video.src.startsWith('blob:')) {
      URL.revokeObjectURL(video.src);
    }
    
    console.log('Loading video URL:', url);
    
    // Set video source
    video.preload = "metadata";
    video.objectURL = false;
    video.crossOrigin = "anonymous";
    video.src = url;
    video.load();
  }
  
  // Enable controls and buttons
  snap.disabled = false;
  snap2.disabled = false;
  videoControls.style.display = "";
  
  // Handle video load errors
  video.onerror = function(e) {
    console.error('Error loading video:', e);
    alert('Error loading video. Please check:\n1. The URL is correct and accessible\n2. The video format is supported (MP4, WebM, etc.)\n3. CORS is enabled on the server (if loading from a different domain)');
    video.src = 'blank.mp4';
    snap.disabled = true;
    snap2.disabled = true;
    videoControls.style.display = 'none';
  };
  
  // Resize will be called when metadata is loaded (in loadedmetadata event)
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
