class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene', active: true });
    }

    // init() {
    //     // Можно использовать для получения данных из других сцен
    // }

    preload() {
        // Здесь будут загружаться ассеты для UI
    }

    create() {
        this.isCreated = false;
        // --- 1. Загрузка или инициализация данных ---
        this.loadProgress(); // Пытаемся загрузить

        if (!this.gameData) { // Если загрузка не удалась, создаем дефолтные данные
            this.gameData = {
                money: 0,
                trash: 0,
                trashPerSecond: 0,
                upgrades: {
                    click: { level: 1, cost: 15 },
                    volunteer: { level: 0, cost: 50 },
                    trashCan: { level: 0, cost: 500 },
                    conveyor: { level: 0, cost: 2000 }
                }
            };
        }

        // --- 2. Создание всех UI-элементов ---
        // Текст
        this.moneyText = this.add.text(10, 10, '', { fontSize: '24px', fill: '#fff' });
        this.trashText = this.add.text(10, 40, '', { fontSize: '24px', fill: '#fff' });
        this.profitPerClickText = this.add.text(10, 70, '', { fontSize: '18px', fill: '#fff' });
        this.profitPerSecondText = this.add.text(10, 100, '', { fontSize: '18px', fill: '#fff' });

        // Кнопка продажи
        const sellButton = this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height - 50, 250, 50, 0x228B22).setInteractive();
        this.add.text(sellButton.x, sellButton.y, 'Продать/Переработать', { fontSize: '20px', fill: '#fff' }).setOrigin(0.5);

        // Магазин
        const shopX = this.cameras.main.width - 150;
        this.clickUpgradeButton = this.add.rectangle(shopX, 50, 250, 50, 0x0000FF).setInteractive();
        this.clickUpgradeText = this.add.text(shopX, 50, '', { fontSize: '16px', fill: '#fff' }).setOrigin(0.5);

        this.volunteerUpgradeButton = this.add.rectangle(shopX, 110, 250, 50, 0x0000FF).setInteractive();
        this.volunteerUpgradeText = this.add.text(shopX, 110, '', { fontSize: '16px', fill: '#fff' }).setOrigin(0.5);

        this.trashCanUpgradeButton = this.add.rectangle(shopX, 170, 250, 50, 0x0000FF).setInteractive();
        this.trashCanUpgradeText = this.add.text(shopX, 170, '', { fontSize: '16px', fill: '#fff' }).setOrigin(0.5);

        this.conveyorUpgradeButton = this.add.rectangle(shopX, 230, 250, 50, 0x0000FF).setInteractive();
        this.conveyorUpgradeText = this.add.text(shopX, 230, '', { fontSize: '16px', fill: '#fff' }).setOrigin(0.5);

        // Кнопка сброса
        const resetButton = this.add.rectangle(80, this.cameras.main.height - 40, 100, 40, 0xFF0000).setInteractive();
        this.add.text(resetButton.x, resetButton.y, 'RESET', { fontSize: '20px', fill: '#fff' }).setOrigin(0.5);

        // --- 3. Назначение обработчиков и восстановление состояния ---
        // Обработчики кнопок
        sellButton.on('pointerdown', () => {
            if (this.gameData.trash > 0) {
                this.gameData.money += this.gameData.trash;
                this.gameData.trash = 0;
                this.updateUIText();
            }
        });
        this.clickUpgradeButton.on('pointerdown', () => this.buyUpgrade('click'));
        this.volunteerUpgradeButton.on('pointerdown', () => this.buyUpgrade('volunteer'));
        this.trashCanUpgradeButton.on('pointerdown', () => this.buyUpgrade('trashCan'));
        this.conveyorUpgradeButton.on('pointerdown', () => this.buyUpgrade('conveyor'));
        resetButton.on('pointerdown', () => {
            // Очищаем все сохранения и перезагружаем страницу для полного сброса
            localStorage.clear();
            window.location.reload();
        });

        // Глобальные события
        this.game.events.on('collectTrash', (amount) => {
            this.gameData.trash += amount;
            this.updateUIText();
        }, this);

        // --- 4. Запуск таймеров и первоначальное обновление UI ---
        // Таймеры
        this.time.addEvent({ delay: 1000, callback: this.produceTrash, callbackScope: this, loop: true });
        this.time.addEvent({ delay: 10000, callback: this.saveProgress, callbackScope: this, loop: true });

        // Восстановление состояния после загрузки
        this.applyLoadedState();

        // Первичное обновление UI
        this.updateUIText();
        this.updateUpgradeText();

        this.isCreated = true;
    }

    applyLoadedState() {
        // Применяем апгрейды клика к GameScene
        for (let i = 1; i < this.gameData.upgrades.click.level; i++) {
            this.game.events.emit('upgradeClick');
        }
        // Восстанавливаем конвейер, если он был куплен
        if (this.gameData.upgrades.conveyor.level > 0) {
            this.startConveyor();
        }
    }

    produceTrash() {
        if (this.gameData.trashPerSecond > 0) {
            this.gameData.trash += this.gameData.trashPerSecond;
            this.updateUIText();
        }
    }

    buyUpgrade(key) {
        const upgrade = this.gameData.upgrades[key];
        if (this.gameData.money >= upgrade.cost) {
            this.gameData.money -= upgrade.cost;
            upgrade.level++;
            upgrade.cost = Math.round(upgrade.cost * 1.2);

            if (key === 'click') {
                this.game.events.emit('upgradeClick');
            } else if (key === 'volunteer') {
                this.gameData.trashPerSecond += 1;
            } else if (key === 'trashCan') {
                this.gameData.trashPerSecond += 15;
            } else if (key === 'conveyor') {
                this.startConveyor();
            }

            this.updateUIText();
            this.updateUpgradeText();
            this.saveProgress();
        }
    }

    startConveyor() {
        if (this.conveyorTimer) return; // Запускаем только один раз
        this.conveyorTimer = this.time.addEvent({
            delay: 1000,
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

    updateUIText() {
        this.moneyText.setText(`Деньги: ${this.gameData.money}`);
        this.trashText.setText(`Мусор: ${this.gameData.trash}`);
        this.profitPerClickText.setText(`Прибыль с клика: ${this.gameData.upgrades.click.level}`);
        this.profitPerSecondText.setText(`Прибыль в сек: ${this.gameData.trashPerSecond}`);
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
            this.clickUpgradeButton.setAlpha(1).setInteractive();
        } else {
            this.clickUpgradeButton.setAlpha(0.5).disableInteractive();
        }

        // Кнопка волонтера
        const volunteerUpgrade = this.gameData.upgrades.volunteer;
        if (money >= volunteerUpgrade.cost) {
            this.volunteerUpgradeButton.setAlpha(1).setInteractive();
        } else {
            this.volunteerUpgradeButton.setAlpha(0.5).disableInteractive();
        }

        // Кнопка мусорного бака
        const trashCanUpgrade = this.gameData.upgrades.trashCan;
        if (money >= trashCanUpgrade.cost) {
            this.trashCanUpgradeButton.setAlpha(1).setInteractive();
        } else {
            this.trashCanUpgradeButton.setAlpha(0.5).disableInteractive();
        }

        // Кнопка конвейера
        const conveyorUpgrade = this.gameData.upgrades.conveyor;
        if (money >= conveyorUpgrade.cost && conveyorUpgrade.level === 0) {
            this.conveyorUpgradeButton.setAlpha(1).setInteractive();
        } else {
            this.conveyorUpgradeButton.setAlpha(0.5).disableInteractive();
        }
    }

    saveProgress() {
        localStorage.setItem('trashGodSave', JSON.stringify(this.gameData));
    }

    loadProgress() {
        const savedData = localStorage.getItem('trashGodSave');
        if (savedData) {
            try {
                this.gameData = JSON.parse(savedData);
            } catch (e) {
                console.error('Ошибка при загрузке сохранения:', e);
                this.gameData = null; // При ошибке начинаем новую игру
            }
        }
    }

    update() {
        if (this.isCreated) {
            this.updateButtonsState();
        }
    }
}
