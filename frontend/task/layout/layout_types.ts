export enum LayoutView {
    Task = 'task', // instructions
    Editor = 'editor', // solving interface (everything without instructions)
}

export enum LayoutType {
    Desktop = 'desktop', // and tablet horizontal
    TabletVertical = 'tablet-vertical',
    MobileHorizontal = 'mobile-horizontal',
    MobileVertical = 'mobile-vertical',
}

export enum LayoutMobileMode {
    Instructions = 'instructions',
    Editor = 'editor',
    Player = 'player',
    EditorPlayer = 'editor_player',
}

export enum LayoutPlayerMode {
    Execution = 'execution',
    Replay = 'replay',
}
