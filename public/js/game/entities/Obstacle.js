class Obstacle {
  constructor(scene, x, y, speed) {
    const key = Phaser.Math.RND.pick(['obstacle', 'obstacle2']);
    this.sprite = scene.physics.add.sprite(x, y, key);
    this.sprite.setDepth(8);
    this.sprite.body.setVelocityX(-speed);
    this.sprite.body.setSize(44, 44);
    this.sprite.body.setOffset(6, 6);

    // Rotación suave
    scene.tweens.add({
      targets: this.sprite,
      angle: { from: -8, to: 8 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Eliminar cuando sale de pantalla
    this.sprite.checkWorldBounds = true;
    this.sprite.outOfBoundsKill = true;
  }
}
