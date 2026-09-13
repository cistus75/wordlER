import data from '../../wordler_items.json';
import type { WordlerItem } from '../types';
import { normalizeItem } from '../game/item';

export const items = (data as WordlerItem[]).map(normalizeItem);
