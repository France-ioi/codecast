import React from "react";
import {quickAlgoLibraries} from "./libs/quickalgo_librairies";
import {getContextBlocksData} from "./blocks/blocks";
import {useAppSelector} from "../hooks";

export function AvailableBlocks() {
    const context = quickAlgoLibraries.getContext(null, 'main');
    const platform = useAppSelector(state => state.options.platform);
    console.log('here display');
    if (context) {
        const blocks = getContextBlocksData(context, platform);
        console.log('available blocks', blocks);
    }

    return (
        <div className="task-available-blocks">
            <h2 className="title">Blocs disponibles</h2>
            <p className="subtitle">Cliquez pour insérer</p>

            <div>Catégories</div>
        </div>
    );
}
