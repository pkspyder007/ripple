/** @import { Block, Tracked } from '#client' */

import { branch, destroy_block, render } from './blocks.js';
import { get, set, tracked, active_block } from './runtime.js';
import { RENDER_BLOCK } from './constants.js';

export const HMR = Symbol('hmr');

/**
 * Wrap a component for Hot Module Replacement. When the module is hot-updated,
 * the wrapper's "current" component is updated and the same block re-runs
 * without stacking blocks.
 *
 * @template {(anchor: Node, props: Record<string, any>, block: Block | null) => void} Component
 * @param {Component} fn
 * @returns {Component}
 */
export function hmr(fn) {
	/**
	 * @param {Node} anchor
	 * @param {Record<string, any>} props
	 * @param {Block | null} block
	 */
	/**
	 * @param {Node} anchor
	 * @param {Record<string, any>} props
	 * @param {Block | null} block
	 * @type {Component & { [HMR]: { fn: Component, current: Tracked | null, update: (incoming: any) => void } }}
	 */
	function wrapper(anchor, props, block) {
		/** @type {Block | null} */
		var inner = null;

		render(
			() => {
				var meta = wrapper[HMR];
				if (meta.current === null) {
					var b = active_block;
					if (b === null) {
						throw new Error('hmr() wrapper must be invoked within an active block');
					}
					meta.current = tracked(fn, b);
				}
				var component = get(meta.current);
				if (inner !== null) {
					destroy_block(inner);
					inner = null;
				}
				var b = active_block;
				inner = branch(() => {
					component(anchor, props, b);
				});
			},
			null,
			RENDER_BLOCK,
		);
	}

	wrapper[HMR] = {
		fn,
		/** @type {Tracked | null} */
		current: null,
		update: (/** @type {{ [HMR]: { fn: Component, current: Tracked | null } }} */ incoming) => {
			var cur = wrapper[HMR].current;
			if (cur !== null) {
				set(cur, incoming[HMR].fn);
				incoming[HMR].current = cur;
			}
		},
	};

	return /** @type {Component} */ (/** @type {unknown} */ (wrapper));
}
