class ResultScene extends Phaser.Scene {
  constructor() { super('ResultScene'); }

  init(data) {
    this.score      = data.score      || 0;
    this.distance   = data.distance   || 0;
    this.topic      = data.topic      || '';
    this.topicName  = data.topicName  || '';
    this.correct    = data.correct    || 0;
    this.total      = data.total      || 0;
    this.token      = data.token      || window.GAME_TOKEN;
    this.userData   = data.user       || window.GAME_USER;
    this.isNewRecord = data.isNewRecord || false;
  }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.cameras.main.fadeIn(500);

    const bg = this.add.graphics();
    bg.fillStyle(0x0F0F23);
    bg.fillRect(0, 0, W, H);
    bg.fillStyle(0xF59E0B, 0.08);
    bg.fillRect(0, 0, W, H);

    const panelW = Math.min(W * 0.7, 580), panelH = 440;
    this.add.rectangle(W / 2, H / 2, panelW, panelH, 0x1E293B).setStrokeStyle(3, 0xF59E0B);

    this.add.text(W / 2, H * 0.17, '🏆', { fontSize: '56px' }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.27, '¡FELICIDADES!', {
      fontSize: '42px', fontFamily: 'Segoe UI, Arial', fontStyle: 'bold',
      fill: '#FFD166', stroke: '#8B5E00', strokeThickness: 4
    }).setOrigin(0.5);

    if (this.isNewRecord) {
      this.add.text(W / 2, H * 0.36, '⭐ ¡Nuevo Récord Personal! ⭐', {
        fontSize: '18px', fontFamily: 'Segoe UI, Arial', fill: '#FFD700'
      }).setOrigin(0.5);
    }

    const scoreY = this.isNewRecord ? H * 0.44 : H * 0.4;
    this.add.text(W / 2, scoreY, `Puntaje Final: ${this.score}`, {
      fontSize: '28px', fontFamily: 'Segoe UI, Arial', fontStyle: 'bold', fill: '#FFD166'
    }).setOrigin(0.5);

    this.add.text(W / 2, scoreY + 45, `Distancia: ${this.distance}m   |   Tema: ${this.topicName}`, {
      fontSize: '16px', fontFamily: 'Segoe UI, Arial', fill: '#94A3B8'
    }).setOrigin(0.5);

    if (this.total > 0) {
      const pct = Math.round((this.correct / this.total) * 100);
      this.add.text(W / 2, scoreY + 80, `Preguntas correctas: ${this.correct}/${this.total} (${pct}%)`, {
        fontSize: '16px', fontFamily: 'Segoe UI, Arial', fill: '#4ADE80'
      }).setOrigin(0.5);
    }

    // Botón jugar de nuevo
    const btn = this.add.rectangle(W / 2, H * 0.78, 220, 55, 0x16A34A).setInteractive({ useHandCursor: true });
    this.add.text(W / 2, H * 0.78, '▶  Jugar de nuevo', {
      fontSize: '20px', fontFamily: 'Segoe UI, Arial', fontStyle: 'bold', fill: '#FFFFFF'
    }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(0x15803D));
    btn.on('pointerout',  () => btn.setFillStyle(0x16A34A));
    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MenuScene'));
    });

    const homeBtn = this.add.text(W / 2, H * 0.89, '← Ir al inicio', {
      fontSize: '15px', fontFamily: 'Segoe UI, Arial', fill: '#64748B'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    homeBtn.on('pointerdown', () => { window.location.href = '/'; });

    this.input.keyboard.on('keydown-ENTER', () => this.scene.start('MenuScene'));

    this.saveScore();
  }

  async saveScore() {
    try {
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}` },
        body: JSON.stringify({
          score: this.score,
          distance: this.distance,
          correct_answers: this.correct,
          total_questions: this.total,
          topic: this.topic
        })
      });
    } catch (e) {
      console.warn('No se pudo guardar el puntaje:', e);
    }
  }
}
