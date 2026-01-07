class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Здесь будут загружаться ассеты
    }

    create() {
        this.trashPerClick = 1;

        // Создаем "Кучу мусора" в центре экрана
        let trashPile = this.add.circle(this.cameras.main.width / 4, this.cameras.main.centerY, 100, 0x8B4513);

        // Делаем ее интерактивной
        trashPile.setInteractive();

        // Добавляем обработчик клика
        trashPile.on('pointerdown', () => {
            // Отправляем событие в UIScene
            this.game.events.emit('collectTrash', this.trashPerClick);

            // Анимация пружины
            this.tweens.add({
                targets: trashPile,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 100,
                yoyo: true,
                ease: 'Power1'
            });
        });

        // Слушаем событие улучшения клика
        this.game.events.on('upgradeClick', () => {
            this.trashPerClick++;
        }, this);
    }

    update() {
        // Здесь будет обновляться игра каждый кадр
    }
}
