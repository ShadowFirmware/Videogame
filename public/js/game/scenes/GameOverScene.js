class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.score     = data.score     || 0;
    this.distance  = data.distance  || 0;
    this.topic     = data.topic     || '';
    this.topicName = data.topicName || '';
    this.token     = data.token     || window.GAME_TOKEN;
    this.userData  = data.user      || window.GAME_USER;
    this.wrongData = data.wrongAnswer || null;
    this.reason    = data.reason    || 'question';
  }

  create() {
    const W = this.scale.width, H = this.scale.height;

    this.cameras.main.fadeIn(400);

    // Fondo
    const bg = this.add.graphics();
    bg.fillStyle(0x0F0F23);
    bg.fillRect(0, 0, W, H);
    bg.fillStyle(0xDC2626, 0.15);
    bg.fillRect(0, 0, W, H);

    // Panel
    const panelW = Math.min(W * 0.7, 600), panelH = 460;
    this.add.rectangle(W / 2, H / 2, panelW, panelH, 0x1E293B).setStrokeStyle(3, 0xDC2626);

    // Título
    this.add.text(W / 2, H * 0.18, '😵', { fontSize: '52px' }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.28, 'PERDISTE', {
      fontSize: '46px', fontFamily: 'Segoe UI, Arial', fontStyle: 'bold',
      fill: '#F87171', stroke: '#7F1D1D', strokeThickness: 4
    }).setOrigin(0.5);

    // Razón del fallo
    const reasonText = this.reason === 'obstacle'
      ? 'Chocaste con un obstáculo'
      : 'Respondiste incorrectamente';
    this.add.text(W / 2, H * 0.38, reasonText, {
      fontSize: '18px', fontFamily: 'Segoe UI, Arial', fill: '#94A3B8'
    }).setOrigin(0.5);

    // Respuesta correcta (si fue por pregunta)
    if (this.wrongData) {
      this.add.text(W / 2, H * 0.46, `✔ Respuesta correcta: "${this.wrongData.correctText}"`, {
        fontSize: '16px', fontFamily: 'Segoe UI, Arial', fill: '#4ADE80',
        wordWrap: { width: panelW - 40 }, align: 'center'
      }).setOrigin(0.5);

      if (this.wrongData.explanation) {
        this.add.text(W / 2, H * 0.54, '💡 ' + this.wrongData.explanation, {
          fontSize: '14px', fontFamily: 'Segoe UI, Arial', fill: '#64748B',
          wordWrap: { width: panelW - 40 }, align: 'center'
        }).setOrigin(0.5);
      }
    }

    // Stats
    const statsY = this.wrongData ? H * 0.65 : H * 0.55;
    this.add.text(W / 2, statsY,
      `Puntaje: ${this.score}  |  Distancia: ${this.distance}m  |  Tema: ${this.topicName}`, {
      fontSize: '16px', fontFamily: 'Segoe UI, Arial', fill: '#CBD5E1'
    }).setOrigin(0.5);

    // Botón Volver a Jugar
    const btn = this.add.rectangle(W / 2, H * 0.8, 220, 55, 0xDC2626, 1).setInteractive({ useHandCursor: true });
    this.add.text(W / 2, H * 0.8, '↺  Volver a jugar', {
      fontSize: '20px', fontFamily: 'Segoe UI, Arial', fontStyle: 'bold', fill: '#FFFFFF'
    }).setOrigin(0.5);

    btn.on('pointerover', () => btn.setFillStyle(0xB91C1C));
    btn.on('pointerout',  () => btn.setFillStyle(0xDC2626));
    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MenuScene'));
    });

    // Botón Ir al menú principal
    const homeBtn = this.add.text(W / 2, H * 0.9, '← Ir al inicio', {
      fontSize: '15px', fontFamily: 'Segoe UI, Arial', fill: '#64748B'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    homeBtn.on('pointerover', () => homeBtn.setStyle({ fill: '#94A3B8' }));
    homeBtn.on('pointerout',  () => homeBtn.setStyle({ fill: '#64748B' }));
    homeBtn.on('pointerdown', () => { window.location.href = '/'; });

    // Guardar puntaje en API
    this.saveScore();

    this.input.keyboard.on('keydown-ENTER', () => this.scene.start('MenuScene'));
    this.input.keyboard.on('keydown-R',     () => this.scene.start('MenuScene'));
  }

  async saveScore() {
    try {
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}` },
        body: JSON.stringify({
          score: this.score,
          distance: this.distance,
          correct_answers: 0,
          total_questions: 0,
          topic: this.topic
        })
      });
    } catch (e) {
      console.warn('No se pudo guardar el puntaje:', e);
    }
  }
}
