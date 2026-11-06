(function () {
  "use strict";

  /* =====================================================================
   * Helpers
   * ===================================================================== */

  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function pickWeighted(options) {
    let total = 0;
    for (const o of options) total += o.weight;
    let r = Math.random() * total;
    for (const o of options) {
      r -= o.weight;
      if (r <= 0) return o;
    }
    return options[0];
  }

  /* =====================================================================
   * Error message
   * ===================================================================== */

  const params = new URLSearchParams(window.location.search);

  function goBack() {
    if (window.history.length > 1) window.history.back();
    else window.location.href = "https://slack.com";
  }

  function buildAction(action, primary) {
    const cls = "btn" + (primary ? " btn--primary" : "");
    if (action.type === "link") {
      const a = el("a", cls, action.label);
      a.href = action.href;
      return a;
    }
    const button = el("button", cls, action.label);
    button.type = "button";
    button.addEventListener("click", action.type === "reload" ? () => window.location.reload() : goBack);
    return button;
  }

  function renderMessage() {
    const catalog = window.ERROR_MESSAGES;
    const title = document.getElementById("error-title");
    const text = document.getElementById("error-text");
    const codeEl = document.getElementById("error-code");
    const actionsEl = document.getElementById("error-actions");
    if (!catalog || !title || !text) return; // keep the static HTML content

    const code = params.get("code") || params.get("error");
    const hasCode = Boolean(code && catalog[code] && code !== "default");
    const msg = hasCode ? catalog[code] : catalog.default;

    document.title = msg.title.replace(/[….!]+$/, "") + " | Slack";
    title.textContent = msg.title;
    text.textContent = msg.text;

    codeEl.hidden = !hasCode;
    codeEl.textContent = hasCode ? "Error " + code : "";

    actionsEl.replaceChildren(...msg.actions.map((action, i) => buildAction(action, i === 0)));
    actionsEl.hidden = msg.actions.length === 0;
  }

  /* =====================================================================
   * Scene: scale + horizontal parallax
   * ===================================================================== */

  const SCENE_W = 6000; // size of marrakesh-meadow-80.jpg
  const SCENE_H = 1000;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let content;
  let scale = 0.55;
  const view = { left: 0, right: 0 }; // visible range in scene coordinates

  // pan: 0 = left end of the image, 1 = right end
  const pan = { current: 0.5, target: 0.5, raf: 0, last: 0 };

  function applyPan() {
    const viewW = content.clientWidth / scale;
    view.left = Math.max(0, SCENE_W - viewW) * pan.current;
    view.right = view.left + viewW;
    content.style.setProperty("--tx", `${-view.left * scale}px`);
  }

  function fit() {
    scale = Math.max(content.clientHeight / SCENE_H, content.clientWidth / SCENE_W);
    content.style.setProperty("--k", scale);
    applyPan();
  }

  function panTick(now) {
    const dt = Math.min(now - pan.last, 250);
    pan.last = now;
    const diff = pan.target - pan.current;
    if (reduceMotion || Math.abs(diff) < 0.0003) {
      pan.current = pan.target;
      pan.raf = 0;
    } else {
      pan.current += diff * (1 - Math.exp(-dt / 140)); // smooth, frame-rate independent
      pan.raf = requestAnimationFrame(panTick);
    }
    applyPan();
  }

  function setPanTarget(value) {
    pan.target = clamp(value, 0, 1);
    if (!pan.raf) {
      pan.last = performance.now();
      pan.raf = requestAnimationFrame(panTick);
    }
  }

  function initPan() {
    // A small dead zone at each edge, so reaching the edge reaches the end of the image
    const EDGE = 0.06;
    window.addEventListener(
      "pointermove",
      (e) => setPanTarget((e.clientX / window.innerWidth - EDGE) / (1 - 2 * EDGE)),
      { passive: true },
    );
    window.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") setPanTarget(pan.target - 0.12);
      else if (e.key === "ArrowRight") setPanTarget(pan.target + 0.12);
    });
  }

  /* =====================================================================
   * Sprites
   * ===================================================================== */

  // frames = frames in the sheet; fps = playback speed
  const SHEETS = {
    chicken: {
      w: 148,
      h: 110,
      foot: 14, // distance from the feet to the bottom of the frame
      anims: {
        walk: { src: "chicken-walk.png", frames: 24, fps: 16 },
        idle: { src: "chicken-idle-2.png", frames: 47, fps: 12 },
        look: { src: "chicken-look.png", frames: 55, fps: 12 },
        peck: { src: "chicken-peck-2x.png", frames: 40, fps: 12 },
        fly: { src: "chicken-flying.png", frames: 42, fps: 18 },
      },
    },
    piggy: {
      w: 88,
      h: 62,
      foot: 3,
      anims: {
        walk: { src: "piggy-walk.png", frames: 24, fps: 16 },
        look: { src: "piggy-look.png", frames: 48, fps: 12 },
        nibble: { src: "piggy-nibble.png", frames: 60, fps: 12 },
        chew: { src: "piggy-chew.png", frames: 53, fps: 12 },
      },
    },
    butterfly: {
      w: 70,
      h: 65,
      foot: 0,
      anims: {
        side: { src: "butterfly-side.png", frames: 14, fps: 20 },
        rooked: { src: "butterfly-rooked.png", frames: 14, fps: 20 },
        angle: { src: "butterfly-angle.png", frames: 20, fps: 24 },
        angle1: { src: "butterfly-angle-1.png", frames: 34, fps: 28 },
      },
    },
  };

  /**
   * Loads AND decodes every sheet before the scene starts, so the first frame
   * of each animation never paints blank.
   */
  function preload() {
    const box = document.getElementById("preload");
    const srcs = new Set();
    Object.values(SHEETS).forEach((s) => Object.values(s.anims).forEach((a) => srcs.add(a.src)));
    const loads = [...srcs].map((src) => {
      const img = new Image();
      img.src = `assets/${src}`;
      if (box) box.append(img);
      return (img.decode ? img.decode() : Promise.resolve()).catch(() => {});
    });
    return Promise.race([Promise.all(loads), sleep(8000)]);
  }

  /**
   * An actor is a root (position/scale) > flip (mirroring) > one layer per
   * animation. Every layer already has its sheet as background; switching
   * animations only toggles visibility, so nothing reloads or flashes.
   */
  function createActor(wrapper, kind, opts) {
    const sheet = SHEETS[kind];
    const root = el("div", "actor");
    const flip = el("div", "flip");
    flip.style.width = sheet.w + "px";
    flip.style.height = sheet.h + "px";

    const layers = {};
    for (const [name, def] of Object.entries(sheet.anims)) {
      const layer = el("div", "sprite is-off");
      layer.style.backgroundImage = `url(assets/${def.src})`;
      flip.append(layer);
      layers[name] = layer;
    }
    root.append(flip);
    wrapper.append(root);

    const actor = {
      kind,
      sheet,
      root,
      flip,
      layers,
      current: null,
      x: 0,
      y: 0,
      heading: opts.heading || 1,
      animations: new Set(),
      stationary: false,
      wantFly: false,
    };

    root.style.zIndex = String(opts.z);
    root.style.scale = String(opts.scale || 1);
    actor.baseY = opts.feetY !== undefined ? opts.feetY - sheet.h + sheet.foot : opts.y;
    place(actor, opts.x, actor.baseY);
    if (kind !== "butterfly") face(actor, actor.heading);
    show(actor, opts.anim);
    return actor;
  }

  function place(actor, x, y) {
    actor.x = x;
    actor.y = y;
    actor.root.style.left = x - actor.sheet.w / 2 + "px";
    actor.root.style.top = y + "px";
  }

  function face(actor, dir) {
    actor.flip.style.transform = dir < 0 ? "scaleX(-1)" : "";
  }

  function show(actor, name) {
    if (actor.current === name) return;
    actor.layers[name].classList.remove("is-off"); // show the new one first...
    if (actor.current) actor.layers[actor.current].classList.add("is-off"); // ...then hide the old one
    actor.current = name;
  }

  function track(actor, animation) {
    actor.animations.add(animation);
    const done = () => actor.animations.delete(animation);
    animation.finished.then(done, done);
    return animation;
  }

  const settle = (animation) => animation.finished.catch(() => {});

  function cycleMs(actor, name) {
    const def = actor.sheet.anims[name];
    return (def.frames / def.fps) * 1000;
  }

  /** Plays a sprite sheet `iterations` times (Infinity is accepted). */
  function play(actor, name, iterations = 1) {
    const def = actor.sheet.anims[name];
    show(actor, name);
    const animation = actor.layers[name].animate(
      [{ backgroundPositionX: "0px" }, { backgroundPositionX: `${-def.frames * actor.sheet.w}px` }],
      { duration: cycleMs(actor, name), iterations, easing: `steps(${def.frames}, end)` },
    );
    return track(actor, animation);
  }

  async function playStationary(actor, name, iterations = 1) {
    actor.stationary = true;
    await settle(play(actor, name, iterations));
    actor.stationary = false;
  }

  /** Interrupts idle actions (used when a chicken is clicked). */
  function interrupt(actor) {
    if (actor.stationary) actor.animations.forEach((a) => a.cancel());
  }

  /* ---------- Crossing the scene ---------- */

  const EXIT_MARGIN = 0.8; // how far past the edge (in sprite widths) an actor travels before wrapping

  /** Where a trip of `dx` ends. Near an edge, the trip goes all the way out of the image. */
  function resolveTarget(actor, dx) {
    const w = actor.sheet.w;
    const target = actor.x + dx;
    if (dx > 0 && target > SCENE_W - 150) return SCENE_W + w * EXIT_MARGIN;
    if (dx < 0 && target < 150) return -w * EXIT_MARGIN;
    return target;
  }

  /** Off the image on one side? Reappear off the image on the other side. */
  function wrapIfOut(actor) {
    const w = actor.sheet.w;
    if (actor.x > SCENE_W + w * 0.75) place(actor, -w * EXIT_MARGIN, actor.y);
    else if (actor.x < -w * 0.75) place(actor, SCENE_W + w * EXIT_MARGIN, actor.y);
  }

  const isOffstage = (actor) => actor.x < 0 || actor.x > SCENE_W;

  /** Walks `distance` in the actor's heading. */
  async function walk(actor, distance, speed) {
    const target = resolveTarget(actor, actor.heading * distance);
    const dx = target - actor.x;
    const cycle = cycleMs(actor, "walk");
    const cycles = Math.max(1, Math.round(((Math.abs(dx) / speed) * 1000) / cycle));

    place(actor, target, actor.y);
    const move = actor.root.animate(
      [{ transform: `translateX(${-dx}px)` }, { transform: "translateX(0)" }],
      { duration: cycles * cycle, easing: "linear" },
    );
    await Promise.all([settle(move), settle(play(actor, "walk", cycles))]);
    wrapIfOut(actor);
  }

  /** Flapping hop along the actor's heading. */
  async function fly(actor) {
    const target = resolveTarget(actor, actor.heading * rand(220, 380));
    const dx = target - actor.x;
    const lift = rand(110, 180);

    place(actor, target, actor.y);
    const move = actor.root.animate(
      [
        { transform: `translate(${-dx}px, 0)`, easing: "ease-out" },
        { transform: `translate(${-dx / 2}px, ${-lift}px)`, offset: 0.5, easing: "ease-in" },
        { transform: "translate(0, 0)" },
      ],
      { duration: cycleMs(actor, "fly") },
    );
    await Promise.all([settle(move), settle(play(actor, "fly", 1))]);
    wrapIfOut(actor);
  }

  /* ---------- Behaviors ---------- */

  async function chickenLoop(actor) {
    for (;;) {
      if (actor.wantFly) {
        actor.wantFly = false;
        await fly(actor);
        continue;
      }
      // Out of the image: keep walking, so it re-enters right away
      const stay = isOffstage(actor) ? 0 : 1;
      const action = pickWeighted([
        { weight: 2 * stay, run: () => playStationary(actor, "idle") },
        { weight: 1 * stay, run: () => playStationary(actor, "look") },
        { weight: 2 * stay, run: () => playStationary(actor, "peck", pick([1, 2])) },
        { weight: 6, run: () => walk(actor, rand(250, 600), 47) },
        { weight: 0.5 * stay, run: () => fly(actor) },
      ]);
      await action.run();
    }
  }

  async function piggyLoop(actor) {
    for (;;) {
      const stay = isOffstage(actor) ? 0 : 1;
      const action = pickWeighted([
        { weight: 2 * stay, run: () => playStationary(actor, "nibble") },
        { weight: 1.5 * stay, run: () => playStationary(actor, "chew") },
        { weight: 1.5 * stay, run: () => playStationary(actor, "look") },
        { weight: 6, run: () => walk(actor, rand(250, 550), 40) },
      ]);
      await action.run();
    }
  }

  async function butterflyLoop(actor, animName) {
    play(actor, animName, Infinity);
    for (;;) {
      const target = resolveTarget(actor, actor.heading * rand(350, 700));
      const ty = rand(330, 820);
      const dx = target - actor.x;
      const dy = ty - actor.y;
      const duration = (Math.abs(dx) / rand(70, 110)) * 1000;
      const wobble = () => rand(-80, 80);

      place(actor, target, ty);
      const move = actor.root.animate(
        [
          { transform: `translate(${-dx}px, ${-dy}px)` },
          { transform: `translate(${-dx * 0.65 + wobble()}px, ${-dy * 0.65 + wobble()}px)`, offset: 0.3 },
          { transform: `translate(${-dx * 0.25 + wobble()}px, ${-dy * 0.25 + wobble()}px)`, offset: 0.7 },
          { transform: "translate(0, 0)" },
        ],
        { duration, easing: "ease-in-out" },
      );
      await settle(move);
      wrapIfOut(actor);
    }
  }

  /* ---------- Scene setup ---------- */

  async function startScene() {
    const wrapper = document.getElementById("sprite-wrapper");
    if (!wrapper) return;

    await preload();

    const GROUND_TOP = 845; // feet range (scene Y) where animals walk
    const GROUND_BOTTOM = 935;
    const ground = (lane) => GROUND_TOP + (GROUND_BOTTOM - GROUND_TOP) * lane;
    const actors = [];

    // Animals are spread over the whole image, so there is always something to see while panning
    const CHICKENS = 6;
    for (let i = 0; i < CHICKENS; i++) {
      const lane = Math.random();
      const actor = createActor(wrapper, "chicken", {
        x: ((i + 0.5) * SCENE_W) / CHICKENS + rand(-250, 250),
        feetY: ground(lane),
        scale: 0.9 + 0.15 * lane,
        z: Math.round(ground(lane)),
        heading: i % 2 ? -1 : 1,
        anim: pick(["idle", "peck", "look"]),
      });
      actor.root.classList.add("is-clickable");
      actor.root.addEventListener("pointerdown", () => {
        actor.wantFly = true;
        interrupt(actor);
      });
      actors.push([actor, chickenLoop]);
    }

    [1, -1, 1].forEach((heading, i) => {
      const lane = Math.random();
      const actor = createActor(wrapper, "piggy", {
        x: 1000 + i * 2000 + rand(-300, 300),
        feetY: ground(lane),
        scale: 0.9 + 0.15 * lane,
        z: Math.round(ground(lane)),
        heading,
        anim: pick(["nibble", "chew", "look"]),
      });
      actors.push([actor, piggyLoop]);
    });

    const BUTTERFLY_ANIMS = ["side", "angle", "angle1", "rooked"];
    const BUTTERFLIES = 8;
    for (let i = 0; i < BUTTERFLIES; i++) {
      const animName = BUTTERFLY_ANIMS[i % BUTTERFLY_ANIMS.length];
      const actor = createActor(wrapper, "butterfly", {
        x: ((i + 0.5) * SCENE_W) / BUTTERFLIES + rand(-200, 200),
        y: rand(330, 820),
        z: 2000,
        heading: i % 3 === 0 ? -1 : 1,
        anim: animName,
      });
      actors.push([actor, (a) => butterflyLoop(a, animName)]);
    }

    // Reduced motion: static scene
    if (reduceMotion) return;

    // Staggered start, so they do not move in sync
    actors.forEach(([actor, loop]) => sleep(rand(0, 1500)).then(() => loop(actor)));
  }

  /* ---------- Init ---------- */

  function init() {
    content = document.getElementById("content");
    renderMessage();
    if (!content) return;
    fit();
    window.addEventListener("resize", fit);
    initPan();
    startScene();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
