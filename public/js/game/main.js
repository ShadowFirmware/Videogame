// Verificar sesión antes de cargar el juego
(function checkAuth() {
  const token = localStorage.getItem('token');
  const user  = JSON.parse(localStorage.getItem('user') || 'null');
  if (!token || !user) {
    window.location.href = '/';
    return;
  }
  window.GAME_TOKEN = token;
  window.GAME_USER  = user;
  window.GAME_TOPIC = sessionStorage.getItem('selectedTopic') || 'variables_tipos';
  window.GAME_TOPIC_NAME = sessionStorage.getItem('selectedTopicName') || 'Variables y Tipos';
})();

const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game-container',
  backgroundColor: '#0f0f23',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: { width: 320, height: 180 },
    max: { width: 1280, height: 720 }
  },
  scene: [BootScene, MenuScene, GameScene, QuestionScene, GameOverScene, ResultScene]
};

window.game = new Phaser.Game(config);
