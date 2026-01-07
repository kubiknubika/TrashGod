class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene', active: true });
    }

    // init() {
    //     // Можно использовать для получения данных из других сцен
    // }

    addButtonTweens(button) {
        button.on('pointerdown', () => {
            button.setScale(0.95);
        });
        button.on('pointerup', () => {
            button.setScale(1);
        });
        button.on('pointerout', () => {
            button.setScale(1);
        });
    }

    preload() {
        // Загружаем иконки для кнопок
        this.load.image('icon_glove', 'assets/icon_glove.png');
        this.load.image('icon_volunteer', 'assets/icon_volunteer.png');
        this.load.image('icon_bin', 'assets/icon_bin.png');
        this.load.image('icon_conveyor', 'assets/icon_conveyor.png');

        // Загружаем звуки
        this.load.audio('sfx_click', 'assets/click.wav');
        this.load.audio('sfx_sell', 'assets/sell.wav');
        this.load.audio('sfx_buy', 'assets/buy.wav');
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

        // --- 2. Создание UI ---
        this.setupResponsiveUI();

        // Глобальные события
    }

    setupResponsiveUI() {
        const { width, height } = this.scale;

        const baseTextStyle = {
            fontFamily: '"Fredoka One", cursive',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 5,
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 3, fill: true }
        };

        // --- Статистика ---
        const fontSize = Math.min(width, height) * 0.04;
        this.moneyText = this.add.text(width * 0.02, height * 0.02, '', { ...baseTextStyle, fontSize: `${fontSize}px` });
        this.trashText = this.add.text(width * 0.02, height * 0.08, '', { ...baseTextStyle, fontSize: `${fontSize}px` });
        this.profitPerClickText = this.add.text(width * 0.02, height * 0.14, '', { ...baseTextStyle, fontSize: `${fontSize * 0.75}px` });
        this.profitPerSecondText = this.add.text(width * 0.02, height * 0.20, '', { ...baseTextStyle, fontSize: `${fontSize * 0.75}px` });

        // --- Кнопки ---
        const buttonHeight = height * 0.1;
        const buttonWidth = width * 0.3;

        // Кнопка продажи
        const sellButton = this.add.rectangle(width / 2, height * 0.9, buttonWidth, buttonHeight, 0x228B22).setInteractive();
        this.add.text(sellButton.x, sellButton.y, 'Продать', { ...baseTextStyle, fontSize: `${fontSize * 0.8}px` }).setOrigin(0.5);
        this.addButtonTweens(sellButton);
        sellButton.on('pointerdown', () => {
            if (this.gameData.trash > 0) {
                const trashToSell = this.gameData.trash;
                this.gameData.trash = 0;
                this.game.events.emit('dispatchTruck', trashToSell);
                this.updateUI();
            }
        });

        // Кнопка сброса
        const resetButton = this.add.rectangle(width * 0.1, height * 0.9, buttonWidth * 0.6, buttonHeight, 0xFF0000).setInteractive();
        this.add.text(resetButton.x, resetButton.y, 'RESET', { ...baseTextStyle, fontSize: `${fontSize * 0.8}px` }).setOrigin(0.5);
        this.addButtonTweens(resetButton);
        resetButton.on('pointerdown', () => {
            localStorage.clear();
            this.scene.start('GameScene');
            this.scene.start('UIScene');
        });

        // --- Магазин ---
        const upgrades = [
            { key: 'click', name: 'Перчатки', icon: 'icon_glove' },
            { key: 'volunteer', name: 'Волонтер', icon: 'icon_volunteer' },
            { key: 'trashCan', name: 'Бак', icon: 'icon_bin' },
            { key: 'conveyor', name: 'Конвейер', icon: 'icon_conveyor' },
        ];

        const shopX = width * 0.75;
        const shopButtonHeight = height * 0.15;
        const shopButtonWidth = width * 0.4;
        let startY = height * 0.1;

        this.upgradeButtons = {};

        upgrades.forEach((upgrade, index) => {
            const buttonY = startY + index * (shopButtonHeight + height * 0.02);

            const container = this.add.container(shopX, buttonY);

            const background = this.add.rectangle(0, 0, shopButtonWidth, shopButtonHeight, 0x0000FF);
            container.add(background);

            if (this.textures.exists(upgrade.icon)) {
                const icon = this.add.sprite(-shopButtonWidth * 0.3, 0, upgrade.icon);
                // Масштабируем иконку, чтобы она влезла
                icon.scale = Math.min(shopButtonHeight / icon.height, shopButtonWidth * 0.4 / icon.width) * 0.8;
                container.add(icon);
            }

            const text = this.add.text(shopButtonWidth * 0.1, 0, '', { ...baseTextStyle, fontSize: `${fontSize * 0.7}px`, align: 'center' }).setOrigin(0.5);
            container.add(text);

            container.setSize(shopButtonWidth, shopButtonHeight).setInteractive();
            this.addButtonTweens(container);

            container.on('pointerdown', () => this.buyUpgrade(upgrade.key));

            this.upgradeButtons[upgrade.key] = { container, text, background };
        });
        this.game.events.on('collectTrash', (amount) => {
            this.gameData.trash += amount;
            this.updateUIText();
        }, this);

        this.game.events.on('playSound', this.playSound, this); // Слушаем событие и вызываем хелпер

        this.game.events.on('addMoney', (amount) => {
            this.gameData.money += amount;
            this.playSound('sfx_sell');
            this.updateUI();
        }, this);


        // --- 4. Запуск таймеров и первоначальное обновление UI ---
        // Таймеры
        this.time.addEvent({ delay: 1000, callback: this.produceTrash, callbackScope: this, loop: true });
        this.time.addEvent({ delay: 10000, callback: this.saveProgress, callbackScope: this, loop: true });

        // Восстановление состояния после загрузки
        this.applyLoadedState();

        // Первичное обновление UI
        this.updateUI();

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
            this.updateUI();
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

            this.playSound('sfx_buy'); // Воспроизводим звук покупки
            this.updateUI();
            this.saveProgress();
        }
    }

    playSound(key) {
        // Проверяем, существует ли звук в кэше, прежде чем проигрывать
        if (this.cache.audio.exists(key)) {
            this.sound.play(key);
        }
    }

    startConveyor() {
        if (this.conveyorTimer) return; // Запускаем только один раз
        this.conveyorTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.gameData.trash > 0) {
                    const trashToSell = this.gameData.trash;
                    this.gameData.trash = 0;
                    this.game.events.emit('dispatchTruck', trashToSell); // Отправляем грузовик
                    this.updateUI();
                }
            },
            loop: true
        });
    }

    updateUIText() {
        if (!this.isCreated) return;
        this.moneyText.setText(`Деньги: ${this.gameData.money}`);
        this.trashText.setText(`Мусор: ${this.gameData.trash}`);
        this.profitPerClickText.setText(`Прибыль с клика: ${this.gameData.upgrades.click.level}`);
        this.profitPerSecondText.setText(`Прибыль в сек: ${this.gameData.trashPerSecond}`);
    }

    updateUI() {
        if (!this.isCreated) return;
        // Обновляем текст статистики
        this.updateUIText();

        // Обновляем кнопки магазина
        const money = this.gameData.money;

        // Перчатки
        const clickButton = this.upgradeButtons.click;
        const clickUpgrade = this.gameData.upgrades.click;
        clickButton.text.setText(`Перчатки\n(${clickUpgrade.cost})`);
        clickButton.container.setAlpha(money >= clickUpgrade.cost ? 1 : 0.5);

        // Волонтер
        const volunteerButton = this.upgradeButtons.volunteer;
        const volunteerUpgrade = this.gameData.upgrades.volunteer;
        volunteerButton.text.setText(`Волонтер\n(${volunteerUpgrade.cost})`);
        volunteerButton.container.setAlpha(money >= volunteerUpgrade.cost ? 1 : 0.5);

        // Бак
        const trashCanButton = this.upgradeButtons.trashCan;
        const trashCanUpgrade = this.gameData.upgrades.trashCan;
        trashCanButton.text.setText(`Бак\n(${trashCanUpgrade.cost})`);
        trashCanButton.container.setAlpha(money >= trashCanUpgrade.cost ? 1 : 0.5);

        // Конвейер
        const conveyorButton = this.upgradeButtons.conveyor;
        const conveyorUpgrade = this.gameData.upgrades.conveyor;
        if (conveyorUpgrade.level === 0) {
            conveyorButton.text.setText(`Конвейер\n(${conveyorUpgrade.cost})`);
            conveyorButton.container.setAlpha(money >= conveyorUpgrade.cost ? 1 : 0.5);
        } else {
            conveyorButton.text.setText('Конвейер\n(Куплено)');
            conveyorButton.container.setAlpha(0.5);
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
            this.updateUI();
        }
    }
}
