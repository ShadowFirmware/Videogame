class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const W = this.scale.width, H = this.scale.height;

    // Fondo animado
    this.bgGraphics = this.add.graphics();
    this.drawBg(W, H);

    // Título
    this.add.text(W / 2, H * 0.22, 'EDUCA', {
      fontSize: '72px', fontFamily: 'Segoe UI, Arial', fontStyle: 'bold',
      fill: '#4F9EFF', stroke: '#1E3A5F', strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(W / 2, H * 0.33, 'RUNNER', {
      fontSize: '72px', fontFamily: 'Segoe UI, Arial', fontStyle: 'bold',
      fill: '#FFD166', stroke: '#8B5E00', strokeThickness: 6
    }).setOrigin(0.5);

    // Tema seleccionado
    const topicName = window.GAME_TOPIC_NAME || 'Variables y Tipos';
    this.add.text(W / 2, H * 0.47, `Tema: ${topicName}`, {
      fontSize: '22px', fontFamily: 'Segoe UI, Arial',
      fill: '#94FADB', backgroundColor: '#1A3A2A', padding: { x: 16, y: 8 }
    }).setOrigin(0.5);

    // Instrucciones
    const isMobile = this.sys.game.device.input.touch;
    const ctrlText = isMobile
      ? 'Desliza ↑↓ para cambiar de carril'
      : '↑ / ↓ para cambiar de carril';

    this.add.text(W / 2, H * 0.57, ctrlText, {
      fontSize: '18px', fontFamily: 'Segoe UI, Arial', fill: '#94A3B8'
    }).setOrigin(0.5);

    this.add.text(W / 2, H * 0.63, 'Responde correctamente para seguir corriendo', {
      fontSize: '16px', fontFamily: 'Segoe UI, Arial', fill: '#64748B'
    }).setOrigin(0.5);

    // Botón JUGAR
    const btnBg = this.add.rectangle(W / 2, H * 0.76, 220, 60, 0x2563EB, 1).setInteractive({ useHandCursor: true });
    const btnText = this.add.text(W / 2, H * 0.76, '▶  JUGAR', {
      fontSize: '26px', fontFamily: 'Segoe UI, Arial', fontStyle: 'bold', fill: '#FFFFFF'
    }).setOrigin(0.5);

    btnBg.on('pointerover', () => { btnBg.setFillStyle(0x1D4ED8); this.tweens.add({ targets: [btnBg, btnText], scaleX: 1.05, scaleY: 1.05, duration: 100 }); });
    btnBg.on('pointerout',  () => { btnBg.setFillStyle(0x2563EB); this.tweens.add({ targets: [btnBg, btnText], scaleX: 1, scaleY: 1, duration: 100 }); });
    btnBg.on('pointerdown', () => this.startGame());

    // Botón volver
    const backBtn = this.add.text(W / 2, H * 0.89, '← Volver al inicio', {
      fontSize: '16px', fontFamily: 'Segoe UI, Arial', fill: '#64748B'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerover', () => backBtn.setStyle({ fill: '#94A3B8' }));
    backBtn.on('pointerout',  () => backBtn.setStyle({ fill: '#64748B' }));
    backBtn.on('pointerdown', () => { window.location.href = '/'; });

    // Icono jugador animado
    const demoPlayer = this.add.sprite(160, H * 0.5, 'player').setScale(1.2);
    this.tweens.add({
      targets: demoPlayer, y: H * 0.5 - 12,
      duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // Teclas
    this.input.keyboard.on('keydown-ENTER', () => this.startGame());
    this.input.keyboard.on('keydown-SPACE', () => this.startGame());
  }

  drawBg(W, H) {
    const g = this.bgGraphics;
    g.fillStyle(0x0F0F23);
    g.fillRect(0, 0, W, H);
    // carriles decorativos
    const laneY = [H * 0.35, H * 0.5, H * 0.65];
    laneY.forEach(y => {
      g.lineStyle(1, 0x2A2A4E, 0.6);
      g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.strokePath();
    });
    // estrellas de fondo
    for (let i = 0; i < 40; i++) {
      const sx = Phaser.Math.RND.between(0, W);
      const sy = Phaser.Math.RND.between(0, H);
      const r  = Phaser.Math.RND.realInRange(0.5, 2);
      g.fillStyle(0xFFFFFF, Phaser.Math.RND.realInRange(0.1, 0.5));
      g.fillCircle(sx, sy, r);
    }
  }

  startGame() {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene', {
        topic: window.GAME_TOPIC,
        topicName: window.GAME_TOPIC_NAME,
        token: window.GAME_TOKEN,
        user: window.GAME_USER
      });
    });
  }
}
