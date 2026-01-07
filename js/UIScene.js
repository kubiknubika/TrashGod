class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene', active: true });
    }

    preload() {
        // Здесь будут загружаться ассеты для UI
    }

    create() {
        this.loadProgress(); // Загружаем прогресс

        // --- Инициализация игровых данных ---
        if (!this.gameData) {
            this.gameData = {
                money: 0,
                trash: 0,
                trashPerClick: 1,
                trashPerSecond: 0,
                upgrades: {
                    click: { level: 1, cost: 10, baseCost: 10 },
                    volunteer: { level: 0, cost: 25, baseCost: 25 },
                    trashCan: { level: 0, cost: 100, baseCost: 100 },
                    conveyor: { level: 0, cost: 500, baseCost: 500 }
                }
            };
        }
        // --- UI ---
        this.moneyText = this.add.text(10, 10, `Деньги: ${this.gameData.money}`, { fontSize: '24px', fill: '#fff' });
        this.trashText = this.add.text(10, 40, `Мусор: ${this.gameData.trash}`, { fontSize: '24px', fill: '#fff' });

        const sellButton = this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height - 50, 250, 50, 0x228B22)
            .setInteractive();
        this.add.text(sellButton.x, sellButton.y, 'Продать/Переработать', { fontSize: '20px', fill: '#fff' }).setOrigin(0.5);

        sellButton.on('pointerdown', () => {
            if (this.gameData.trash > 0) {
                this.gameData.money += this.gameData.trash;
                this.gameData.trash = 0;
                this.updateUIText();
                this.updateButtonsState();
            }
        });

        // --- Магазин ---
        const shopX = this.cameras.main.width - 150;
        
        // Кнопка улучшения клика
        const clickUpgrade = this.gameData.upgrades.click;
        this.clickUpgradeButton = this.add.rectangle(shopX, 50, 250, 50, 0x0000FF).setInteractive();
        this.clickUpgradeText = this.add.text(shopX, 50, `Укр. перчатки (${clickUpgrade.cost})`, { fontSize: '16px', fill: '#fff' }).setOrigin(0.5);
        this.clickUpgradeButton.on('pointerdown', () => this.buyUpgrade('click'));

        // Кнопка волонтера
        const volunteerUpgrade = this.gameData.upgrades.volunteer;
        this.volunteerUpgradeButton = this.add.rectangle(shopX, 110, 250, 50, 0x0000FF).setInteractive();
        this.volunteerUpgradeText = this.add.text(shopX, 110, `Волонтер (${volunteerUpgrade.cost})`, { fontSize: '16px', fill: '#fff' }).setOrigin(0.5);
        this.volunteerUpgradeButton.on('pointerdown', () => this.buyUpgrade('volunteer'));

        // Кнопка мусорного бака
        const trashCanUpgrade = this.gameData.upgrades.trashCan;
        this.trashCanUpgradeButton = this.add.rectangle(shopX, 170, 250, 50, 0x0000FF).setInteractive();
        this.trashCanUpgradeText = this.add.text(shopX, 170, `Мусорный бак (${trashCanUpgrade.cost})`, { fontSize: '16px', fill: '#fff' }).setOrigin(0.5);
        this.trashCanUpgradeButton.on('pointerdown', () => this.buyUpgrade('trashCan'));

        // Кнопка конвейера
        const conveyorUpgrade = this.gameData.upgrades.conveyor;
        this.conveyorUpgradeButton = this.add.rectangle(shopX, 230, 250, 50, 0x0000FF).setInteractive();
        this.conveyorUpgradeText = this.add.text(shopX, 230, `Конвейер (${conveyorUpgrade.cost})`, { fontSize: '16px', fill: '#fff' }).setOrigin(0.5);
        this.conveyorUpgradeButton.on('pointerdown', () => this.buyUpgrade('conveyor'));

        // --- Обработчики событий ---
        this.game.events.on('collectTrash', (amount) => {
            this.gameData.trash += amount;
            this.updateUIText();
        }, this);
        

        // --- Пассивный доход ---
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.gameData.trashPerSecond > 0) {
                    this.gameData.trash += this.gameData.trashPerSecond;
                    this.updateUIText();
                }
            },
            loop: true
        });

        // --- Система сохранений ---
        this.time.addEvent({
            delay: 10000,
            callback: this.saveProgress,
            callbackScope: this,
            loop: true
        });

        // Кнопка сброса
        const resetButton = this.add.rectangle(80, this.cameras.main.height - 40, 100, 40, 0xFF0000)
            .setInteractive();
        this.add.text(resetButton.x, resetButton.y, 'RESET', { fontSize: '20px', fill: '#fff' }).setOrigin(0.5);
        
        resetButton.on('pointerdown', () => {
            localStorage.removeItem('trashGodSave');
            this.scene.get('GameScene').scene.restart();
            this.scene.restart();
        });
    }

    buyUpgrade(key) {
        const upgrade = this.gameData.upgrades[key];
        if (this.gameData.money >= upgrade.cost) {
            this.gameData.money -= upgrade.cost;
            upgrade.level++;
            upgrade.cost = Math.round(upgrade.cost * 1.5);

            // Применяем эффект
            if (key === 'click') {
                this.game.events.emit('upgradeClick');
            } else if (key === 'volunteer') {
                this.gameData.trashPerSecond += 1;
            } else if (key === 'trashCan') {
                this.gameData.trashPerSecond += 5;
            } else if (key === 'conveyor') {
                this.time.addEvent({
                    delay: 2000,
                    callback: () => {
                        if (this.gameData.trash > 0) {
                            this.gameData.money += this.gameData.trash;
                            this.gameData.trash = 0;
                        }
                    },
                    loop: true
                });
            }

            this.updateUIText();
            this.updateUpgradeText();
            this.saveProgress(); // Сохраняем прогресс после покупки
        }
    }

    updateUIText() {
        this.moneyText.setText(`Деньги: ${this.gameData.money}`);
        this.trashText.setText(`Мусор: ${this.gameData.trash}`);
    }

    updateUpgradeText() {
        this.clickUpgradeText.setText(`Укр. перчатки (${this.gameData.upgrades.click.cost})`);
        this.volunteerUpgradeText.setText(`Волонтер (${this.gameData.upgrades.volunteer.cost})`);
        this.trashCanUpgradeText.setText(`Мусорный бак (${this.gameData.upgrades.trashCan.cost})`);
        if (this.gameData.upgrades.conveyor.level === 0) {
            this.conveyorUpgradeText.setText(`Конвейер (${this.gameData.upgrades.conveyor.cost})`);
        } else {
            this.conveyorUpgradeText.setText('Конвейер (Куплено)');
        }
    }

    updateButtonsState() {
        const money = this.gameData.money;

        // Кнопка улучшения клика
        const clickUpgrade = this.gameData.upgrades.click;
        if (money >= clickUpgrade.cost) {
            this.clickUpgradeButton.clearTint().setInteractive();
        } else {
            this.clickUpgradeButton.setTint(0x808080).disableInteractive();
        }

        // Кнопка волонтера
        const volunteerUpgrade = this.gameData.upgrades.volunteer;
        if (money >= volunteerUpgrade.cost) {
            this.volunteerUpgradeButton.clearTint().setInteractive();
        } else {
            this.volunteerUpgradeButton.setTint(0x808080).disableInteractive();
        }

        // Кнопка мусорного бака
        const trashCanUpgrade = this.gameData.upgrades.trashCan;
        if (money >= trashCanUpgrade.cost) {
            this.trashCanUpgradeButton.clearTint().setInteractive();
        } else {
            this.trashCanUpgradeButton.setTint(0x808080).disableInteractive();
        }

        // Кнопка конвейера
        const conveyorUpgrade = this.gameData.upgrades.conveyor;
        if (money >= conveyorUpgrade.cost && conveyorUpgrade.level === 0) {
            this.conveyorUpgradeButton.clearTint().setInteractive();
        } else {
            this.conveyorUpgradeButton.setTint(0x808080).disableInteractive();
        }
    }

    saveProgress() {
        localStorage.setItem('trashGodSave', JSON.stringify(this.gameData));
    }

    loadProgress() {
        const savedData = localStorage.getItem('trashGodSave');
        if (savedData) {
            this.gameData = JSON.parse(savedData);
            
            // Восстанавливаем состояние после загрузки
            this.game.events.emit('upgradeClick', this.gameData.upgrades.click.level);
            this.updateUIText();
            this.updateUpgradeText();

            // Восстанавливаем конвейер, если он был куплен
            if (this.gameData.upgrades.conveyor.level > 0) {
                this.time.addEvent({
                    delay: 2000,
                    callback: () => {
                        if (this.gameData.trash > 0) {
                            this.gameData.money += this.gameData.trash;
                            this.gameData.trash = 0;
                            this.updateUIText();
                        }
                    },
                    loop: true
                });
            }
        }
    }

    update() {
        this.updateButtonsState();
    }
}
