(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const photos = window.DNA_PHOTOS || [];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(pointer: fine)');
  if (!reducedMotion.matches && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('js-motion');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    }), { threshold: .1 });
    $$('.reveal').forEach(element => observer.observe(element));
  }
  for (let i = 0; i < 18; i++) {
    const light = document.createElement('i');
    light.style.cssText = `left:${(i * 37 + 7) % 100}%;top:${(i * 23 + 11) % 100}%;animation-delay:${-i * .73}s;animation-duration:${7 + i % 5}s`;
    $('.fireflies').append(light);
  }
  $$('.depth').forEach(frame => {
    frame.addEventListener('pointermove', event => {
      if (reducedMotion.matches || !finePointer.matches) return;
      const box = frame.getBoundingClientRect();
      frame.style.setProperty('--rx', `${-(event.clientY - box.top - box.height / 2) / box.height * 10}deg`);
      frame.style.setProperty('--ry', `${(event.clientX - box.left - box.width / 2) / box.width * 12}deg`);
    });
    frame.addEventListener('pointerleave', () => { frame.style.setProperty('--rx', '0deg'); frame.style.setProperty('--ry', '0deg'); });
  });

  const chapters = [
    { place:'ISKCON TEMPLE, PUNE', title:'The first hello.', text:'We first met at ISKCON in Pune. For Dhanraj, that first meeting held a feeling he would never forget: this was the person he wanted beside him for life.' },
    { place:'LITTLE DATES. LASTING MEMORIES.', title:'Finding our kind of happiness.', text:'Movie plans, days at Amanora Mall and Seasons Mall, and Ganpati darshan. With each outing, we found more moments to call our own. Through it all, Apeksha’s kindness, calm and beautiful smile made Dhanraj feel understood.' },
    { place:'28 MAY 2026 · OUR ENGAGEMENT', title:'A beautiful beginning, together.', text:'On 28 May 2026, we got engaged. A day full of meaning, and the start of a new chapter for Apeksha and Dhanraj. These photographs and films hold the joy of that beginning, for us and for everyone who shares our happiness.' }
  ];
  function setChapter(index, focus = false) {
    $$('.story-chapters button').forEach((button, i) => { button.setAttribute('aria-selected', String(i === index)); button.tabIndex = i === index ? 0 : -1; if (focus && i === index) button.focus(); });
    const chapter = chapters[index];
    const panel = $('#story-panel');
    panel.setAttribute('aria-labelledby', `chapter-${index}`);
    panel.replaceChildren();
    [['p', 'chapter-place', chapter.place], ['h3', '', chapter.title], ['p', '', chapter.text]].forEach(([tag, className, text]) => { const element = document.createElement(tag); element.className = className; element.textContent = text; panel.append(element); });
  }
  $$('.story-chapters button').forEach((button, index) => {
    button.addEventListener('click', () => setChapter(index));
    button.addEventListener('keydown', event => {
      const keys = { ArrowRight:(index + 1) % 3, ArrowLeft:(index + 2) % 3, Home:0, End:2 };
      if (event.key in keys) { event.preventDefault(); setChapter(keys[event.key], true); }
    });
  });

  let rendered = 0;
  const firstPage = 12;
  $('#photo-count').textContent = `${photos.length} PHOTOGRAPHS`;
  function renderPhotos(amount) {
    photos.slice(rendered, rendered + amount).forEach((photo, offset) => {
      const index = rendered + offset;
      const button = document.createElement('button'); button.className = 'gallery-photo'; button.setAttribute('aria-label', `Open engagement photograph ${index + 1} of ${photos.length}`);
      const img = document.createElement('img'); img.src = photo.thumb; img.alt = photo.alt; img.loading = 'lazy'; img.decoding = 'async'; img.width = photo.width; img.height = photo.height;
      const expand = document.createElement('span'); expand.textContent = '↗'; expand.setAttribute('aria-hidden', 'true');
      button.append(img, expand); button.addEventListener('click', () => openPhoto(index)); $('#photo-grid').append(button);
    });
    rendered = Math.min(rendered + amount, photos.length);
    $('#album-progress').textContent = `${rendered} of ${photos.length} memories`;
    $('#load-more').hidden = rendered === photos.length;
  }
  renderPhotos(firstPage);
  $('#load-more').addEventListener('click', () => {
    const previousCount = rendered;
    renderPhotos(photos.length);
    const next = $('#photo-grid').children[previousCount];
    next?.focus({ preventScroll:true });
    next?.scrollIntoView({ behavior:reducedMotion.matches ? 'instant' : 'smooth', block:'center' });
  });

  let currentPhoto = 0, slideshow = null, lastFocus = null;
  const photoDialog = $('#photo-dialog');
  const videoDialog = $('#video-dialog');
  function showPhoto(index) {
    currentPhoto = (index + photos.length) % photos.length;
    const photo = photos[currentPhoto];
    $('#viewer-image').src = photo.src; $('#viewer-image').alt = photo.alt;
    $('#viewer-count').textContent = `${String(currentPhoto + 1).padStart(2, '0')} / ${photos.length}`;
    $('#viewer-caption').textContent = 'Our engagement · 28 May 2026';
  }
  function showDialog(dialog) { lastFocus = document.activeElement; dialog.showModal(); document.body.classList.add('modal-open'); }
  function openPhoto(index) { showPhoto(index); showDialog(photoDialog); }
  $$('[data-photo]').forEach(button => button.addEventListener('click', () => openPhoto(photos.findIndex(photo => photo.id === button.dataset.photo))));
  $('#previous-photo').addEventListener('click', () => showPhoto(currentPhoto - 1));
  $('#next-photo').addEventListener('click', () => showPhoto(currentPhoto + 1));
  function stopSlideshow() { clearInterval(slideshow); slideshow = null; $('#slideshow-toggle').textContent = 'Play slideshow'; }
  function startSlideshow() { stopSlideshow(); slideshow = setInterval(() => showPhoto(currentPhoto + 1), 4500); $('#slideshow-toggle').textContent = 'Pause slideshow'; }
  $('#slideshow-start').addEventListener('click', () => { openPhoto(0); startSlideshow(); });
  $('#slideshow-toggle').addEventListener('click', () => slideshow ? stopSlideshow() : startSlideshow());
  photoDialog.addEventListener('keydown', event => { if (event.key === 'ArrowLeft') { event.preventDefault(); showPhoto(currentPhoto - 1); } if (event.key === 'ArrowRight') { event.preventDefault(); showPhoto(currentPhoto + 1); } });
  let swipeX = null;
  $('.viewer-stage').addEventListener('touchstart', event => { swipeX = event.changedTouches[0].clientX; }, { passive:true });
  $('.viewer-stage').addEventListener('touchend', event => { const difference = event.changedTouches[0].clientX - swipeX; if (swipeX !== null && Math.abs(difference) > 45) showPhoto(currentPhoto + (difference < 0 ? 1 : -1)); swipeX = null; }, { passive:true });
  [photoDialog, videoDialog].forEach(dialog => {
    dialog.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog && dialog === photoDialog) dialog.close(); });
    dialog.addEventListener('close', () => { document.body.classList.remove('modal-open'); stopSlideshow(); if (dialog === videoDialog) $('#video-player').replaceChildren(); lastFocus?.focus({ preventScroll:true }); });
  });
  $$('[data-video]').forEach(button => button.addEventListener('click', () => {
    pauseMusic();
    stopSong();
    const id = button.dataset.video;
    $('#video-title').textContent = button.dataset.title;
    $('#youtube-link').href = `https://www.youtube.com/watch?v=${id}`;
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
    iframe.title = button.dataset.title; iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'; iframe.allowFullscreen = true; iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    $('#video-player').replaceChildren(iframe); showDialog(videoDialog);
  }));

  const panel = $('#sound-panel');
  function setSoundPanel(open) { panel.hidden = !open; $('#sound-toggle').setAttribute('aria-expanded', String(open)); }
  $('#sound-toggle').addEventListener('click', () => setSoundPanel(panel.hidden));
  $('#sound-close').addEventListener('click', () => { setSoundPanel(false); $('#sound-toggle').focus(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel.hidden) { setSoundPanel(false); $('#sound-toggle').focus(); } });
  document.addEventListener('click', event => { if (!panel.hidden && !panel.contains(event.target) && !$('#sound-toggle').contains(event.target)) setSoundPanel(false); });
  let audioContext = null, master = null, musicTimer = null, playing = false, step = 0;
  const moods = {
    moonlight:{ notes:[60,64,67,71,67,64,62,67,69,74,69,67,57,60,64,69], pace:720, type:'sine', duration:3.6 },
    golden:{ notes:[55,62,67,71,62,67,52,59,64,67,59,64,53,60,65,69], pace:560, type:'triangle', duration:2.8 },
    celebration:{ notes:[60,64,67,72,74,72,67,64,65,69,72,77,76,72,69,65], pace:340, type:'sine', duration:2.2 }
  };
  function note(midi, duration, type, amplitude) {
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator(); const gain = audioContext.createGain();
    oscillator.type = type; oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(amplitude, now + .045); gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    oscillator.connect(gain); gain.connect(master); oscillator.start(now); oscillator.stop(now + duration + .05);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  function tickMusic() {
    if (!playing) return;
    const mood = moods[$('#music-mood').value];
    note(mood.notes[step % mood.notes.length], mood.duration, mood.type, .2);
    if (step % 4 === 0) note(mood.notes[step % mood.notes.length] - 12, mood.duration + 1, 'sine', .13);
    step++; musicTimer = setTimeout(tickMusic, mood.pace);
  }
  async function playMusic() {
    try {
      stopSong();
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) throw new Error('unsupported');
      if (!audioContext) { audioContext = new Audio(); master = audioContext.createGain(); master.connect(audioContext.destination); }
      await audioContext.resume(); playing = true; master.gain.setTargetAtTime(Number($('#music-volume').value) / 100, audioContext.currentTime, .2);
      clearTimeout(musicTimer); tickMusic(); $('#music-play').textContent = 'Pause ambience Ⅱ'; $('#sound-toggle').classList.add('is-playing'); $('#music-status').textContent = '';
    } catch { $('#music-status').textContent = 'Audio is unavailable in this browser. You can still enjoy all the films.'; }
  }
  function pauseMusic() { playing = false; clearTimeout(musicTimer); if (master) master.gain.setTargetAtTime(0, audioContext.currentTime, .1); $('#music-play').textContent = 'Play ambience ♫'; $('#sound-toggle').classList.remove('is-playing'); }
  $('#music-play').addEventListener('click', () => playing ? pauseMusic() : playMusic());
  $('#music-mood').addEventListener('change', () => { step = 0; if (playing) { clearTimeout(musicTimer); tickMusic(); } });
  $('#music-volume').addEventListener('input', () => { if (master && playing) master.gain.setTargetAtTime(Number($('#music-volume').value) / 100, audioContext.currentTime, .1); });
  function stopSong() {
    $('#song-player').replaceChildren();
    $('#song-dock').hidden = true;
    $$('[data-song]').forEach(button => button.removeAttribute('aria-current'));
  }
  $$('[data-song]').forEach(button => button.addEventListener('click', () => {
    pauseMusic(); stopSong();
    const id = button.dataset.song;
    const frame = document.createElement('iframe');
    frame.title = `${button.dataset.songTitle} — ${button.dataset.artist}`;
    frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1&loop=1&playlist=${id}`;
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    $('#song-title').textContent = button.dataset.songTitle;
    $('#song-artist').textContent = button.dataset.artist;
    $('#song-youtube-link').href = `https://www.youtube.com/watch?v=${id}`;
    $('#song-player').append(frame); $('#song-dock').hidden = false;
    button.setAttribute('aria-current', 'true'); setSoundPanel(false);
    $('#song-stop').focus({ preventScroll:true });
  }));
  $('#song-stop').addEventListener('click', () => { stopSong(); $('#sound-toggle').focus({ preventScroll:true }); });
  $('#song-change').addEventListener('click', event => { event.stopPropagation(); setSoundPanel(true); $('[data-song]').focus(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { pauseMusic(); stopSlideshow(); } });
  $('#celebrate').addEventListener('click', () => {
    $('#celebrate-message').textContent = 'A little more love for Apeksha & Dhanraj. Thank you! ♡';
    const container = $('#confetti'); container.replaceChildren();
    if (reducedMotion.matches) return;
    for (let i = 0; i < 42; i++) {
      const petal = document.createElement('span'); petal.textContent = i % 3 ? '♡' : '✧';
      petal.style.cssText = `left:${Math.random() * 100}%;color:${['#d6b777','#96ac84','#b691b1'][i % 3]};animation-delay:${Math.random() * .9}s;--drift:${Math.random() * 180 - 90}px`;
      container.append(petal);
    }
    setTimeout(() => container.replaceChildren(), 5000);
  });
})();
