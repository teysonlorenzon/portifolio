(() => {
  "use strict";

  const story = document.querySelector(".story");
  const stage = document.getElementById("storyStage");
  if (!story || !stage) return;

  const stack = document.getElementById("storyStack");
  const tilt = document.getElementById("storyTilt");
  const shadow = stack.querySelector(".stack-shadow");
  const intro = stage.querySelector(".story-intro");
  const introBar = stage.querySelector(".story-intro-bar");
  const pill = stage.querySelector("[data-pill]");
  const doodles = [...stage.querySelectorAll(".doodle")];
  const sceneEls = [...stage.querySelectorAll("[data-scene]")];
  const faceEls = [...stage.querySelectorAll("[data-face]")];
  const playBtn = document.getElementById("storyPlay");
  const playLabel = playBtn.querySelector(".story-play-label");
  const chapterBtns = [...stage.querySelectorAll("[data-chapter]")];
  const controls = stage.querySelector(".story-controls");

  /** Índice da última cena da apresentação. */
  const LAST = chapterBtns.length - 1;

  /** Tempo, em milissegundos, que o autoplay leva para avançar uma cena em velocidade constante. */
  const SCENE_MS = 4200;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /**
   * Limita um valor a um intervalo.
   * @param {number} v Valor de entrada.
   * @param {number} [min=0] Limite inferior.
   * @param {number} [max=1] Limite superior.
   * @returns {number} O valor dentro de [min, max].
   */
  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

  /**
   * Interpolação linear entre dois valores.
   * @param {number} a Valor quando t = 0.
   * @param {number} b Valor quando t = 1.
   * @param {number} t Progresso entre 0 e 1.
   * @returns {number} Valor interpolado.
   */
  const lerp = (a, b, t) => a + (b - a) * t;

  /**
   * Curva de Hermite que vai de 0 a 1 suavemente entre duas bordas.
   * @param {number} e0 Borda inicial, onde a curva ainda vale 0.
   * @param {number} e1 Borda final, onde a curva já vale 1.
   * @param {number} x Valor de entrada.
   * @returns {number} Valor suavizado entre 0 e 1.
   */
  const smoothstep = (e0, e1, x) => {
    const t = clamp((x - e0) / (e1 - e0));
    return t * t * (3 - 2 * t);
  };

  /**
   * Easing cúbico com aceleração e desaceleração.
   * @param {number} t Progresso linear entre 0 e 1.
   * @returns {number} Progresso suavizado entre 0 e 1.
   */
  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  /**
   * Easing linear, usado pelo autoplay para rolar sem pausas.
   * @param {number} t Progresso entre 0 e 1.
   * @returns {number} O mesmo progresso.
   */
  const linear = (t) => t;

  /** Indica se o autoplay está rodando. */
  let playing = false;

  /** Identificador da execução atual; muda a cada play ou stop para cancelar animações em andamento. */
  let runId = 0;

  /** @type {number | undefined} */
  let autostartTimer;

  /** Indica se já existe um quadro de renderização agendado. */
  let ticking = false;

  let start = 0;
  let distance = 1;
  let stageH = 1;
  let stackW = 400;
  let introY = 0;
  let introScale = 1;

  /**
   * Mede a seção e o palco. Na introdução, calcula a posição e a escala que centralizam
   * o editor entre o nome e a faixa inferior. Deve ser chamada sempre que o layout mudar.
   * @returns {void}
   */
  function measure() {
    const stickyTop = parseFloat(getComputedStyle(stage).top) || 0;
    start = story.getBoundingClientRect().top + window.scrollY - stickyTop;
    distance = Math.max(1, story.offsetHeight - stage.offsetHeight);
    stageH = stage.offsetHeight;
    stackW = stack.offsetWidth;

    const stackH = stack.offsetHeight;
    const stackCenter = stack.offsetTop + stackH / 2;
    const introBottom = intro.offsetTop + intro.offsetHeight;
    const barTop = stageH - introBar.offsetHeight;
    const room = barTop - introBottom;
    introY = introBottom + room / 2 - stackCenter;
    introScale = clamp((room - 28) / stackH, 0.45, 1.1);
  }

  /**
   * Converte a rolagem atual em um índice de cena linear.
   * @returns {number} Valor contínuo entre 0 e LAST.
   */
  function rawIndex() {
    return clamp((window.scrollY - start) / distance) * LAST;
  }

  /**
   * Suaviza o índice linear para que cada cena tenha um platô estável e
   * a troca aconteça só no meio do caminho entre duas cenas.
   * @param {number} raw Índice linear vindo de {@link rawIndex}.
   * @returns {number} Índice suavizado entre 0 e LAST.
   */
  function easedIndex(raw) {
    const k = Math.min(Math.floor(raw), LAST - 1);
    return k + smoothstep(0.22, 0.78, raw - k);
  }

  /**
   * Calcula a posição de rolagem em que uma cena fica exatamente no centro do seu platô.
   * @param {number} i Índice da cena, de 0 a LAST.
   * @returns {number} Posição vertical da janela, em pixels.
   */
  function scrollYForScene(i) {
    return start + (distance * i) / LAST;
  }

  /**
   * Desenha o quadro atual da apresentação: inclina e abre a pilha de camadas,
   * troca as faces, posiciona textos, formas e rabiscos e atualiza os capítulos.
   * A pilha abre no meio de cada cena e fecha na troca de conteúdo; o desvio
   * entre o índice linear e o suavizado mantém tudo em movimento durante os platôs.
   * @returns {void}
   */
  function render() {
    ticking = false;

    const raw = rawIndex();
    const s = easedIndex(raw);
    const iso = clamp(s);
    const nearest = Math.round(s);
    const bump = smoothstep(0, 1, 1 - Math.min(Math.abs(raw - Math.round(raw)) * 2, 1));
    const drift = raw - s;
    const unit = stackW / 400;

    const gap = iso * (14 + 52 * bump) * unit;
    const rotX = 56 * iso;
    const rotZ = iso * (-38 + drift * 32);
    const lift = 1.5 * gap * Math.sin((rotX * Math.PI) / 180);

    tilt.style.setProperty("--gap", `${gap.toFixed(2)}px`);
    tilt.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateZ(${rotZ.toFixed(2)}deg)`;
    stack.style.transform = `translate3d(0, ${(lerp(introY, 0, iso) + lift).toFixed(1)}px, 0) scale(${lerp(introScale, 1, iso).toFixed(3)})`;
    shadow.style.opacity = iso.toFixed(3);

    faceEls.forEach((face) => {
      const d = Math.abs(s - Number(face.dataset.face));
      face.style.opacity = clamp(1 - (d - 0.25) * 2).toFixed(3);
    });

    sceneEls.forEach((el) => {
      const d = s - Number(el.dataset.scene);
      const vis = clamp(1 - Math.abs(d) * 2);
      const motion = el.dataset.motion;

      if (motion === "intro") {
        el.style.opacity = clamp(1 - d * 2.2).toFixed(3);
        el.style.transform = `translate3d(0, ${(-d * stageH * 0.35).toFixed(1)}px, 0)`;
      } else if (motion === "bar") {
        el.style.transform = `translate3d(0, ${(clamp(d * 1.6) * 110).toFixed(1)}%, 0)`;
      } else if (motion === "accent") {
        el.style.opacity = vis.toFixed(3);
        el.style.transform = `scale(${(0.8 + 0.2 * vis).toFixed(3)}) rotate(${((d + drift) * 24).toFixed(1)}deg)`;
      } else {
        const shift = el.classList.contains("story-word") ? 70 : 36;
        el.style.opacity = vis.toFixed(3);
        el.style.transform = `translate3d(0, ${(-(d + drift) * shift).toFixed(1)}px, 0)`;
      }
    });

    pill.style.opacity = iso.toFixed(3);

    doodles.forEach((doodle) => {
      const depth = parseFloat(doodle.style.getPropertyValue("--depth")) || 1;
      doodle.style.setProperty("--py", `${(-raw * 26 * depth).toFixed(1)}px`);
      doodle.style.setProperty("--doodle-o", (0.35 + 0.65 * iso).toFixed(3));
    });

    chapterBtns.forEach((btn, c) => {
      const fill = c === 0 ? 1 : clamp(raw - c + 1);
      btn.style.setProperty("--fill", fill.toFixed(3));
      if (c === nearest) btn.setAttribute("aria-current", "step");
      else btn.removeAttribute("aria-current");
    });

    updatePlayLabel();
  }

  /**
   * Agenda um único {@link render} para o próximo quadro, mesmo com vários eventos de rolagem.
   * @returns {void}
   */
  function requestRender() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(render);
    }
  }

  /**
   * Atualiza o texto do botão: "Pausar" durante o autoplay, "Rever" no fim e "Autoplay" nos demais casos.
   * @returns {void}
   */
  function updatePlayLabel() {
    const label = playing ? "Pausar" : rawIndex() >= LAST - 0.01 ? "Rever" : "Autoplay";
    if (playLabel.textContent !== label) playLabel.textContent = label;
  }

  /**
   * Registra o estado do autoplay e sincroniza os atributos de acessibilidade do botão.
   * @param {boolean} value `true` quando o autoplay está rodando.
   * @returns {void}
   */
  function setPlaying(value) {
    playing = value;
    playBtn.setAttribute("aria-pressed", String(value));
    playBtn.setAttribute("aria-label", value ? "Pausar apresentação automática" : "Reproduzir apresentação automática");
    updatePlayLabel();
  }

  /**
   * Rola a página até uma cena. Com movimento reduzido ou duração zero, salta direto.
   * @param {number} i Índice da cena de destino.
   * @param {number} duration Duração da animação, em milissegundos.
   * @param {number} id Valor de {@link runId} desta execução; se mudar, a animação é cancelada.
   * @param {(t: number) => number} [ease=easeInOutCubic] Função de easing.
   * @returns {Promise<boolean>} `true` se chegou ao destino, `false` se foi cancelada.
   */
  function scrollToScene(i, duration, id, ease = easeInOutCubic) {
    const from = window.scrollY;
    const to = scrollYForScene(i);
    if (reduceMotion.matches || duration <= 0 || Math.abs(to - from) < 2) {
      window.scrollTo({ top: to, behavior: "instant" });
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      const t0 = performance.now();

      /**
       * Avança um quadro da animação de rolagem.
       * @param {DOMHighResTimeStamp} now Instante do quadro.
       * @returns {void}
       */
      function step(now) {
        if (id !== runId) return resolve(false);
        const t = clamp((now - t0) / duration);
        window.scrollTo({ top: lerp(from, to, ease(t)), behavior: "instant" });
        if (t < 1) requestAnimationFrame(step);
        else resolve(true);
      }

      requestAnimationFrame(step);
    });
  }

  /**
   * Inicia o autoplay: rola em velocidade constante, sem pausas, do ponto atual até a
   * última cena. Se a apresentação já terminou, volta ao início antes.
   * @returns {Promise<void>}
   */
  async function play() {
    clearTimeout(autostartTimer);
    const id = ++runId;
    setPlaying(true);

    if (rawIndex() >= LAST - 0.01 && !(await scrollToScene(0, 900, id))) return;

    const remaining = LAST - rawIndex();
    if (await scrollToScene(LAST, remaining * SCENE_MS, id, linear)) setPlaying(false);
  }

  /**
   * Interrompe o autoplay e cancela o início automático, se ainda estiver pendente.
   * @returns {void}
   */
  function stop() {
    clearTimeout(autostartTimer);
    if (!playing) return;
    runId += 1;
    setPlaying(false);
  }

  /**
   * Devolve o controle ao usuário quando ele interage com a página fora dos controles da apresentação.
   * @param {Event} event Evento de roda, toque, clique ou teclado.
   * @returns {void}
   */
  function userTakesOver(event) {
    if (event.target instanceof Node && controls.contains(event.target)) return;
    stop();
  }

  /**
   * Remede o layout e redesenha a apresentação.
   * @returns {void}
   */
  function refresh() {
    measure();
    render();
  }

  playBtn.addEventListener("click", () => (playing ? stop() : play()));

  chapterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      stop();
      scrollToScene(Number(btn.dataset.chapter), 1100, ++runId);
    });
  });

  ["wheel", "touchstart", "pointerdown", "keydown"].forEach((type) =>
    window.addEventListener(type, userTakesOver, { passive: true, capture: true })
  );

  window.addEventListener("scroll", requestRender, { passive: true });
  window.addEventListener("resize", refresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  refresh();
  setPlaying(false);

  if (!reduceMotion.matches && rawIndex() < 0.02) {
    autostartTimer = setTimeout(() => {
      if (document.visibilityState === "visible" && rawIndex() < 0.02) play();
    }, 2200);
  }
})();
