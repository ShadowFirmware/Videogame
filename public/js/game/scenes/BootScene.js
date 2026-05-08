class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    this.generateTextures();
    this.scene.start('MenuScene');
  }

  generateTextures() {
    let g;

    // Jugador (corredor)
    g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x4F9EFF); // cuerpo
    g.fillRoundedRect(8, 20, 44, 50, 6);
    g.fillStyle(0xFFD166); // cabeza
    g.fillCircle(30, 14, 14);
    g.fillStyle(0xFFFFFF); // ojos
    g.fillCircle(24, 11, 3);
    g.fillCircle(36, 11, 3);
    g.fillStyle(0x1E293B);
    g.fillCircle(25, 11, 1.5);
    g.fillCircle(37, 11, 1.5);
    g.fillStyle(0x3B82F6); // piernas
    g.fillRect(10, 68, 16, 24);
    g.fillRect(34, 68, 16, 24);
    g.generateTexture('player', 60, 96);
    g.destroy();

    // Obstáculo (bug/error)
    g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xFF4444);
    g.fillRoundedRect(0, 0, 56, 56, 8);
    g.lineStyle(3, 0xFF0000);
    g.strokeRoundedRect(2, 2, 52, 52, 6);
    g.fillStyle(0xFFFFFF);
    g.setAlpha(0.9);
    // X symbol
    g.lineStyle(5, 0xFFFFFF);
    g.beginPath(); g.moveTo(14, 14); g.lineTo(42, 42); g.strokePath();
    g.beginPath(); g.moveTo(42, 14); g.lineTo(14, 42); g.strokePath();
    g.generateTexture('obstacle', 56, 56);
    g.destroy();

    // Obstáculo tipo 2 (advertencia)
    g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xFF9900);
    g.fillTriangle(30, 2, 2, 58, 58, 58);
    g.lineStyle(3, 0xFFCC00);
    g.strokeTriangle(30, 2, 2, 58, 58, 58);
    g.fillStyle(0xFFFFFF);
    g.fillRect(27, 18, 6, 22);
    g.fillRect(27, 44, 6, 6);
    g.generateTexture('obstacle2', 60, 60);
    g.destroy();

    // Partícula de corrección (estrella 5 puntas con fillPoints)
    g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xFFD700);
    const starPts = [];
    for (let i = 0; i < 10; i++) {
      const ang = (i * Math.PI) / 5 - Math.PI / 2;
      const r = i % 2 === 0 ? 14 : 6;
      starPts.push(new Phaser.Math.Vector2(16 + r * Math.cos(ang), 16 + r * Math.sin(ang)));
    }
    g.fillPoints(starPts, true);
    g.generateTexture('star', 32, 32);
    g.destroy();

    // Partícula de fallo
    g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xFF4444);
    g.fillCircle(8, 8, 8);
    g.generateTexture('particle', 16, 16);
    g.destroy();

    // Fondo del camino (tile)
    g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x1A1A2E);
    g.fillRect(0, 0, 64, 64);
    // líneas de decoración
    g.lineStyle(1, 0x2A2A4E);
    g.beginPath(); g.moveTo(0, 32); g.lineTo(64, 32); g.strokePath();
    g.generateTexture('bg-tile', 64, 64);
    g.destroy();

    // Suelo de carretera
    g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x2D2D44);
    g.fillRect(0, 0, 1280, 10);
    g.generateTexture('road-mark', 1280, 10);
    g.destroy();
  }
}
