/*
 * Deepkit Framework
 * Copyright (C) 2021 Deepkit UG, Marc J. Schmidt
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the MIT License.
 *
 * You should have received a copy of the MIT License along with this program.
 */

import { FsConfig } from './fs.config';
import { Database, DatabaseAdapter } from '@deepkit/orm';
import { createModule, injectable } from '@deepkit/framework';
import { DeepkitFile } from '@deepkit/framework-shared';

@injectable()
export class FsModuleBootstrap {
    constructor(database: Database<DatabaseAdapter>) {
        database.registerEntity(DeepkitFile);
    }
}

export const FSModule = createModule({
    name: 'fs',
    bootstrap: FsModuleBootstrap,
    providers: [
        FsConfig,
        Database,
    ],
    exports: [
        FsConfig,
        Database,
    ]
});
