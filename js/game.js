const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600
    },
    scene: [GameScene, UIScene]
};

window.addEventListener('load', () => {
    const game = new Phaser.Game(config);
});
