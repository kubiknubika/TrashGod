class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene', active: true });
    }

    preload() {
        // Здесь будут загружаться ассеты для UI
    }

    create() {
        // Инициализируем ресурсы
        this.money = 0;
        this.trash = 0;

        // Отображаем UI
        this.moneyText = this.add.text(10, 10, 'Деньги: 0', { fontSize: '24px', fill: '#fff' });
        this.trashText = this.add.text(10, 40, 'Мусор: 0', { fontSize: '24px', fill: '#fff' });

        // Создаем кнопку "Продать/Переработать"
        const sellButton = this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height - 50, 250, 50, 0x228B22)
            .setInteractive();
        
        this.add.text(sellButton.x, sellButton.y, 'Продать/Переработать', { fontSize: '20px', fill: '#fff' })
            .setOrigin(0.5);

        // Добавляем логику продажи
        sellButton.on('pointerdown', () => {
            if (this.trash > 0) {
                this.money += this.trash;
                this.trash = 0;
                this.moneyText.setText('Деньги: ' + this.money);
                this.trashText.setText('Мусор: ' + this.trash);
            }
        });

        // Слушаем событие сбора мусора из GameScene
        const gameScene = this.scene.get('GameScene');
        gameScene.game.events.on('collectTrash', (amount) => {
            this.trash += amount;
            this.trashText.setText('Мусор: ' + this.trash);
        });

        // --- Магазин ---
        const shopX = this.cameras.main.width - 150;

        // Улучшение клика
        const clickUpgradeButton = this.add.rectangle(shopX, 50, 250, 50, 0x0000FF)
            .setInteractive();
        this.add.text(clickUpgradeButton.x, clickUpgradeButton.y, 'Укрепленные перчатки (10)', { fontSize: '16px', fill: '#fff' })
            .setOrigin(0.5);

        clickUpgradeButton.on('pointerdown', () => {
            if (this.money >= 10) {
                this.money -= 10;
                this.moneyText.setText('Деньги: ' + this.money);
                this.game.events.emit('upgradeClick');
            }
        });

        // --- Пассивный доход ---
        this.trashPerSecond = 0;
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.trashPerSecond > 0) {
                    this.trash += this.trashPerSecond;
                    this.trashText.setText('Мусор: ' + this.trash);
                }
            },
            loop: true
        });

        // Улучшение "Школьник-волонтер"
        const volunteerUpgradeButton = this.add.rectangle(shopX, 110, 250, 50, 0x0000FF)
            .setInteractive();
        this.add.text(volunteerUpgradeButton.x, volunteerUpgradeButton.y, 'Школьник-волонтер (25)', { fontSize: '16px', fill: '#fff' })
            .setOrigin(0.5);

        volunteerUpgradeButton.on('pointerdown', () => {
            if (this.money >= 25) {
                this.money -= 25;
                this.trashPerSecond += 1;
                this.moneyText.setText('Деньги: ' + this.money);
            }
        });

        // Улучшение "Мусорный бак"
        const trashCanUpgradeButton = this.add.rectangle(shopX, 170, 250, 50, 0x0000FF)
            .setInteractive();
        this.add.text(trashCanUpgradeButton.x, trashCanUpgradeButton.y, 'Мусорный бак (100)', { fontSize: '16px', fill: '#fff' })
            .setOrigin(0.5);
        
        trashCanUpgradeButton.on('pointerdown', () => {
            if (this.money >= 100) {
                this.money -= 100;
                this.trashPerSecond += 5;
                this.moneyText.setText('Деньги: ' + this.money);
            }
        });

        // Улучшение "Конвейер"
        const conveyorUpgradeButton = this.add.rectangle(shopX, 230, 250, 50, 0x0000FF)
            .setInteractive();
        this.add.text(conveyorUpgradeButton.x, conveyorUpgradeButton.y, 'Конвейер (500)', { fontSize: '16px', fill: '#fff' })
            .setOrigin(0.5);

        conveyorUpgradeButton.on('pointerdown', () => {
            if (this.money >= 500) {
                this.money -= 500;
                this.moneyText.setText('Деньги: ' + this.money);
                
                // Создаем таймер для авто-продажи
                this.time.addEvent({
                    delay: 2000, // Продавать каждые 2 секунды
                    callback: () => {
                        if (this.trash > 0) {
                            this.money += this.trash;
                            this.trash = 0;
                            this.moneyText.setText('Деньги: ' + this.money);
                            this.trashText.setText('Мусор: ' + this.trash);
                        }
                    },
                    loop: true
                });

                // Отключаем кнопку после покупки
                conveyorUpgradeButton.disableInteractive();
                conveyorUpgradeButton.fillColor = 0x888888;
            }
        });
    }

    update() {
        // Здесь будет обновляться UI
    }
}
