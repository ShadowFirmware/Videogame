class Player {
  constructor(scene, x, laneY) {
    this.scene = scene;
    this.lanes = laneY;         // array [y0, y1, y2]
    this.currentLane = 1;       // empieza en el centro
    this.isMoving = false;

    this.sprite = scene.physics.add.sprite(x, this.lanes[1], 'player');
    this.sprite.setDepth(10);
    this.sprite.body.setSize(44, 70);
    this.sprite.body.setOffset(8, 20);

    // Animación de carrera (bobbing)
    scene.tweens.add({
      targets: this.sprite,
      scaleY: { from: 1, to: 0.95 },
      duration: 250,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  switchLane(dir) {
    if (this.isMoving) return;
    let next = this.currentLane + (dir === 'up' ? -1 : 1);
    next = Phaser.Math.Clamp(next, 0, 2);
    if (next === this.currentLane) return;

    this.isMoving = true;
    this.currentLane = next;

    this.scene.tweens.add({
      targets: this.sprite,
      y: this.lanes[next],
      duration: 140,       // < 200ms (RF01)
      ease: 'Power2.easeOut',
      onComplete: () => { this.isMoving = false; }
    });
  }

  playCorrectEffect() {
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.2, scaleY: 1.2,
      duration: 100,
      yoyo: true,
      tint: 0x00FF88
    });
    this.sprite.setTint(0x00FF88);
    this.scene.time.delayedCall(300, () => this.sprite.clearTint());
  }

  playHitEffect(onComplete) {
    this.sprite.setTint(0xFF0000);
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      scaleX: 1.5, scaleY: 1.5,
      duration: 400,
      ease: 'Power2',
      onComplete
    });
  }

  destroy() { this.sprite.destroy(); }
}
