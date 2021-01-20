/*
 * Deepkit Framework
 * Copyright (C) 2021 Deepkit UG, Marc J. Schmidt
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the MIT License.
 *
 * You should have received a copy of the MIT License along with this program.
 */

import { InjectionToken } from '@angular/core';
import type { HttpRequest, HttpResponse } from '@deepkit/framework';

export const REQUEST = new InjectionToken<HttpRequest>('REQUEST');
export const RESPONSE = new InjectionToken<HttpResponse>('RESPONSE');
