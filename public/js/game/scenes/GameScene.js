class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.topic      = data.topic || 'variables_tipos';
    this.topicName  = data.topicName || 'Variables y Tipos';
    this.token      = data.token || window.GAME_TOKEN;
    this.userData   = data.user  || window.GAME_USER;

    this.score          = 0;
    this.distance       = 0;
    this.bonusPoints    = 0;
    this.gameSpeed      = 280;
    this.lanes          = [200, 360, 520];
    this.questions      = [];
    this.questionIndex  = 0;
    this.isOver         = false;
    this.questionActive = false;

    // Colores por tema para personalización visual
    const themeColors = {
      variables_tipos:     0x4F9EFF,
      estructuras_control: 0x10B981,
      funciones:           0xF59E0B,
      poo:                 0x8B5CF6,
      estructuras_datos:   0xEF4444
    };
    this.themeColor = themeColors[this.topic] || 0x4F9EFF;
  }

  preload() {}

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.W = W; this.H = H;

    this.createBackground();
    this.createRoad();
    this.createHUD();

    // Jugador
    this.player = new Player(this, 180, this.lanes);

    // Obstáculos
    this.obstacles = this.physics.add.group();

    // Colisión
    this.physics.add.overlap(
      this.player.sprite,
      this.obstacles,
      this.onHit,
      null,
      this
    );

    // Input teclado
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

    // Input táctil
    let touchStartY = 0;
    this.input.on('pointerdown', p => { touchStartY = p.y; });
    this.input.on('pointerup', p => {
      const dy = p.y - touchStartY;
      if (Math.abs(dy) > 30) this.player.switchLane(dy < 0 ? 'up' : 'down');
    });

    // Timers
    this.obstacleTimer = this.time.addEvent({ delay: 1800, callback: this.spawnObstacle, callbackScope: this, loop: true });
    this.questionTimer = this.time.addEvent({ delay: 20000, callback: this.triggerQuestion, callbackScope: this, loop: true });
    this.speedTimer    = this.time.addEvent({ delay: 8000,  callback: () => { this.gameSpeed = Math.min(this.gameSpeed + 25, 550); }, callbackScope: this, loop: true });

    // Escuchar resultado de pregunta
    this.game.events.on('questionCorrect', this.onQuestionCorrect, this);
    this.game.events.on('questionWrong',   this.onQuestionWrong,   this);

    // Cargar preguntas desde API
    this.loadQuestions();

    // Fade in
    this.cameras.main.fadeIn(400);
  }

  createBackground() {
    const g = this.add.graphics();
    g.fillStyle(0x0F0F23);
    g.fillRect(0, 0, this.W, this.H);
    g.setDepth(0);

    // Degradado superior (cielo)
    for (let i = 0; i < 80; i++) {
      const alpha = (80 - i) / 400;
      g.fillStyle(this.themeColor, alpha);
      g.fillRect(0, i * 2, this.W, 2);
    }

    // Estrellas de fondo (estáticas)
    for (let i = 0; i < 60; i++) {
      const sx = Phaser.Math.RND.between(0, this.W);
      const sy = Phaser.Math.RND.between(0, this.H * 0.4);
      g.fillStyle(0xFFFFFF, Phaser.Math.RND.realInRange(0.1, 0.4));
      g.fillCircle(sx, sy, Phaser.Math.RND.realInRange(0.5, 1.5));
    }

    // Suelo
    g.fillStyle(0x1A1A2E);
    g.fillRect(0, this.H * 0.85, this.W, this.H * 0.15);
  }

  createRoad() {
    const g = this.add.graphics().setDepth(1);
    const roadTop = 120, roadBottom = 640;
    const roadH = roadBottom - roadTop;

    // Área de la carretera
    g.fillStyle(0x1E293B);
    g.fillRect(0, roadTop, this.W, roadH);

    // Bordes de carriles
    this.lanes.forEach(y => {
      g.lineStyle(2, this.themeColor, 0.3);
      g.beginPath(); g.moveTo(0, y + 80); g.lineTo(this.W, y + 80); g.strokePath();
    });

    // Línea superior e inferior de la carretera
    g.lineStyle(3, this.themeColor, 0.6);
    g.beginPath(); g.moveTo(0, roadTop); g.lineTo(this.W, roadTop); g.strokePath();
    g.beginPath(); g.moveTo(0, roadBottom); g.lineTo(this.W, roadBottom); g.strokePath();

    // Marcas de carretera animadas (se mueven con tween)
    this.roadMarks = [];
    for (let x = 0; x < this.W + 120; x += 120) {
      const mark = this.add.rectangle(x, this.H / 2, 80, 4, this.themeColor, 0.4).setDepth(2);
      this.roadMarks.push(mark);
    }
  }

  createHUD() {
    const pad = { x: 8, y: 6 };

    // Fondo HUD
    const hudBg = this.add.graphics().setDepth(20);
    hudBg.fillStyle(0x000000, 0.6);
    hudBg.fillRect(0, 0, this.W, 60);

    // Score
    this.scoreTxt = this.add.text(20, 15, '⭐ 0', {
      fontSize: '22px', fontFamily: 'Segoe UI, Arial', fill: '#FFD166', fontStyle: 'bold'
    }).setDepth(21);

    // Distancia
    this.distTxt = this.add.text(200, 15, '📏 0m', {
      fontSize: '20px', fontFamily: 'Segoe UI, Arial', fill: '#94FADB'
    }).setDepth(21);

    // Tema
    this.add.text(this.W / 2, 15, this.topicName, {
      fontSize: '18px', fontFamily: 'Segoe UI, Arial', fill: '#CBD5E1'
    }).setOrigin(0.5, 0).setDepth(21);

    // Barra de tiempo para siguiente pregunta
    this.qBarBg = this.add.rectangle(this.W - 200, 30, 160, 14, 0x334155).setDepth(21);
    this.qBar   = this.add.rectangle(this.W - 280, 30, 160, 10, 0xFF6B35).setOrigin(0, 0.5).setDepth(22);
    this.add.text(this.W - 40, 30, '❓', { fontSize: '18px' }).setOrigin(0.5).setDepth(22);
  }

  update(time, delta) {
    if (this.isOver || this.questionActive) return;

    // Distancia y puntos por distancia
    this.distance += delta * 0.05;
    this.score = Math.floor(this.distance) + this.bonusPoints;
    this.scoreTxt.setText('⭐ ' + this.score);
    this.distTxt.setText('📏 ' + Math.floor(this.distance) + 'm');

    // Mover marcas de carretera
    const speed = this.gameSpeed * (delta / 1000);
    this.roadMarks.forEach(m => {
      m.x -= speed;
      if (m.x < -60) m.x += this.W + 120;
    });

    // Barra tiempo pregunta (20s = 20000ms)
    const elapsed = this.questionTimer.getElapsed();
    const pct = elapsed / 20000;
    const maxW = 160;
    this.qBar.width = maxW * (1 - pct);
    this.qBar.x = (this.W - 280) + maxW * pct;
    const barColor = pct < 0.6 ? 0x10B981 : pct < 0.85 ? 0xF59E0B : 0xEF4444;
    this.qBar.setFillStyle(barColor);

    // Input
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)   || Phaser.Input.Keyboard.JustDown(this.keyW))   this.player.switchLane('up');
    if (Phaser.Input.Keyboard.JustDown(this.cursors.down) || Phaser.Input.Keyboard.JustDown(this.keyS))   this.player.switchLane('down');

    // Limpiar obstáculos fuera de pantalla
    this.obstacles.getChildren().forEach(obs => {
      if (obs.x < -80) obs.destroy();
    });
  }

  spawnObstacle() {
    if (this.isOver || this.questionActive) return;
    const lane = Phaser.Math.RND.pick([0, 1, 2]);
    const y = this.lanes[lane];
    const obs = this.physics.add.sprite(this.W + 60, y, Phaser.Math.RND.pick(['obstacle', 'obstacle2']));
    obs.setDepth(8);
    obs.body.setVelocityX(-this.gameSpeed);
    obs.body.setSize(44, 44);
    obs.body.setOffset(6, 6);
    this.obstacles.add(obs);

    // Rotación suave
    this.tweens.add({ targets: obs, angle: { from: -8, to: 8 }, duration: 600, yoyo: true, repeat: -1 });
  }

  async loadQuestions() {
    try {
      const res = await fetch(`/api/questions/random?topic=${this.topic}&count=15`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      if (!res.ok) throw new Error('Error API');
      const data = await res.json();
      this.questions = data;
      Phaser.Utils.Array.Shuffle(this.questions);
    } catch (e) {
      // Si falla la carga, usar preguntas de emergencia para no bloquear el juego
      console.warn('Preguntas no disponibles, usando emergencia');
      this.questions = [{
        text: '¿Cuál tipo de dato almacena true o false?',
        option_a: 'int', option_b: 'String', option_c: 'boolean',
        correct_option: 'c', explanation: 'boolean almacena valores verdadero/falso.',
        topic: this.topic
      }];
    }
  }

  triggerQuestion() {
    if (this.isOver || this.questions.length === 0) return;
    this.questionActive = true;
    this.obstacleTimer.paused = true;

    const q = this.questions[this.questionIndex % this.questions.length];
    this.questionIndex++;

    // Pausar escena y lanzar QuestionScene encima
    this.scene.pause();
    this.scene.launch('QuestionScene', { question: q, score: this.score });
  }

  onQuestionCorrect() {
    this.questionActive = false;
    this.obstacleTimer.paused = false;
    this.bonusPoints += 100;

    // Efecto visual de acierto
    this.player.playCorrectEffect();
    this.showFloatingText('+100', '#FFD166', this.player.sprite.x + 60, this.player.sprite.y - 30);

    // Partículas
    this.emitStars(this.player.sprite.x, this.player.sprite.y);
  }

  onQuestionWrong(data) {
    this.isOver = true;
    this.obstacleTimer.paused = true;
    this.questionTimer.paused = true;

    this.player.playHitEffect(() => {
      this.scene.start('GameOverScene', {
        score: this.score,
        distance: Math.floor(this.distance),
        topic: this.topic,
        topicName: this.topicName,
        token: this.token,
        user: this.userData,
        wrongAnswer: data
      });
    });
  }

  onHit(playerSprite, obsSprite) {
    if (this.isOver || this.questionActive) return;
    this.isOver = true;
    obsSprite.destroy();
    this.obstacleTimer.paused = true;
    this.questionTimer.paused = true;

    this.player.playHitEffect(() => {
      this.scene.start('GameOverScene', {
        score: this.score,
        distance: Math.floor(this.distance),
        topic: this.topic,
        topicName: this.topicName,
        token: this.token,
        user: this.userData,
        reason: 'obstacle'
      });
    });
  }

  showFloatingText(txt, color, x, y) {
    const t = this.add.text(x, y, txt, {
      fontSize: '28px', fontFamily: 'Segoe UI, Arial', fontStyle: 'bold', fill: color,
      stroke: '#000', strokeThickness: 3
    }).setDepth(30).setOrigin(0.5);
    this.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 900, ease: 'Power2', onComplete: () => t.destroy() });
  }

  emitStars(x, y) {
    for (let i = 0; i < 8; i++) {
      const star = this.add.sprite(x, y, 'star').setDepth(30).setScale(0.6);
      const angle = Phaser.Math.RND.realInRange(0, Math.PI * 2);
      const dist  = Phaser.Math.RND.between(40, 100);
      this.tweens.add({
        targets: star,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0, scale: 0,
        duration: 600,
        ease: 'Power2',
        onComplete: () => star.destroy()
      });
    }
  }

  shutdown() {
    this.game.events.off('questionCorrect', this.onQuestionCorrect, this);
    this.game.events.off('questionWrong',   this.onQuestionWrong,   this);
  }
}
