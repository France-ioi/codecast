import {createAction} from '@reduxjs/toolkit';

export enum ActionTypes {
  LayoutVisualizationSelected = 'Layout.Visualization.Selected',
  LayoutMobileModeChanged = 'Layout.MobileMode.Changed',
  LayoutPlayerModeChanged = 'Layout.PlayerMode.Changed',
  LayoutPlayerModeBackToReplay = 'Layout.PlayerMode.BackToReplay',
  LayoutZoomLevelChanged = 'Layout.ZoomLevel.Changed',
  LayoutRequiredTypeChanged = 'Layout.RequiredType.Changed',
  LayoutViewsChanged = 'Layout.Views.Changed',
  LayoutInstructionsIndexChanged = 'Layout.Instructions.Index.Changed',
  LayoutCursorPositionChanged = 'Layout.Cursor.Position.Changed',
}

export interface CursorPoint {
    x: number,
    y: number,
}

export interface CursorPosition {
    zone?: string,
    posToZone?: CursorPoint,
    domToElement?: string,
    posToElement?: CursorPoint,
    editorCaret?: {row: number, column: number},
    posToEditorCaret?: CursorPoint,
}
