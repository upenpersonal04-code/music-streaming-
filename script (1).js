// ---------- 1. Song data ----------
// To add your own songs: put .mp3 files in a "songs" folder and use  src: "songs/yourfile.mp3"
const songs = [
  { id: 1, title: "Sunrise Drive",   artist: "SoundHelix", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", colors: ["#ff8a5c", "#c2185b"] },
  { id: 2, title: "Neon Rain",       artist: "SoundHelix", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", colors: ["#5c7cff", "#7b1fa2"] },
  { id: 3, title: "Slow Orbit",      artist: "SoundHelix", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", colors: ["#26c6a2", "#1565c0"] },
  { id: 4, title: "Paper Planes",    artist: "SoundHelix", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", colors: ["#ffd54f", "#ef6c00"] },
  { id: 5, title: "Midnight Library",artist: "SoundHelix", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", colors: ["#9575cd", "#283593"] },
  { id: 6, title: "Monsoon Walk",    artist: "SoundHelix", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3", colors: ["#4db6ac", "#33691e"] },
];

// ---------- 2. State ----------
const audio = document.getElementById("audio");
const $ = (id) => document.getElementById(id);
let view = "all";
let query = "";
let queue = [];          // songs currently shown (play order)
let current = -1;        // index in queue
let shuffleOn = false;
let repeatOn = false;
let liked = new Set();
try { liked = new Set(JSON.parse(localStorage.getItem("wavy-liked") || "[]")); } catch (e) {}

// ---------- 3. Helpers ----------
const grad = (s) => `linear-gradient(135deg, ${s.colors[0]}, ${s.colors[1]})`;
const fmt = (t) => {
  if (!isFinite(t)) return "0:00";
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};
const saveLiked = () => {
  try { localStorage.setItem("wavy-liked", JSON.stringify([...liked])); } catch (e) {}
};

// ---------- 4. Render list ----------
function render() {
  queue = songs.filter((s) =>
    (view === "all" || liked.has(s.id)) &&
    (s.title + " " + s.artist).toLowerCase().includes(query)
  );
  $("heading").textContent = view === "all" ? "All songs" : "Liked songs";
  $("empty").hidden = queue.length > 0;

  const playingId = audio.dataset.id ? Number(audio.dataset.id) : null;
  $("list").innerHTML = queue.map((s) => `
    <li class="song ${s.id === playingId ? "playing" : ""}" data-id="${s.id}">
      <div class="cover" style="background:${grad(s)}"></div>
      <div><div class="name">${s.title}</div><div class="artist">${s.artist}</div></div>
      <span class="time" data-time="${s.id}"></span>
      <button class="like ${liked.has(s.id) ? "on" : ""}" data-like="${s.id}" aria-label="Like">${liked.has(s.id) ? "♥" : "♡"}</button>
    </li>`).join("");
  current = queue.findIndex((s) => s.id === playingId);
}

// ---------- 5. Playback ----------
function playSong(song) {
  audio.src = song.src;
  audio.dataset.id = song.id;
  audio.play().catch(() => {});
  $("pTitle").textContent = song.title;
  $("pArtist").textContent = song.artist;
  $("cover").style.background = grad(song);
  document.title = `${song.title} – Wavy`;
  render();
}

function step(dir) {
  if (!queue.length) return;
  let i;
  if (shuffleOn) i = Math.floor(Math.random() * queue.length);
  else i = (current + dir + queue.length) % queue.length;
  playSong(queue[i]);
}

function togglePlay() {
  if (!audio.src) { if (queue.length) playSong(queue[0]); return; }
  audio.paused ? audio.play() : audio.pause();
}

// ---------- 6. Events ----------
$("list").addEventListener("click", (e) => {
  const likeBtn = e.target.closest("[data-like]");
  if (likeBtn) {
    const id = Number(likeBtn.dataset.like);
    liked.has(id) ? liked.delete(id) : liked.add(id);
    saveLiked();
    render();
    return;
  }
  const row = e.target.closest(".song");
  if (row) playSong(songs.find((s) => s.id === Number(row.dataset.id)));
});

document.querySelectorAll(".nav").forEach((btn) =>
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    view = btn.dataset.view;
    render();
  })
);

$("search").addEventListener("input", (e) => { query = e.target.value.toLowerCase(); render(); });
$("play").addEventListener("click", togglePlay);
$("next").addEventListener("click", () => step(1));
$("prev").addEventListener("click", () => {
  if (audio.currentTime > 3) audio.currentTime = 0; else step(-1);
});
$("shuffle").addEventListener("click", (e) => { shuffleOn = !shuffleOn; e.currentTarget.classList.toggle("on", shuffleOn); });
$("repeat").addEventListener("click", (e) => { repeatOn = !repeatOn; e.currentTarget.classList.toggle("on", repeatOn); });

audio.addEventListener("play", () => { $("play").textContent = "❚❚"; });
audio.addEventListener("pause", () => { $("play").textContent = "▶"; });
audio.addEventListener("loadedmetadata", () => { $("dur").textContent = fmt(audio.duration); });
audio.addEventListener("timeupdate", () => {
  $("cur").textContent = fmt(audio.currentTime);
  $("seek").value = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
});
audio.addEventListener("ended", () => { repeatOn ? (audio.currentTime = 0, audio.play()) : step(1); });

$("seek").addEventListener("input", (e) => { if (audio.duration) audio.currentTime = (e.target.value / 100) * audio.duration; });
$("volume").addEventListener("input", (e) => { audio.volume = e.target.value; });
audio.volume = 0.8;

// Space bar = play/pause (unless typing in search)
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && e.target.tagName !== "INPUT") { e.preventDefault(); togglePlay(); }
});

render();
