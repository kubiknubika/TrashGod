class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Загружаем изображения для игровой сцены
        this.load.image('bg_img', 'assets/background.png');
        this.load.image('trash_img', 'assets/trash_pile.png');
        this.load.image('truck_img', 'assets/truck.png');
    }

    create() {
        // --- 1. Фон ---
        if (this.textures.exists('bg_img')) {
            this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'bg_img');
        }

        // --- 2. Куча мусора ---
        this.trashPerClick = 1;

        // Создаем "Кучу мусора" (спрайт или фигуру)
        if (this.textures.exists('trash_img')) {
            this.trashPile = this.add.sprite(this.cameras.main.width / 4, this.cameras.main.centerY, 'trash_img');
        } else {
            this.trashPile = this.add.circle(this.cameras.main.width / 4, this.cameras.main.centerY, 100, 0x8B4513);
        }

        this.trashPile.setInteractive();

        // --- 3. Обработчики событий ---
        this.trashPile.on('pointerdown', () => {
            // Отправляем события в UIScene
            this.game.events.emit('collectTrash', this.trashPerClick);
            this.game.events.emit('playSound', 'sfx_click'); // Событие для звука

            // Исправленная анимация
            if (this.trashPile.clickTween) {
                this.trashPile.clickTween.stop();
            }
            this.trashPile.setScale(1);

            this.trashPile.clickTween = this.tweens.add({
                targets: this.trashPile,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 100,
                yoyo: true,
                ease: 'Power1'
            });
        });

        // Слушаем событие улучшения клика из UIScene
        this.game.events.on('upgradeClick', () => {
            this.trashPerClick++;
        }, this);

        // Слушаем событие отправки грузовика из UIScene
        this.game.events.on('dispatchTruck', this.dispatchTruck, this);
    }

    dispatchTruck(trashAmount) {
        let truck;
        // Создаем грузовик (спрайт или фигуру)
        if (this.textures.exists('truck_img')) {
            truck = this.add.sprite(-100, this.cameras.main.centerY, 'truck_img');
        } else {
            truck = this.add.rectangle(-100, this.cameras.main.centerY, 100, 50, 0xff0000);
        }

        // Анимируем движение
        this.tweens.add({
            targets: truck,
            x: this.cameras.main.width + 100,
            duration: 2000,
            ease: 'Linear',
            onComplete: () => {
                this.game.events.emit('addMoney', trashAmount); // Отправляем деньги в UIScene
                truck.destroy();
            }
        });
    }

    update() {
        // Здесь будет обновляться игра каждый кадр
    }
}
