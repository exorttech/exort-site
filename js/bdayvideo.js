const video = document.querySelector("[data-bday-video]");
const replayButton = document.querySelector("[data-replay]");

function playFromStart() {
  if (!video) return;
  video.currentTime = 0;
  replayButton.hidden = true;
  video.play().catch(() => {
    replayButton.hidden = false;
  });
}

video?.addEventListener("loadedmetadata", () => {
  video.currentTime = 0;
});

video?.addEventListener("ended", () => {
  replayButton.hidden = false;
});

replayButton?.addEventListener("click", playFromStart);
