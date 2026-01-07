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
        const { width, height } = this.scale;

        // --- 1. Фон ---
        if (this.textures.exists('bg_img')) {
            this.add.image(width / 2, height / 2, 'bg_img').setDisplaySize(width, height);
        }

        // --- 2. Куча мусора ---
        this.trashPerClick = 1;

        const trashPileSize = Math.min(width, height) * 0.35;

        // Создаем "Кучу мусора" (спрайт или фигуру)
        if (this.textures.exists('trash_img')) {
            this.trashPile = this.add.sprite(width * 0.25, height * 0.5, 'trash_img');
            this.trashPile.setDisplaySize(trashPileSize, trashPileSize);
        } else {
            // Для круга радиус - это половина размера
            this.trashPile = this.add.circle(width * 0.25, height * 0.5, trashPileSize / 2, 0x8B4513);
        }

        this.trashPile.setInteractive();

        // --- 3. Генерация текстуры для частиц ---
        this.make.graphics({ fillStyle: { color: 0xffffff } })
            .fillCircle(4, 4, 4)
            .generateTexture('particle', 8, 8);

        // --- 4. Обработчики событий ---
        this.trashPile.on('pointerdown', (pointer) => {
            // 1. Показываем всплывающий текст и частицы
            this.showFloatingText(`+${this.trashPerClick}`, pointer.x, pointer.y);
            this.emitParticles(pointer.x, pointer.y);

            // 2. Проигрываем звук
            this.game.events.emit('playSound', 'sfx_click');

            // 3. Отправляем событие в UIScene для обновления данных
            this.game.events.emit('collectTrash', this.trashPerClick);

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

    emitParticles(x, y) {
        const particles = this.add.particles('particle');
        const emitter = particles.createEmitter({
            speed: 100,
            scale: { start: 1, end: 0 },
            lifespan: 500,
            blendMode: 'ADD'
        });
        emitter.explode(10, x, y);
    }

    showFloatingText(text, x, y) {
        const style = {
            fontFamily: '"Fredoka One", cursive',
            fontSize: '32px',
            fill: '#ADFF2F', // Ярко-зеленый
            stroke: '#000',
            strokeThickness: 6,
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 3, fill: true }
        };
        const floatingText = this.add.text(x, y, text, style).setOrigin(0.5);

        this.tweens.add({
            targets: floatingText,
            y: y - 80,
            alpha: 0,
            duration: 700,
            ease: 'Power1',
            onComplete: () => {
                floatingText.destroy();
            }
        });
    }

    dispatchTruck(trashAmount) {
        const { width, height } = this.scale;
        const truckSize = height * 0.15;
        let truck;

        // Создаем грузовик (спрайт или фигуру)
        if (this.textures.exists('truck_img')) {
            truck = this.add.sprite(-truckSize, height * 0.5, 'truck_img');
            // Масштабируем пропорционально, сохраняя соотношение сторон
            truck.scale = truckSize / truck.height;
        } else {
            // Прямоугольник делаем в соотношении 2:1
            truck = this.add.rectangle(-truckSize, height * 0.5, truckSize * 2, truckSize, 0xff0000);
        }

        // Анимируем движение
        this.tweens.add({
            targets: truck,
            x: width + truckSize,
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
