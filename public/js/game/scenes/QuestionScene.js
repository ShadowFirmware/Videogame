class QuestionScene extends Phaser.Scene {
  constructor() { super('QuestionScene'); }

  init(data) {
    this.question = data.question;
    this.score    = data.score || 0;
    this.answered = false;
  }

  create() {
    const W = this.scale.width, H = this.scale.height;

    // Overlay oscuro sobre el juego
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75);

    // Panel de pregunta
    const panelW = Math.min(W * 0.82, 900);
    const panelH = 420;
    const panelX = W / 2;
    const panelY = H / 2;

    const panel = this.add.rectangle(panelX, panelY, panelW, panelH, 0x1E293B, 1)
      .setStrokeStyle(3, 0x4F9EFF);

    // Encabezado
    this.add.rectangle(panelX, panelY - panelH / 2 + 30, panelW, 60, 0x2563EB, 1).setOrigin(0.5, 0.5);
    this.add.text(panelX, panelY - panelH / 2 + 30, '❓ Pregunta', {
      fontSize: '22px', fontFamily: 'Segoe UI, Arial', fontStyle: 'bold', fill: '#FFFFFF'
    }).setOrigin(0.5);

    // Texto de la pregunta
    const qText = this.question.text;
    this.add.text(panelX, panelY - 80, qText, {
      fontSize: '20px', fontFamily: 'Segoe UI, Arial', fill: '#E2E8F0',
      wordWrap: { width: panelW - 60 }, align: 'center'
    }).setOrigin(0.5);

    // Botones de respuesta
    const options = [
      { key: 'a', label: this.question.option_a, icon: '🅐' },
      { key: 'b', label: this.question.option_b, icon: '🅑' },
      { key: 'c', label: this.question.option_c, icon: '🅒' }
    ];

    const btnW = panelW * 0.28;
    const btnH = 72;
    const startX = panelX - (btnW + 16);
    const btnY = panelY + 100;
    const btnColors = [0x3B82F6, 0x8B5CF6, 0xF59E0B];

    this.answerBtns = [];

    options.forEach((opt, i) => {
      const bx = startX + i * (btnW + 16);

      const btnRect = this.add.rectangle(bx, btnY, btnW, btnH, btnColors[i], 1)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(2, 0xFFFFFF, 0.3);

      // Letra de la opción (accesibilidad: letra grande + texto)
      this.add.text(bx - btnW / 2 + 20, btnY, ['A', 'B', 'C'][i], {
        fontSize: '22px', fontFamily: 'Segoe UI, Arial', fontStyle: 'bold', fill: '#FFFFFF'
      }).setOrigin(0, 0.5);

      const optText = this.add.text(bx + 10, btnY, opt.label, {
        fontSize: '16px', fontFamily: 'Segoe UI, Arial', fill: '#FFFFFF',
        wordWrap: { width: btnW - 45 }, align: 'center'
      }).setOrigin(0.5);

      btnRect.on('pointerover', () => {
        if (this.answered) return;
        this.tweens.add({ targets: [btnRect, optText], scaleX: 1.04, scaleY: 1.04, duration: 80 });
      });
      btnRect.on('pointerout', () => {
        if (this.answered) return;
        this.tweens.add({ targets: [btnRect, optText], scaleX: 1, scaleY: 1, duration: 80 });
      });
      btnRect.on('pointerdown', () => this.answer(opt.key, btnRect, options));

      // Tecla de teclado (A, B, C)
      const keyCode = [Phaser.Input.Keyboard.KeyCodes.A, Phaser.Input.Keyboard.KeyCodes.B, Phaser.Input.Keyboard.KeyCodes.C][i];
      this.input.keyboard.once('keydown-' + ['A','B','C'][i], () => this.answer(opt.key, btnRect, options));

      this.answerBtns.push({ rect: btnRect, key: opt.key, text: optText });
    });

    // Tip de teclas
    this.add.text(panelX, panelY + panelH / 2 - 20, 'Teclas: A · B · C', {
      fontSize: '13px', fontFamily: 'Segoe UI, Arial', fill: '#64748B'
    }).setOrigin(0.5);

    // Personaje en la esquina
    const char = this.add.sprite(W * 0.92, H * 0.5, 'player').setScale(1.4).setAlpha(0.8);
    this.tweens.add({ targets: char, y: H * 0.5 - 10, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Animación de entrada
    const allItems = [panel, overlay];
    this.add.tween({ targets: panel, scaleX: { from: 0.8, to: 1 }, scaleY: { from: 0.8, to: 1 }, alpha: { from: 0, to: 1 }, duration: 200, ease: 'Back.easeOut' });
  }

  answer(selected, btnRect, options) {
    if (this.answered) return;
    this.answered = true;

    // Desactivar todos los botones
    this.answerBtns.forEach(b => b.rect.disableInteractive());
    this.input.keyboard.removeAllListeners();

    const correct = this.question.correct_option;
    const isCorrect = selected === correct;

    // Colorear respuestas (verde=correcto, rojo=incorrecto, accesibilidad: texto también)
    this.answerBtns.forEach(b => {
      if (b.key === correct) {
        b.rect.setFillStyle(0x16A34A);
        b.text.setText('✔ ' + b.text.text);
      } else if (b.key === selected && !isCorrect) {
        b.rect.setFillStyle(0xDC2626);
        b.text.setText('✘ ' + b.text.text);
      } else {
        b.rect.setAlpha(0.4);
      }
    });

    if (isCorrect) {
      this.showFeedback(true);
      this.time.delayedCall(1000, () => {
        this.scene.stop();
        this.scene.resume('GameScene');
        this.game.events.emit('questionCorrect');
      });
    } else {
      this.showFeedback(false);
      this.time.delayedCall(2200, () => {
        this.scene.stop();
        this.scene.resume('GameScene');
        this.game.events.emit('questionWrong', {
          correctOption: correct,
          correctText: { a: this.question.option_a, b: this.question.option_b, c: this.question.option_c }[correct],
          explanation: this.question.explanation
        });
      });
    }
  }

  showFeedback(correct) {
    const W = this.scale.width, H = this.scale.height;
    const color = correct ? 0x16A34A : 0xDC2626;
    const text  = correct ? '¡Correcto! +100 puntos' : '¡Incorrecto!';
    const icon  = correct ? '✅' : '❌';

    const fb = this.add.text(W / 2, H * 0.18, `${icon}  ${text}`, {
      fontSize: '26px', fontFamily: 'Segoe UI, Arial', fontStyle: 'bold',
      fill: correct ? '#4ADE80' : '#F87171',
      backgroundColor: correct ? '#14532D' : '#7F1D1D',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: fb, alpha: 1, y: H * 0.16, duration: 300 });

    if (!correct && this.question.explanation) {
      this.add.text(W / 2, H * 0.26, '💡 ' + this.question.explanation, {
        fontSize: '16px', fontFamily: 'Segoe UI, Arial', fill: '#94A3B8',
        wordWrap: { width: W * 0.7 }, align: 'center'
      }).setOrigin(0.5).setAlpha(0).setDepth(50);
      this.tweens.add({ targets: this.children.list[this.children.list.length - 1], alpha: 1, duration: 400, delay: 200 });
    }
  }
}
