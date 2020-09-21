
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? undefined : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function slide(node, { delay = 0, duration = 400, easing = cubicOut }) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => `overflow: hidden;` +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }

    /* src/ExpandableItem.svelte generated by Svelte v3.24.1 */

    const file = "src/ExpandableItem.svelte";

    function create_fragment(ctx) {
    	let details;
    	let summary;
    	let span;
    	let t0;
    	let t1;
    	let div0;
    	let svg;
    	let polyline;
    	let t2;
    	let div1;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			details = element("details");
    			summary = element("summary");
    			span = element("span");
    			t0 = text(/*title*/ ctx[0]);
    			t1 = space();
    			div0 = element("div");
    			svg = svg_element("svg");
    			polyline = svg_element("polyline");
    			t2 = space();
    			div1 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(span, "class", "summary-title svelte-hhmzkj");
    			toggle_class(span, "titleOpen", /*isOpen*/ ctx[1]);
    			add_location(span, file, 72, 4, 1067);
    			attr_dev(polyline, "points", "6 9 12 15 18 9");
    			add_location(polyline, file, 84, 45, 1496);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "1");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			attr_dev(svg, "class", "feather feather-chevron-down svelte-hhmzkj");
    			add_location(svg, file, 74, 6, 1198);
    			attr_dev(div0, "class", "summary-chevron-up svelte-hhmzkj");
    			toggle_class(div0, "open", /*isOpen*/ ctx[1]);
    			add_location(div0, file, 73, 4, 1139);
    			attr_dev(summary, "class", "svelte-hhmzkj");
    			add_location(summary, file, 71, 2, 1053);
    			attr_dev(div1, "class", "summary-content svelte-hhmzkj");
    			add_location(div1, file, 89, 2, 1576);
    			attr_dev(details, "class", "svelte-hhmzkj");
    			add_location(details, file, 70, 0, 1022);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, details, anchor);
    			append_dev(details, summary);
    			append_dev(summary, span);
    			append_dev(span, t0);
    			append_dev(summary, t1);
    			append_dev(summary, div0);
    			append_dev(div0, svg);
    			append_dev(svg, polyline);
    			append_dev(details, t2);
    			append_dev(details, div1);

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			details.open = /*isOpen*/ ctx[1];
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(details, "toggle", /*details_toggle_handler*/ ctx[4]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*title*/ 1) set_data_dev(t0, /*title*/ ctx[0]);

    			if (dirty & /*isOpen*/ 2) {
    				toggle_class(span, "titleOpen", /*isOpen*/ ctx[1]);
    			}

    			if (dirty & /*isOpen*/ 2) {
    				toggle_class(div0, "open", /*isOpen*/ ctx[1]);
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 4) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[2], dirty, null, null);
    				}
    			}

    			if (dirty & /*isOpen*/ 2) {
    				details.open = /*isOpen*/ ctx[1];
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(details);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { title } = $$props;
    	let isOpen = false;
    	const writable_props = ["title"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ExpandableItem> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ExpandableItem", $$slots, ['default']);

    	function details_toggle_handler() {
    		isOpen = this.open;
    		$$invalidate(1, isOpen);
    	}

    	$$self.$$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ title, isOpen });

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("isOpen" in $$props) $$invalidate(1, isOpen = $$props.isOpen);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, isOpen, $$scope, $$slots, details_toggle_handler];
    }

    class ExpandableItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { title: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ExpandableItem",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*title*/ ctx[0] === undefined && !("title" in props)) {
    			console.warn("<ExpandableItem> was created without expected prop 'title'");
    		}
    	}

    	get title() {
    		throw new Error("<ExpandableItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<ExpandableItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/ButtonGenerator.svelte generated by Svelte v3.24.1 */

    const { Object: Object_1 } = globals;
    const file$1 = "src/ButtonGenerator.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[55] = list[i][0];
    	child_ctx[56] = list[i][1];
    	child_ctx[58] = i;
    	return child_ctx;
    }

    // (123:4) <ExpandableItem title="Container style">
    function create_default_slot_1(ctx) {
    	let div0;
    	let label0;
    	let t1;
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let t5;
    	let div1;
    	let label1;
    	let t7;
    	let small0;
    	let t9;
    	let input0;
    	let t10;
    	let small1;
    	let t12;
    	let small2;
    	let t14;
    	let input1;
    	let t15;
    	let small3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Alignment";
    			t1 = space();
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "Left";
    			option1 = element("option");
    			option1.textContent = "Center";
    			option2 = element("option");
    			option2.textContent = "Right";
    			t5 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Margin";
    			t7 = space();
    			small0 = element("small");
    			small0.textContent = "↔";
    			t9 = space();
    			input0 = element("input");
    			t10 = space();
    			small1 = element("small");
    			small1.textContent = "px";
    			t12 = space();
    			small2 = element("small");
    			small2.textContent = "↕";
    			t14 = space();
    			input1 = element("input");
    			t15 = space();
    			small3 = element("small");
    			small3.textContent = "px";
    			attr_dev(label0, "for", "containerAlign");
    			add_location(label0, file$1, 124, 8, 3801);
    			option0.__value = "left";
    			option0.value = option0.__value;
    			add_location(option0, file$1, 126, 10, 3926);
    			option1.__value = "center";
    			option1.value = option1.__value;
    			add_location(option1, file$1, 127, 10, 3971);
    			option2.__value = "right";
    			option2.value = option2.__value;
    			add_location(option2, file$1, 128, 10, 4020);
    			attr_dev(select, "id", "containerAlign");
    			if (/*containerTextAlign*/ ctx[11] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[25].call(select));
    			add_location(select, file$1, 125, 8, 3855);
    			attr_dev(div0, "class", "ctrl-flex");
    			add_location(div0, file$1, 123, 6, 3769);
    			attr_dev(label1, "for", "_");
    			add_location(label1, file$1, 133, 8, 4127);
    			set_style(small0, "margin-right", "-0.8rem");
    			add_location(small0, file$1, 134, 8, 4165);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "min", "0");
    			attr_dev(input0, "max", "100");
    			add_location(input0, file$1, 135, 8, 4220);
    			set_style(small1, "margin-left", "-0.8rem");
    			add_location(small1, file$1, 136, 8, 4300);
    			set_style(small2, "margin-right", "-0.8rem");
    			add_location(small2, file$1, 137, 8, 4355);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "min", "0");
    			attr_dev(input1, "max", "100");
    			add_location(input1, file$1, 138, 8, 4410);
    			set_style(small3, "margin-left", "-0.8rem");
    			add_location(small3, file$1, 139, 8, 4490);
    			attr_dev(div1, "class", "ctrl-flex");
    			add_location(div1, file$1, 132, 6, 4095);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, label0);
    			append_dev(div0, t1);
    			append_dev(div0, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			select_option(select, /*containerTextAlign*/ ctx[11]);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, label1);
    			append_dev(div1, t7);
    			append_dev(div1, small0);
    			append_dev(div1, t9);
    			append_dev(div1, input0);
    			set_input_value(input0, /*containerMarginH*/ ctx[4]);
    			append_dev(div1, t10);
    			append_dev(div1, small1);
    			append_dev(div1, t12);
    			append_dev(div1, small2);
    			append_dev(div1, t14);
    			append_dev(div1, input1);
    			set_input_value(input1, /*containerMarginV*/ ctx[3]);
    			append_dev(div1, t15);
    			append_dev(div1, small3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*select_change_handler*/ ctx[25]),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[26]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[27])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*containerTextAlign*/ 2048) {
    				select_option(select, /*containerTextAlign*/ ctx[11]);
    			}

    			if (dirty[0] & /*containerMarginH*/ 16 && to_number(input0.value) !== /*containerMarginH*/ ctx[4]) {
    				set_input_value(input0, /*containerMarginH*/ ctx[4]);
    			}

    			if (dirty[0] & /*containerMarginV*/ 8 && to_number(input1.value) !== /*containerMarginV*/ ctx[3]) {
    				set_input_value(input1, /*containerMarginV*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(123:4) <ExpandableItem title=\\\"Container style\\\">",
    		ctx
    	});

    	return block;
    }

    // (149:6) {#if btnContrastLevel < 4.5}
    function create_if_block(ctx) {
    	let div;
    	let label;
    	let t0;
    	let small;
    	let t1;
    	let t2;
    	let t3;
    	let div_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			t0 = space();
    			small = element("small");
    			t1 = text("⚠ Color contrast insufficient (");
    			t2 = text(/*btnContrastLevel*/ ctx[17]);
    			t3 = text(":1)");
    			attr_dev(label, "for", "____");
    			add_location(label, file$1, 150, 10, 4838);
    			attr_dev(small, "class", "warning");
    			add_location(small, file$1, 151, 10, 4869);
    			attr_dev(div, "class", "ctrl-flex");
    			add_location(div, file$1, 149, 8, 4787);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label);
    			append_dev(div, t0);
    			append_dev(div, small);
    			append_dev(small, t1);
    			append_dev(small, t2);
    			append_dev(small, t3);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*btnContrastLevel*/ 131072) set_data_dev(t2, /*btnContrastLevel*/ ctx[17]);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(149:6) {#if btnContrastLevel < 4.5}",
    		ctx
    	});

    	return block;
    }

    // (192:10) {#each Object.entries(fonts) as [key, value], i}
    function create_each_block(ctx) {
    	let option;
    	let t0_value = /*key*/ ctx[55] + "";
    	let t0;
    	let t1;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = space();
    			set_style(option, "padding", "0.25rem 0.5rem");
    			set_style(option, "margin", "0.25rem 0");
    			set_style(option, "height", "1.5rem");
    			set_style(option, "font-size", "1rem");
    			set_style(option, "font-family", /*value*/ ctx[56]);
    			option.__value = option_value_value = /*key*/ ctx[55];
    			option.value = option.__value;
    			add_location(option, file$1, 192, 12, 6062);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(192:10) {#each Object.entries(fonts) as [key, value], i}",
    		ctx
    	});

    	return block;
    }

    // (144:4) <ExpandableItem title="Button style">
    function create_default_slot(ctx) {
    	let div0;
    	let a;
    	let t0;
    	let t1;
    	let t2;
    	let div1;
    	let label0;
    	let t4;
    	let input0;
    	let t5;
    	let input1;
    	let t6;
    	let div2;
    	let label1;
    	let t8;
    	let input2;
    	let t9;
    	let input3;
    	let input3_pattern_value;
    	let t10;
    	let div3;
    	let label2;
    	let t12;
    	let select;
    	let t13;
    	let button0;
    	let t15;
    	let button1;
    	let t17;
    	let div4;
    	let label3;
    	let t19;
    	let input4;
    	let t20;
    	let small0;
    	let t22;
    	let div5;
    	let label4;
    	let t24;
    	let small1;
    	let t26;
    	let input5;
    	let t27;
    	let small2;
    	let t29;
    	let small3;
    	let t31;
    	let input6;
    	let t32;
    	let small4;
    	let t34;
    	let div6;
    	let label5;
    	let t36;
    	let input7;
    	let t37;
    	let code0;
    	let t38;
    	let t39;
    	let t40;
    	let div7;
    	let label6;
    	let t42;
    	let input8;
    	let t43;
    	let code1;

    	let t44_value = (/*buttonWidth*/ ctx[12] >= 0
    	? `${/*buttonWidth*/ ctx[12]}%`
    	: "Automatic") + "";

    	let t44;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*btnContrastLevel*/ ctx[17] < 4.5 && create_if_block(ctx);
    	let each_value = Object.entries(/*fonts*/ ctx[20]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			a = element("a");
    			t0 = text("Sample button");
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			div1 = element("div");
    			label0 = element("label");
    			label0.textContent = "Background color";
    			t4 = space();
    			input0 = element("input");
    			t5 = space();
    			input1 = element("input");
    			t6 = space();
    			div2 = element("div");
    			label1 = element("label");
    			label1.textContent = "Text color";
    			t8 = space();
    			input2 = element("input");
    			t9 = space();
    			input3 = element("input");
    			t10 = space();
    			div3 = element("div");
    			label2 = element("label");
    			label2.textContent = "Font";
    			t12 = space();
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t13 = space();
    			button0 = element("button");
    			button0.textContent = "Bold";
    			t15 = space();
    			button1 = element("button");
    			button1.textContent = "Italic";
    			t17 = space();
    			div4 = element("div");
    			label3 = element("label");
    			label3.textContent = "Padding";
    			t19 = space();
    			input4 = element("input");
    			t20 = space();
    			small0 = element("small");
    			small0.textContent = "px";
    			t22 = space();
    			div5 = element("div");
    			label4 = element("label");
    			label4.textContent = "Margin";
    			t24 = space();
    			small1 = element("small");
    			small1.textContent = "↔";
    			t26 = space();
    			input5 = element("input");
    			t27 = space();
    			small2 = element("small");
    			small2.textContent = "px";
    			t29 = space();
    			small3 = element("small");
    			small3.textContent = "↕";
    			t31 = space();
    			input6 = element("input");
    			t32 = space();
    			small4 = element("small");
    			small4.textContent = "px";
    			t34 = space();
    			div6 = element("div");
    			label5 = element("label");
    			label5.textContent = "Corner radius";
    			t36 = space();
    			input7 = element("input");
    			t37 = space();
    			code0 = element("code");
    			t38 = text(/*borderRadius*/ ctx[7]);
    			t39 = text(" px");
    			t40 = space();
    			div7 = element("div");
    			label6 = element("label");
    			label6.textContent = "Button width (%)";
    			t42 = space();
    			input8 = element("input");
    			t43 = space();
    			code1 = element("code");
    			t44 = text(t44_value);
    			attr_dev(a, "href", ".");
    			attr_dev(a, "style", /*buttonStyle*/ ctx[18]);
    			attr_dev(a, "target", "_blank");
    			add_location(a, file$1, 145, 8, 4664);
    			set_style(div0, "pointer-events", "none");
    			add_location(div0, file$1, 144, 6, 4621);
    			attr_dev(label0, "for", "bgColor");
    			add_location(label0, file$1, 156, 8, 5019);
    			attr_dev(input0, "type", "color");
    			attr_dev(input0, "id", "bgColor");
    			add_location(input0, file$1, 157, 8, 5073);
    			set_style(input1, "width", "5rem");
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "maxlength", "7");
    			attr_dev(input1, "minlength", "7");
    			add_location(input1, file$1, 162, 8, 5210);
    			attr_dev(div1, "class", "ctrl-flex");
    			add_location(div1, file$1, 155, 6, 4987);
    			attr_dev(label1, "for", "txtColor");
    			add_location(label1, file$1, 172, 8, 5445);
    			attr_dev(input2, "type", "color");
    			attr_dev(input2, "id", "txtColor");
    			attr_dev(input2, "maxlength", "7");
    			attr_dev(input2, "minlength", "7");
    			add_location(input2, file$1, 173, 8, 5494);
    			set_style(input3, "width", "5rem");
    			attr_dev(input3, "type", "text");
    			attr_dev(input3, "pattern", input3_pattern_value = "#." + 6);
    			add_location(input3, file$1, 180, 8, 5682);
    			attr_dev(div2, "class", "ctrl-flex");
    			add_location(div2, file$1, 171, 6, 5413);
    			attr_dev(label2, "for", "fontFamily");
    			add_location(label2, file$1, 189, 8, 5897);
    			attr_dev(select, "name", "font");
    			attr_dev(select, "id", "font");
    			if (/*font*/ ctx[8] === void 0) add_render_callback(() => /*select_change_handler_1*/ ctx[36].call(select));
    			add_location(select, file$1, 190, 8, 5942);
    			attr_dev(button0, "class", "toggleBtn");
    			toggle_class(button0, "toggled", /*isBold*/ ctx[9]);
    			add_location(button0, file$1, 199, 8, 6303);
    			attr_dev(button1, "class", "toggleBtn");
    			toggle_class(button1, "toggled", /*isItalic*/ ctx[10]);
    			add_location(button1, file$1, 203, 8, 6440);
    			attr_dev(div3, "class", "ctrl-flex");
    			add_location(div3, file$1, 188, 6, 5865);
    			attr_dev(label3, "for", "padding");
    			add_location(label3, file$1, 210, 8, 6629);
    			attr_dev(input4, "type", "number");
    			attr_dev(input4, "min", "0");
    			attr_dev(input4, "max", "100");
    			attr_dev(input4, "id", "padding");
    			add_location(input4, file$1, 211, 8, 6674);
    			set_style(small0, "margin-left", "-0.8rem");
    			add_location(small0, file$1, 217, 8, 6808);
    			attr_dev(div4, "class", "ctrl-flex");
    			add_location(div4, file$1, 209, 6, 6597);
    			attr_dev(label4, "for", "__");
    			add_location(label4, file$1, 221, 8, 6907);
    			set_style(small1, "margin-right", "-0.8rem");
    			add_location(small1, file$1, 222, 8, 6946);
    			attr_dev(input5, "type", "number");
    			attr_dev(input5, "min", "0");
    			attr_dev(input5, "max", "100");
    			add_location(input5, file$1, 223, 8, 7001);
    			set_style(small2, "margin-left", "-0.8rem");
    			add_location(small2, file$1, 224, 8, 7078);
    			set_style(small3, "margin-right", "-0.8rem");
    			add_location(small3, file$1, 225, 8, 7133);
    			attr_dev(input6, "type", "number");
    			attr_dev(input6, "min", "0");
    			attr_dev(input6, "max", "100");
    			add_location(input6, file$1, 226, 8, 7188);
    			set_style(small4, "margin-left", "-0.8rem");
    			add_location(small4, file$1, 227, 8, 7265);
    			attr_dev(div5, "class", "ctrl-flex");
    			add_location(div5, file$1, 220, 6, 6875);
    			attr_dev(label5, "for", "borderRadius");
    			add_location(label5, file$1, 231, 8, 7364);
    			attr_dev(input7, "type", "range");
    			attr_dev(input7, "min", "0");
    			attr_dev(input7, "max", "50");
    			attr_dev(input7, "id", "borderRadius");
    			add_location(input7, file$1, 232, 8, 7420);
    			add_location(code0, file$1, 238, 8, 7562);
    			attr_dev(div6, "class", "ctrl-flex");
    			add_location(div6, file$1, 230, 6, 7332);
    			attr_dev(label6, "for", "btnWidth");
    			add_location(label6, file$1, 242, 8, 7645);
    			attr_dev(input8, "type", "range");
    			attr_dev(input8, "min", "-1");
    			attr_dev(input8, "max", "100");
    			attr_dev(input8, "id", "btnWidth");
    			add_location(input8, file$1, 244, 8, 7701);
    			add_location(code1, file$1, 250, 8, 7840);
    			attr_dev(div7, "class", "ctrl-flex");
    			add_location(div7, file$1, 241, 6, 7613);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, a);
    			append_dev(a, t0);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, label0);
    			append_dev(div1, t4);
    			append_dev(div1, input0);
    			set_input_value(input0, /*bgColor*/ ctx[5]);
    			append_dev(div1, t5);
    			append_dev(div1, input1);
    			set_input_value(input1, /*bgColor*/ ctx[5]);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, label1);
    			append_dev(div2, t8);
    			append_dev(div2, input2);
    			set_input_value(input2, /*textColor*/ ctx[6]);
    			append_dev(div2, t9);
    			append_dev(div2, input3);
    			set_input_value(input3, /*textColor*/ ctx[6]);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, label2);
    			append_dev(div3, t12);
    			append_dev(div3, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*font*/ ctx[8]);
    			append_dev(div3, t13);
    			append_dev(div3, button0);
    			append_dev(div3, t15);
    			append_dev(div3, button1);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, label3);
    			append_dev(div4, t19);
    			append_dev(div4, input4);
    			set_input_value(input4, /*padding*/ ctx[0]);
    			append_dev(div4, t20);
    			append_dev(div4, small0);
    			insert_dev(target, t22, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, label4);
    			append_dev(div5, t24);
    			append_dev(div5, small1);
    			append_dev(div5, t26);
    			append_dev(div5, input5);
    			set_input_value(input5, /*buttonMarginH*/ ctx[2]);
    			append_dev(div5, t27);
    			append_dev(div5, small2);
    			append_dev(div5, t29);
    			append_dev(div5, small3);
    			append_dev(div5, t31);
    			append_dev(div5, input6);
    			set_input_value(input6, /*buttonMarginV*/ ctx[1]);
    			append_dev(div5, t32);
    			append_dev(div5, small4);
    			insert_dev(target, t34, anchor);
    			insert_dev(target, div6, anchor);
    			append_dev(div6, label5);
    			append_dev(div6, t36);
    			append_dev(div6, input7);
    			set_input_value(input7, /*borderRadius*/ ctx[7]);
    			append_dev(div6, t37);
    			append_dev(div6, code0);
    			append_dev(code0, t38);
    			append_dev(code0, t39);
    			insert_dev(target, t40, anchor);
    			insert_dev(target, div7, anchor);
    			append_dev(div7, label6);
    			append_dev(div7, t42);
    			append_dev(div7, input8);
    			set_input_value(input8, /*buttonWidth*/ ctx[12]);
    			append_dev(div7, t43);
    			append_dev(div7, code1);
    			append_dev(code1, t44);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler_1*/ ctx[28]),
    					listen_dev(input0, "change", /*change_handler*/ ctx[29], false, false, false),
    					listen_dev(input1, "input", /*input1_input_handler_1*/ ctx[30]),
    					listen_dev(input1, "change", /*change_handler_1*/ ctx[31], false, false, false),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[32]),
    					listen_dev(input2, "change", /*change_handler_2*/ ctx[33], false, false, false),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[34]),
    					listen_dev(input3, "change", /*change_handler_3*/ ctx[35], false, false, false),
    					listen_dev(select, "change", /*select_change_handler_1*/ ctx[36]),
    					listen_dev(button0, "click", /*click_handler*/ ctx[37], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[38], false, false, false),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[39]),
    					listen_dev(input5, "input", /*input5_input_handler*/ ctx[40]),
    					listen_dev(input6, "input", /*input6_input_handler*/ ctx[41]),
    					listen_dev(input7, "change", /*input7_change_input_handler*/ ctx[42]),
    					listen_dev(input7, "input", /*input7_change_input_handler*/ ctx[42]),
    					listen_dev(input8, "change", /*input8_change_input_handler*/ ctx[43]),
    					listen_dev(input8, "input", /*input8_change_input_handler*/ ctx[43])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*buttonStyle*/ 262144) {
    				attr_dev(a, "style", /*buttonStyle*/ ctx[18]);
    			}

    			if (/*btnContrastLevel*/ ctx[17] < 4.5) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*btnContrastLevel*/ 131072) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t2.parentNode, t2);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty[0] & /*bgColor*/ 32) {
    				set_input_value(input0, /*bgColor*/ ctx[5]);
    			}

    			if (dirty[0] & /*bgColor*/ 32 && input1.value !== /*bgColor*/ ctx[5]) {
    				set_input_value(input1, /*bgColor*/ ctx[5]);
    			}

    			if (dirty[0] & /*textColor*/ 64) {
    				set_input_value(input2, /*textColor*/ ctx[6]);
    			}

    			if (dirty[0] & /*textColor*/ 64 && input3.value !== /*textColor*/ ctx[6]) {
    				set_input_value(input3, /*textColor*/ ctx[6]);
    			}

    			if (dirty[0] & /*fonts*/ 1048576) {
    				each_value = Object.entries(/*fonts*/ ctx[20]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty[0] & /*font, fonts*/ 1048832) {
    				select_option(select, /*font*/ ctx[8]);
    			}

    			if (dirty[0] & /*isBold*/ 512) {
    				toggle_class(button0, "toggled", /*isBold*/ ctx[9]);
    			}

    			if (dirty[0] & /*isItalic*/ 1024) {
    				toggle_class(button1, "toggled", /*isItalic*/ ctx[10]);
    			}

    			if (dirty[0] & /*padding*/ 1 && to_number(input4.value) !== /*padding*/ ctx[0]) {
    				set_input_value(input4, /*padding*/ ctx[0]);
    			}

    			if (dirty[0] & /*buttonMarginH*/ 4 && to_number(input5.value) !== /*buttonMarginH*/ ctx[2]) {
    				set_input_value(input5, /*buttonMarginH*/ ctx[2]);
    			}

    			if (dirty[0] & /*buttonMarginV*/ 2 && to_number(input6.value) !== /*buttonMarginV*/ ctx[1]) {
    				set_input_value(input6, /*buttonMarginV*/ ctx[1]);
    			}

    			if (dirty[0] & /*borderRadius*/ 128) {
    				set_input_value(input7, /*borderRadius*/ ctx[7]);
    			}

    			if (!current || dirty[0] & /*borderRadius*/ 128) set_data_dev(t38, /*borderRadius*/ ctx[7]);

    			if (dirty[0] & /*buttonWidth*/ 4096) {
    				set_input_value(input8, /*buttonWidth*/ ctx[12]);
    			}

    			if ((!current || dirty[0] & /*buttonWidth*/ 4096) && t44_value !== (t44_value = (/*buttonWidth*/ ctx[12] >= 0
    			? `${/*buttonWidth*/ ctx[12]}%`
    			: "Automatic") + "")) set_data_dev(t44, t44_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(div4);
    			if (detaching) detach_dev(t22);
    			if (detaching) detach_dev(div5);
    			if (detaching) detach_dev(t34);
    			if (detaching) detach_dev(div6);
    			if (detaching) detach_dev(t40);
    			if (detaching) detach_dev(div7);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(144:4) <ExpandableItem title=\\\"Button style\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div3;
    	let main;
    	let h1;
    	let t1;
    	let div0;
    	let label0;
    	let t3;
    	let label1;
    	let t5;
    	let textarea0;
    	let t6;
    	let textarea1;
    	let t7;
    	let h3;
    	let t9;
    	let div1;
    	let t10;
    	let aside;
    	let expandableitem0;
    	let t11;
    	let expandableitem1;
    	let t12;
    	let div2;
    	let span;
    	let t14;
    	let textarea2;
    	let textarea2_transition;
    	let t15;
    	let p;
    	let t16;
    	let p_transition;
    	let current;
    	let mounted;
    	let dispose;

    	expandableitem0 = new ExpandableItem({
    			props: {
    				title: "Container style",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	expandableitem1 = new ExpandableItem({
    			props: {
    				title: "Button style",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Button generator";
    			t1 = space();
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Captions";
    			t3 = space();
    			label1 = element("label");
    			label1.textContent = "URLs";
    			t5 = space();
    			textarea0 = element("textarea");
    			t6 = space();
    			textarea1 = element("textarea");
    			t7 = space();
    			h3 = element("h3");
    			h3.textContent = "Preview";
    			t9 = space();
    			div1 = element("div");
    			t10 = space();
    			aside = element("aside");
    			create_component(expandableitem0.$$.fragment);
    			t11 = space();
    			create_component(expandableitem1.$$.fragment);
    			t12 = space();
    			div2 = element("div");
    			span = element("span");
    			span.textContent = "Code";
    			t14 = space();
    			textarea2 = element("textarea");
    			t15 = space();
    			p = element("p");
    			t16 = text(/*btnCopiedToClipboardTxt*/ ctx[16]);
    			add_location(h1, file$1, 104, 4, 3348);
    			attr_dev(label0, "for", "captions");
    			add_location(label0, file$1, 107, 6, 3404);
    			attr_dev(label1, "for", "urls");
    			add_location(label1, file$1, 108, 6, 3449);
    			attr_dev(textarea0, "id", "captions");
    			add_location(textarea0, file$1, 110, 6, 3487);
    			attr_dev(textarea1, "id", "urls");
    			add_location(textarea1, file$1, 111, 6, 3548);
    			attr_dev(div0, "class", "flex");
    			add_location(div0, file$1, 106, 4, 3379);
    			add_location(h3, file$1, 114, 4, 3611);
    			attr_dev(div1, "class", "preview");
    			add_location(div1, file$1, 116, 4, 3633);
    			add_location(main, file$1, 103, 2, 3337);
    			attr_dev(span, "class", "section-title");
    			add_location(span, file$1, 255, 6, 7971);
    			set_style(textarea2, "height", "auto");
    			set_style(textarea2, "min-height", "6rem");
    			attr_dev(textarea2, "class", "output");
    			attr_dev(textarea2, "type", "text");
    			textarea2.readOnly = true;
    			add_location(textarea2, file$1, 257, 6, 8018);
    			attr_dev(p, "class", "copiedToClipboardTxt");
    			add_location(p, file$1, 267, 6, 8285);
    			attr_dev(div2, "class", "item");
    			add_location(div2, file$1, 254, 4, 7946);
    			add_location(aside, file$1, 121, 2, 3710);
    			attr_dev(div3, "class", "sidebar-grid");
    			add_location(div3, file$1, 102, 0, 3308);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, main);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t3);
    			append_dev(div0, label1);
    			append_dev(div0, t5);
    			append_dev(div0, textarea0);
    			set_input_value(textarea0, /*buttonCaptions*/ ctx[13]);
    			append_dev(div0, t6);
    			append_dev(div0, textarea1);
    			set_input_value(textarea1, /*buttonUrls*/ ctx[14]);
    			append_dev(main, t7);
    			append_dev(main, h3);
    			append_dev(main, t9);
    			append_dev(main, div1);
    			div1.innerHTML = /*buttonOutputCode*/ ctx[19];
    			append_dev(div3, t10);
    			append_dev(div3, aside);
    			mount_component(expandableitem0, aside, null);
    			append_dev(aside, t11);
    			mount_component(expandableitem1, aside, null);
    			append_dev(aside, t12);
    			append_dev(aside, div2);
    			append_dev(div2, span);
    			append_dev(div2, t14);
    			append_dev(div2, textarea2);
    			/*textarea2_binding*/ ctx[44](textarea2);
    			set_input_value(textarea2, /*buttonOutputCode*/ ctx[19]);
    			append_dev(div2, t15);
    			append_dev(div2, p);
    			append_dev(p, t16);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(textarea0, "input", /*textarea0_input_handler*/ ctx[23]),
    					listen_dev(textarea1, "input", /*textarea1_input_handler*/ ctx[24]),
    					listen_dev(textarea2, "input", /*textarea2_input_handler*/ ctx[45]),
    					listen_dev(textarea2, "click", /*buttonSelectCode*/ ctx[21], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*buttonCaptions*/ 8192) {
    				set_input_value(textarea0, /*buttonCaptions*/ ctx[13]);
    			}

    			if (dirty[0] & /*buttonUrls*/ 16384) {
    				set_input_value(textarea1, /*buttonUrls*/ ctx[14]);
    			}

    			if (!current || dirty[0] & /*buttonOutputCode*/ 524288) div1.innerHTML = /*buttonOutputCode*/ ctx[19];			const expandableitem0_changes = {};

    			if (dirty[0] & /*containerMarginV, containerMarginH, containerTextAlign*/ 2072 | dirty[1] & /*$$scope*/ 268435456) {
    				expandableitem0_changes.$$scope = { dirty, ctx };
    			}

    			expandableitem0.$set(expandableitem0_changes);
    			const expandableitem1_changes = {};

    			if (dirty[0] & /*buttonWidth, borderRadius, buttonMarginV, buttonMarginH, padding, isItalic, isBold, font, textColor, bgColor, btnContrastLevel, buttonStyle*/ 399335 | dirty[1] & /*$$scope*/ 268435456) {
    				expandableitem1_changes.$$scope = { dirty, ctx };
    			}

    			expandableitem1.$set(expandableitem1_changes);

    			if (dirty[0] & /*buttonOutputCode*/ 524288) {
    				set_input_value(textarea2, /*buttonOutputCode*/ ctx[19]);
    			}

    			if (!current || dirty[0] & /*btnCopiedToClipboardTxt*/ 65536) set_data_dev(t16, /*btnCopiedToClipboardTxt*/ ctx[16]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(expandableitem0.$$.fragment, local);
    			transition_in(expandableitem1.$$.fragment, local);

    			add_render_callback(() => {
    				if (!textarea2_transition) textarea2_transition = create_bidirectional_transition(textarea2, slide, {}, true);
    				textarea2_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!p_transition) p_transition = create_bidirectional_transition(p, slide, {}, true);
    				p_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(expandableitem0.$$.fragment, local);
    			transition_out(expandableitem1.$$.fragment, local);
    			if (!textarea2_transition) textarea2_transition = create_bidirectional_transition(textarea2, slide, {}, false);
    			textarea2_transition.run(0);
    			if (!p_transition) p_transition = create_bidirectional_transition(p, slide, {}, false);
    			p_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(expandableitem0);
    			destroy_component(expandableitem1);
    			/*textarea2_binding*/ ctx[44](null);
    			if (detaching && textarea2_transition) textarea2_transition.end();
    			if (detaching && p_transition) p_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let stylePanelOpen = false;

    	let fonts = {
    		Helvetica: "'Helvetica Neue', Helvetica, Arial, Verdana, sans-serif",
    		Arial: "Arial, sans-serif",
    		Verdana: "Verdana, Geneva, sans-serif",
    		Tahoma: "Tahoma, Verdana, Segoe, sans-serif",
    		TrebuchetMS: "'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif",
    		ComicSansMS: "'Comic Sans MS', 'Marker Felt-Thin', Arial, sans-serif",
    		TimesNewRoman: "'Times New Roman', Times, Baskerville, Georgia, serif",
    		Georgia: "Georgia, Times, \"Times New Roman\", serif",
    		Lucida: "'Lucida Sans Unicode', 'Lucida Grande', sans-serif",
    		CourierNew: "'Courier New', Courier, 'Lucida Sans Typewriter', 'Lucida Typewriter', monospace"
    	};

    	let padding = 18;
    	let buttonMarginV = 4;
    	let buttonMarginH = 4;
    	let containerMarginV = 0;
    	let containerMarginH = 0;
    	let bgColor = "#000000";
    	let textColor = "#ffffff";
    	let borderRadius = 0;
    	let borderColor = "#aaaaaa";
    	let borderThickness = 0;
    	let borderStyle = "none";
    	let font = "Helvetica";
    	let isBold = false;
    	let isItalic = false;
    	let containerTextAlign = "center";
    	let buttonWidth = -1;

    	// Functionality
    	let buttonCaptions = "";

    	let buttonUrls = "";
    	let buttonOutputTextArea;
    	let btnCopiedToClipboardTxt = "Click to copy";

    	const buttonSelectCode = e => {
    		buttonOutputTextArea.select();
    		buttonOutputTextArea.setSelectionRange(0, 99999);
    		document.execCommand("copy");
    		$$invalidate(16, btnCopiedToClipboardTxt = "Copied to clipboard");
    		setTimeout(() => $$invalidate(16, btnCopiedToClipboardTxt = "Click to copy"), 2000);
    	};

    	let btnContrastLevel = 21;

    	const getContrast = async () => {
    		let result = await fetch(`https://webaim.org/resources/contrastchecker/?fcolor=${textColor.replace("#", "")}&bcolor=${bgColor.replace("#", "")}&api`);
    		let json = await result.json();
    		$$invalidate(17, btnContrastLevel = json.ratio);
    	};

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ButtonGenerator> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ButtonGenerator", $$slots, []);

    	function textarea0_input_handler() {
    		buttonCaptions = this.value;
    		$$invalidate(13, buttonCaptions);
    	}

    	function textarea1_input_handler() {
    		buttonUrls = this.value;
    		$$invalidate(14, buttonUrls);
    	}

    	function select_change_handler() {
    		containerTextAlign = select_value(this);
    		$$invalidate(11, containerTextAlign);
    	}

    	function input0_input_handler() {
    		containerMarginH = to_number(this.value);
    		$$invalidate(4, containerMarginH);
    	}

    	function input1_input_handler() {
    		containerMarginV = to_number(this.value);
    		$$invalidate(3, containerMarginV);
    	}

    	function input0_input_handler_1() {
    		bgColor = this.value;
    		$$invalidate(5, bgColor);
    	}

    	const change_handler = () => getContrast();

    	function input1_input_handler_1() {
    		bgColor = this.value;
    		$$invalidate(5, bgColor);
    	}

    	const change_handler_1 = () => getContrast();

    	function input2_input_handler() {
    		textColor = this.value;
    		$$invalidate(6, textColor);
    	}

    	const change_handler_2 = () => getContrast();

    	function input3_input_handler() {
    		textColor = this.value;
    		$$invalidate(6, textColor);
    	}

    	const change_handler_3 = () => getContrast();

    	function select_change_handler_1() {
    		font = select_value(this);
    		$$invalidate(8, font);
    		$$invalidate(20, fonts);
    	}

    	const click_handler = () => $$invalidate(9, isBold = !isBold);
    	const click_handler_1 = () => $$invalidate(10, isItalic = !isItalic);

    	function input4_input_handler() {
    		padding = to_number(this.value);
    		$$invalidate(0, padding);
    	}

    	function input5_input_handler() {
    		buttonMarginH = to_number(this.value);
    		$$invalidate(2, buttonMarginH);
    	}

    	function input6_input_handler() {
    		buttonMarginV = to_number(this.value);
    		$$invalidate(1, buttonMarginV);
    	}

    	function input7_change_input_handler() {
    		borderRadius = to_number(this.value);
    		$$invalidate(7, borderRadius);
    	}

    	function input8_change_input_handler() {
    		buttonWidth = to_number(this.value);
    		$$invalidate(12, buttonWidth);
    	}

    	function textarea2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			buttonOutputTextArea = $$value;
    			$$invalidate(15, buttonOutputTextArea);
    		});
    	}

    	function textarea2_input_handler() {
    		buttonOutputCode = this.value;
    		((((((((((((((((((((((((($$invalidate(19, buttonOutputCode), $$invalidate(11, containerTextAlign)), $$invalidate(3, containerMarginV)), $$invalidate(4, containerMarginH)), $$invalidate(50, buttonOutputItems)), $$invalidate(49, buttonItems)), $$invalidate(18, buttonStyle)), $$invalidate(47, splitButtonCaptions)), $$invalidate(48, splitButtonUrls)), $$invalidate(0, padding)), $$invalidate(1, buttonMarginV)), $$invalidate(2, buttonMarginH)), $$invalidate(7, borderRadius)), $$invalidate(5, bgColor)), $$invalidate(6, textColor)), $$invalidate(20, fonts)), $$invalidate(8, font)), $$invalidate(9, isBold)), $$invalidate(10, isItalic)), $$invalidate(46, border)), $$invalidate(12, buttonWidth)), $$invalidate(13, buttonCaptions)), $$invalidate(14, buttonUrls)), $$invalidate(54, borderStyle)), $$invalidate(53, borderThickness)), $$invalidate(52, borderColor));
    	}

    	$$self.$capture_state = () => ({
    		slide,
    		ExpandableItem,
    		stylePanelOpen,
    		fonts,
    		padding,
    		buttonMarginV,
    		buttonMarginH,
    		containerMarginV,
    		containerMarginH,
    		bgColor,
    		textColor,
    		borderRadius,
    		borderColor,
    		borderThickness,
    		borderStyle,
    		font,
    		isBold,
    		isItalic,
    		containerTextAlign,
    		buttonWidth,
    		buttonCaptions,
    		buttonUrls,
    		buttonOutputTextArea,
    		btnCopiedToClipboardTxt,
    		buttonSelectCode,
    		btnContrastLevel,
    		getContrast,
    		border,
    		buttonStyle,
    		splitButtonCaptions,
    		splitButtonUrls,
    		buttonItems,
    		buttonOutputItems,
    		buttonOutputCode
    	});

    	$$self.$inject_state = $$props => {
    		if ("stylePanelOpen" in $$props) stylePanelOpen = $$props.stylePanelOpen;
    		if ("fonts" in $$props) $$invalidate(20, fonts = $$props.fonts);
    		if ("padding" in $$props) $$invalidate(0, padding = $$props.padding);
    		if ("buttonMarginV" in $$props) $$invalidate(1, buttonMarginV = $$props.buttonMarginV);
    		if ("buttonMarginH" in $$props) $$invalidate(2, buttonMarginH = $$props.buttonMarginH);
    		if ("containerMarginV" in $$props) $$invalidate(3, containerMarginV = $$props.containerMarginV);
    		if ("containerMarginH" in $$props) $$invalidate(4, containerMarginH = $$props.containerMarginH);
    		if ("bgColor" in $$props) $$invalidate(5, bgColor = $$props.bgColor);
    		if ("textColor" in $$props) $$invalidate(6, textColor = $$props.textColor);
    		if ("borderRadius" in $$props) $$invalidate(7, borderRadius = $$props.borderRadius);
    		if ("borderColor" in $$props) $$invalidate(52, borderColor = $$props.borderColor);
    		if ("borderThickness" in $$props) $$invalidate(53, borderThickness = $$props.borderThickness);
    		if ("borderStyle" in $$props) $$invalidate(54, borderStyle = $$props.borderStyle);
    		if ("font" in $$props) $$invalidate(8, font = $$props.font);
    		if ("isBold" in $$props) $$invalidate(9, isBold = $$props.isBold);
    		if ("isItalic" in $$props) $$invalidate(10, isItalic = $$props.isItalic);
    		if ("containerTextAlign" in $$props) $$invalidate(11, containerTextAlign = $$props.containerTextAlign);
    		if ("buttonWidth" in $$props) $$invalidate(12, buttonWidth = $$props.buttonWidth);
    		if ("buttonCaptions" in $$props) $$invalidate(13, buttonCaptions = $$props.buttonCaptions);
    		if ("buttonUrls" in $$props) $$invalidate(14, buttonUrls = $$props.buttonUrls);
    		if ("buttonOutputTextArea" in $$props) $$invalidate(15, buttonOutputTextArea = $$props.buttonOutputTextArea);
    		if ("btnCopiedToClipboardTxt" in $$props) $$invalidate(16, btnCopiedToClipboardTxt = $$props.btnCopiedToClipboardTxt);
    		if ("btnContrastLevel" in $$props) $$invalidate(17, btnContrastLevel = $$props.btnContrastLevel);
    		if ("border" in $$props) $$invalidate(46, border = $$props.border);
    		if ("buttonStyle" in $$props) $$invalidate(18, buttonStyle = $$props.buttonStyle);
    		if ("splitButtonCaptions" in $$props) $$invalidate(47, splitButtonCaptions = $$props.splitButtonCaptions);
    		if ("splitButtonUrls" in $$props) $$invalidate(48, splitButtonUrls = $$props.splitButtonUrls);
    		if ("buttonItems" in $$props) $$invalidate(49, buttonItems = $$props.buttonItems);
    		if ("buttonOutputItems" in $$props) $$invalidate(50, buttonOutputItems = $$props.buttonOutputItems);
    		if ("buttonOutputCode" in $$props) $$invalidate(19, buttonOutputCode = $$props.buttonOutputCode);
    	};

    	let border;
    	let buttonStyle;
    	let splitButtonCaptions;
    	let splitButtonUrls;
    	let buttonItems;
    	let buttonOutputItems;
    	let buttonOutputCode;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*padding, buttonMarginV, buttonMarginH, borderRadius, bgColor, textColor, font, isBold, isItalic, buttonWidth*/ 6119 | $$self.$$.dirty[1] & /*border*/ 32768) {
    			 $$invalidate(18, buttonStyle = `display: inline-block; text-decoration: none; text-align: center; line-height: 1; padding: ${padding}px; margin: ${buttonMarginV}px ${buttonMarginH}px; border-radius: ${borderRadius}px; background: ${bgColor}; color: ${textColor}; font-family: ${fonts[font]}; font-weight: ${isBold ? 700 : 400}; ${isItalic ? "font-style: italic; " : ""}${border}${buttonWidth >= 0 ? `width: ${buttonWidth}%` : ""}`);
    		}

    		if ($$self.$$.dirty[0] & /*buttonCaptions*/ 8192) {
    			 $$invalidate(47, splitButtonCaptions = buttonCaptions.trimEnd().split("\n"));
    		}

    		if ($$self.$$.dirty[0] & /*buttonUrls*/ 16384) {
    			 $$invalidate(48, splitButtonUrls = buttonUrls.trimEnd().split("\n"));
    		}

    		if ($$self.$$.dirty[1] & /*splitButtonCaptions, splitButtonUrls*/ 196608) {
    			 $$invalidate(49, buttonItems = splitButtonCaptions.map(i => {
    				let index = splitButtonCaptions.indexOf(i);
    				return { caption: i, url: splitButtonUrls[index] };
    			}));
    		}

    		if ($$self.$$.dirty[0] & /*buttonStyle*/ 262144 | $$self.$$.dirty[1] & /*buttonItems*/ 262144) {
    			 $$invalidate(50, buttonOutputItems = buttonItems.map(item => `<a href="${item.url}" style="${buttonStyle}" target='_blank' >${item.caption}</a>`));
    		}

    		if ($$self.$$.dirty[0] & /*containerTextAlign, containerMarginV, containerMarginH*/ 2072 | $$self.$$.dirty[1] & /*buttonOutputItems*/ 524288) {
    			 $$invalidate(19, buttonOutputCode = `<div class="mcnTextContent" style="text-align: ${containerTextAlign}; margin: ${containerMarginV}px ${containerMarginH}px; padding: 0;">${buttonOutputItems.join("")}\n</div>`);
    		}
    	};

    	 $$invalidate(46, border = borderStyle != "none"
    	? `border: ${borderThickness}px ${borderStyle} ${borderColor}`
    	: "");

    	return [
    		padding,
    		buttonMarginV,
    		buttonMarginH,
    		containerMarginV,
    		containerMarginH,
    		bgColor,
    		textColor,
    		borderRadius,
    		font,
    		isBold,
    		isItalic,
    		containerTextAlign,
    		buttonWidth,
    		buttonCaptions,
    		buttonUrls,
    		buttonOutputTextArea,
    		btnCopiedToClipboardTxt,
    		btnContrastLevel,
    		buttonStyle,
    		buttonOutputCode,
    		fonts,
    		buttonSelectCode,
    		getContrast,
    		textarea0_input_handler,
    		textarea1_input_handler,
    		select_change_handler,
    		input0_input_handler,
    		input1_input_handler,
    		input0_input_handler_1,
    		change_handler,
    		input1_input_handler_1,
    		change_handler_1,
    		input2_input_handler,
    		change_handler_2,
    		input3_input_handler,
    		change_handler_3,
    		select_change_handler_1,
    		click_handler,
    		click_handler_1,
    		input4_input_handler,
    		input5_input_handler,
    		input6_input_handler,
    		input7_change_input_handler,
    		input8_change_input_handler,
    		textarea2_binding,
    		textarea2_input_handler
    	];
    }

    class ButtonGenerator extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ButtonGenerator",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/MultiColumn.svelte generated by Svelte v3.24.1 */

    const { console: console_1 } = globals;
    const file$2 = "src/MultiColumn.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[75] = list[i];
    	return child_ctx;
    }

    // (261:4) {#if uploading}
    function create_if_block_6(ctx) {
    	let div12;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;
    	let t2;
    	let div3;
    	let t3;
    	let div4;
    	let t4;
    	let div5;
    	let t5;
    	let div6;
    	let t6;
    	let div7;
    	let t7;
    	let div8;
    	let t8;
    	let div9;
    	let t9;
    	let div10;
    	let t10;
    	let div11;
    	let div12_transition;
    	let t11;
    	let span;
    	let t13;
    	let br;
    	let current;

    	const block = {
    		c: function create() {
    			div12 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div2 = element("div");
    			t2 = space();
    			div3 = element("div");
    			t3 = space();
    			div4 = element("div");
    			t4 = space();
    			div5 = element("div");
    			t5 = space();
    			div6 = element("div");
    			t6 = space();
    			div7 = element("div");
    			t7 = space();
    			div8 = element("div");
    			t8 = space();
    			div9 = element("div");
    			t9 = space();
    			div10 = element("div");
    			t10 = space();
    			div11 = element("div");
    			t11 = space();
    			span = element("span");
    			span.textContent = "Uploading";
    			t13 = space();
    			br = element("br");
    			attr_dev(div0, "class", "sk-circle1 sk-circle");
    			add_location(div0, file$2, 262, 8, 6871);
    			attr_dev(div1, "class", "sk-circle2 sk-circle");
    			add_location(div1, file$2, 263, 8, 6916);
    			attr_dev(div2, "class", "sk-circle3 sk-circle");
    			add_location(div2, file$2, 264, 8, 6961);
    			attr_dev(div3, "class", "sk-circle4 sk-circle");
    			add_location(div3, file$2, 265, 8, 7006);
    			attr_dev(div4, "class", "sk-circle5 sk-circle");
    			add_location(div4, file$2, 266, 8, 7051);
    			attr_dev(div5, "class", "sk-circle6 sk-circle");
    			add_location(div5, file$2, 267, 8, 7096);
    			attr_dev(div6, "class", "sk-circle7 sk-circle");
    			add_location(div6, file$2, 268, 8, 7141);
    			attr_dev(div7, "class", "sk-circle8 sk-circle");
    			add_location(div7, file$2, 269, 8, 7186);
    			attr_dev(div8, "class", "sk-circle9 sk-circle");
    			add_location(div8, file$2, 270, 8, 7231);
    			attr_dev(div9, "class", "sk-circle10 sk-circle");
    			add_location(div9, file$2, 271, 8, 7276);
    			attr_dev(div10, "class", "sk-circle11 sk-circle");
    			add_location(div10, file$2, 272, 8, 7322);
    			attr_dev(div11, "class", "sk-circle12 sk-circle");
    			add_location(div11, file$2, 273, 8, 7368);
    			attr_dev(div12, "class", "sk-fading-circle");
    			add_location(div12, file$2, 261, 6, 6815);
    			add_location(span, file$2, 275, 6, 7425);
    			add_location(br, file$2, 276, 6, 7454);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div12, anchor);
    			append_dev(div12, div0);
    			append_dev(div12, t0);
    			append_dev(div12, div1);
    			append_dev(div12, t1);
    			append_dev(div12, div2);
    			append_dev(div12, t2);
    			append_dev(div12, div3);
    			append_dev(div12, t3);
    			append_dev(div12, div4);
    			append_dev(div12, t4);
    			append_dev(div12, div5);
    			append_dev(div12, t5);
    			append_dev(div12, div6);
    			append_dev(div12, t6);
    			append_dev(div12, div7);
    			append_dev(div12, t7);
    			append_dev(div12, div8);
    			append_dev(div12, t8);
    			append_dev(div12, div9);
    			append_dev(div12, t9);
    			append_dev(div12, div10);
    			append_dev(div12, t10);
    			append_dev(div12, div11);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, span, anchor);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, br, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div12_transition) div12_transition = create_bidirectional_transition(div12, slide, {}, true);
    				div12_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div12_transition) div12_transition = create_bidirectional_transition(div12, slide, {}, false);
    			div12_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div12);
    			if (detaching && div12_transition) div12_transition.end();
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(span);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(261:4) {#if uploading}",
    		ctx
    	});

    	return block;
    }

    // (280:4) {#if splitImages.length != splitUrls.length}
    function create_if_block_5(ctx) {
    	let small;
    	let small_transition;
    	let current;

    	const block = {
    		c: function create() {
    			small = element("small");
    			small.textContent = "Number of records in both columns should be equal!";
    			set_style(small, "margin-top", "0.5rem");
    			set_style(small, "display", "inline-block");
    			attr_dev(small, "class", "warning");
    			add_location(small, file$2, 280, 6, 7527);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, small, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!small_transition) small_transition = create_bidirectional_transition(small, slide, {}, true);
    				small_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!small_transition) small_transition = create_bidirectional_transition(small, slide, {}, false);
    			small_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(small);
    			if (detaching && small_transition) small_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(280:4) {#if splitImages.length != splitUrls.length}",
    		ctx
    	});

    	return block;
    }

    // (289:4) {#if splitImages.length > 0 && columnImages.length > 0 && !uploading}
    function create_if_block_4(ctx) {
    	let h3;
    	let h3_transition;
    	let t1;
    	let div;
    	let div_transition;
    	let current;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Preview";
    			t1 = space();
    			div = element("div");
    			set_style(h3, "margin", "1rem 0");
    			attr_dev(h3, "class", "svelte-a9jl9f");
    			add_location(h3, file$2, 289, 6, 7808);
    			attr_dev(div, "class", "preview");
    			set_style(div, "width", /*maxWidth*/ ctx[16] + "px");
    			add_location(div, file$2, 290, 6, 7871);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			div.innerHTML = /*columnOutputCode*/ ctx[24];
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*columnOutputCode*/ 16777216) div.innerHTML = /*columnOutputCode*/ ctx[24];
    			if (!current || dirty[0] & /*maxWidth*/ 65536) {
    				set_style(div, "width", /*maxWidth*/ ctx[16] + "px");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h3_transition) h3_transition = create_bidirectional_transition(h3, slide, {}, true);
    				h3_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!h3_transition) h3_transition = create_bidirectional_transition(h3, slide, {}, false);
    			h3_transition.run(0);
    			if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching && h3_transition) h3_transition.end();
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(289:4) {#if splitImages.length > 0 && columnImages.length > 0 && !uploading}",
    		ctx
    	});

    	return block;
    }

    // (305:6) {:else}
    function create_else_block(ctx) {
    	let button;
    	let t0;
    	let br;
    	let t1;
    	let small;
    	let t3;
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*connState*/ ctx[18] != null && create_if_block_3(ctx);

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text("Connected to MailChimp API");
    			br = element("br");
    			t1 = space();
    			small = element("small");
    			small.textContent = "Click to disconnect";
    			t3 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			add_location(br, file$2, 310, 39, 8483);
    			set_style(small, "opacity", "0.6");
    			add_location(small, file$2, 311, 10, 8500);
    			attr_dev(button, "class", "connectedBtn svelte-a9jl9f");
    			add_location(button, file$2, 305, 8, 8322);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, br);
    			append_dev(button, t1);
    			append_dev(button, small);
    			insert_dev(target, t3, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[32], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*connState*/ ctx[18] != null) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*connState*/ 262144) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t3);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(305:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (299:6) {#if connState == null}
    function create_if_block_2(ctx) {
    	let button;
    	let t0;
    	let br;
    	let t1;
    	let small;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text("Connect to Mailchimp API ");
    			br = element("br");
    			t1 = space();
    			small = element("small");
    			small.textContent = "For easy uploads";
    			add_location(br, file$2, 301, 77, 8212);
    			set_style(small, "opacity", "0.6");
    			add_location(small, file$2, 302, 10, 8229);
    			set_style(button, "text-align", "left");
    			add_location(button, file$2, 299, 8, 8092);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, br);
    			append_dev(button, t1);
    			append_dev(button, small);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[31], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(299:6) {#if connState == null}",
    		ctx
    	});

    	return block;
    }

    // (314:8) {#if connState != null}
    function create_if_block_3(ctx) {
    	let div;
    	let input;
    	let div_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			attr_dev(input, "type", "file");
    			input.multiple = true;
    			input.disabled = /*uploading*/ ctx[12];
    			add_location(input, file$2, 315, 12, 8689);
    			attr_dev(div, "class", "ctrl-flex");
    			set_style(div, "align-items", "center");
    			add_location(div, file$2, 314, 10, 8608);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			/*input_binding*/ ctx[33](input);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*toBase64*/ ctx[26], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*uploading*/ 4096) {
    				prop_dev(input, "disabled", /*uploading*/ ctx[12]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*input_binding*/ ctx[33](null);
    			if (detaching && div_transition) div_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(314:8) {#if connState != null}",
    		ctx
    	});

    	return block;
    }

    // (327:4) {#if connState != null}
    function create_if_block_1(ctx) {
    	let expandableitem;
    	let current;

    	expandableitem = new ExpandableItem({
    			props: {
    				title: "Upload options",
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(expandableitem.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(expandableitem, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const expandableitem_changes = {};

    			if (dirty[0] & /*newFolderName, folders*/ 8224 | dirty[2] & /*$$scope*/ 65536) {
    				expandableitem_changes.$$scope = { dirty, ctx };
    			}

    			expandableitem.$set(expandableitem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(expandableitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(expandableitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(expandableitem, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(327:4) {#if connState != null}",
    		ctx
    	});

    	return block;
    }

    // (332:12) {#each folders as folder}
    function create_each_block$1(ctx) {
    	let option;
    	let t0_value = /*folder*/ ctx[75].name + "";
    	let t0;
    	let t1;
    	let small;
    	let t2;
    	let t3_value = /*folder*/ ctx[75].id + "";
    	let t3;
    	let t4;
    	let t5;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = space();
    			small = element("small");
    			t2 = text("(id ");
    			t3 = text(t3_value);
    			t4 = text(")");
    			t5 = space();
    			add_location(small, file$2, 334, 16, 9232);
    			option.__value = option_value_value = /*folder*/ ctx[75].id;
    			option.value = option.__value;
    			add_location(option, file$2, 332, 14, 9159);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    			append_dev(option, small);
    			append_dev(small, t2);
    			append_dev(small, t3);
    			append_dev(small, t4);
    			append_dev(option, t5);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*folders*/ 8192 && t0_value !== (t0_value = /*folder*/ ctx[75].name + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*folders*/ 8192 && t3_value !== (t3_value = /*folder*/ ctx[75].id + "")) set_data_dev(t3, t3_value);

    			if (dirty[0] & /*folders*/ 8192 && option_value_value !== (option_value_value = /*folder*/ ctx[75].id)) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(332:12) {#each folders as folder}",
    		ctx
    	});

    	return block;
    }

    // (328:6) <ExpandableItem title="Upload options">
    function create_default_slot_3(ctx) {
    	let div0;
    	let label0;
    	let t1;
    	let select;
    	let t2;
    	let div1;
    	let label1;
    	let t4;
    	let input;
    	let t5;
    	let button;
    	let t6;
    	let button_disabled_value;
    	let mounted;
    	let dispose;
    	let each_value = /*folders*/ ctx[13];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Folder";
    			t1 = space();
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Add a folder";
    			t4 = space();
    			input = element("input");
    			t5 = space();
    			button = element("button");
    			t6 = text("Add folder");
    			attr_dev(label0, "for", "folderPicker");
    			attr_dev(label0, "class", "svelte-a9jl9f");
    			add_location(label0, file$2, 329, 10, 9029);
    			attr_dev(select, "id", "folderPicker");
    			add_location(select, file$2, 330, 10, 9080);
    			attr_dev(div0, "class", "ctrl-flex");
    			add_location(div0, file$2, 328, 8, 8995);
    			attr_dev(label1, "for", "newFolderName");
    			attr_dev(label1, "class", "svelte-a9jl9f");
    			add_location(label1, file$2, 341, 10, 9386);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "id", "newFolderName");
    			add_location(input, file$2, 342, 10, 9444);
    			button.disabled = button_disabled_value = /*newFolderName*/ ctx[5].length < 1;
    			add_location(button, file$2, 344, 10, 9523);
    			attr_dev(div1, "class", "ctrl-flex");
    			add_location(div1, file$2, 340, 8, 9352);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, label0);
    			append_dev(div0, t1);
    			append_dev(div0, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, label1);
    			append_dev(div1, t4);
    			append_dev(div1, input);
    			set_input_value(input, /*newFolderName*/ ctx[5]);
    			append_dev(div1, t5);
    			append_dev(div1, button);
    			append_dev(button, t6);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[34]),
    					listen_dev(button, "click", /*click_handler_2*/ ctx[35], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*folders*/ 8192) {
    				each_value = /*folders*/ ctx[13];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty[0] & /*newFolderName*/ 32 && input.value !== /*newFolderName*/ ctx[5]) {
    				set_input_value(input, /*newFolderName*/ ctx[5]);
    			}

    			if (dirty[0] & /*newFolderName*/ 32 && button_disabled_value !== (button_disabled_value = /*newFolderName*/ ctx[5].length < 1)) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(328:6) <ExpandableItem title=\\\"Upload options\\\">",
    		ctx
    	});

    	return block;
    }

    // (419:6) {#if columnBetweenBorderThickness > 0}
    function create_if_block$1(ctx) {
    	let div0;
    	let input0;
    	let t0;
    	let input1;
    	let div0_transition;
    	let t1;
    	let div2;
    	let div1;
    	let div1_style_value;
    	let t2;
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let option3;
    	let option4;
    	let option5;
    	let div2_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			input0 = element("input");
    			t0 = space();
    			input1 = element("input");
    			t1 = space();
    			div2 = element("div");
    			div1 = element("div");
    			t2 = space();
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "Solid";
    			option1 = element("option");
    			option1.textContent = "Dotted";
    			option2 = element("option");
    			option2.textContent = "Dashed";
    			option3 = element("option");
    			option3.textContent = "Double";
    			option4 = element("option");
    			option4.textContent = "Groove";
    			option5 = element("option");
    			option5.textContent = "Ridge";
    			attr_dev(input0, "type", "color");
    			attr_dev(input0, "id", "bgColor");
    			add_location(input0, file$2, 420, 10, 11661);
    			set_style(input1, "width", "5rem");
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "maxlength", "7");
    			attr_dev(input1, "minlength", "7");
    			add_location(input1, file$2, 424, 10, 11781);
    			attr_dev(div0, "class", "ctrl-flex");
    			add_location(div0, file$2, 419, 8, 11610);
    			attr_dev(div1, "style", div1_style_value = "height: 1px; width :32px; border-bottom: " + /*columnBetweenBorderThickness*/ ctx[6] + "px " + /*columnBetweenBorderStyle*/ ctx[7] + " grey");
    			add_location(div1, file$2, 433, 10, 12024);
    			option0.__value = "solid";
    			option0.value = option0.__value;
    			add_location(option0, file$2, 436, 12, 12247);
    			option1.__value = "dotted";
    			option1.value = option1.__value;
    			add_location(option1, file$2, 437, 12, 12296);
    			option2.__value = "dashed";
    			option2.value = option2.__value;
    			add_location(option2, file$2, 438, 12, 12347);
    			option3.__value = "double";
    			option3.value = option3.__value;
    			add_location(option3, file$2, 439, 12, 12398);
    			option4.__value = "groove";
    			option4.value = option4.__value;
    			add_location(option4, file$2, 440, 12, 12449);
    			option5.__value = "ridge";
    			option5.value = option5.__value;
    			add_location(option5, file$2, 441, 12, 12500);
    			attr_dev(select, "id", "containerAlign");
    			if (/*columnBetweenBorderStyle*/ ctx[7] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[44].call(select));
    			add_location(select, file$2, 435, 10, 12168);
    			attr_dev(div2, "class", "ctrl-flex");
    			add_location(div2, file$2, 432, 8, 11973);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, input0);
    			set_input_value(input0, /*columnBetweenBorderColor*/ ctx[8]);
    			append_dev(div0, t0);
    			append_dev(div0, input1);
    			set_input_value(input1, /*columnBetweenBorderColor*/ ctx[8]);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div2, t2);
    			append_dev(div2, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			append_dev(select, option3);
    			append_dev(select, option4);
    			append_dev(select, option5);
    			select_option(select, /*columnBetweenBorderStyle*/ ctx[7]);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[42]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[43]),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[44])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*columnBetweenBorderColor*/ 256) {
    				set_input_value(input0, /*columnBetweenBorderColor*/ ctx[8]);
    			}

    			if (dirty[0] & /*columnBetweenBorderColor*/ 256 && input1.value !== /*columnBetweenBorderColor*/ ctx[8]) {
    				set_input_value(input1, /*columnBetweenBorderColor*/ ctx[8]);
    			}

    			if (!current || dirty[0] & /*columnBetweenBorderThickness, columnBetweenBorderStyle*/ 192 && div1_style_value !== (div1_style_value = "height: 1px; width :32px; border-bottom: " + /*columnBetweenBorderThickness*/ ctx[6] + "px " + /*columnBetweenBorderStyle*/ ctx[7] + " grey")) {
    				attr_dev(div1, "style", div1_style_value);
    			}

    			if (dirty[0] & /*columnBetweenBorderStyle*/ 128) {
    				select_option(select, /*columnBetweenBorderStyle*/ ctx[7]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div0_transition) div0_transition = create_bidirectional_transition(div0, slide, {}, true);
    				div0_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, slide, {}, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div0_transition) div0_transition = create_bidirectional_transition(div0, slide, {}, false);
    			div0_transition.run(0);
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, slide, {}, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching && div0_transition) div0_transition.end();
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div2);
    			if (detaching && div2_transition) div2_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(419:6) {#if columnBetweenBorderThickness > 0}",
    		ctx
    	});

    	return block;
    }

    // (352:4) <ExpandableItem title="Container">
    function create_default_slot_2(ctx) {
    	let div0;
    	let label0;
    	let t1;
    	let input0;
    	let t2;
    	let code0;
    	let t3;
    	let t4;
    	let t5;
    	let small;
    	let t6;
    	let code1;
    	let t7;
    	let t8;
    	let t9;
    	let t10;
    	let div1;
    	let label1;
    	let t12;
    	let input1;
    	let t13;
    	let code2;
    	let t14;
    	let t15;
    	let div2;
    	let label2;
    	let t17;
    	let input2;
    	let t18;
    	let code3;
    	let t19;
    	let t20;
    	let t21;
    	let div3;
    	let label3;
    	let t23;
    	let input3;
    	let t24;
    	let code4;
    	let t25;
    	let t26;
    	let t27;
    	let div4;
    	let label4;
    	let t29;
    	let input4;
    	let t30;
    	let code5;
    	let t31;
    	let t32;
    	let t33;
    	let div5;
    	let label5;
    	let t35;
    	let input5;
    	let t36;
    	let code6;
    	let t37;
    	let t38;
    	let t39;
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*columnBetweenBorderThickness*/ ctx[6] > 0 && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Maximum width";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			code0 = element("code");
    			t3 = text(/*maxWidth*/ ctx[16]);
    			t4 = text(" px");
    			t5 = space();
    			small = element("small");
    			t6 = text("(");
    			code1 = element("code");
    			t7 = text(/*colWidth*/ ctx[21]);
    			t8 = text(" px");
    			t9 = text(" per image)");
    			t10 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Images per row";
    			t12 = space();
    			input1 = element("input");
    			t13 = space();
    			code2 = element("code");
    			t14 = text(/*imagesPerRow*/ ctx[3]);
    			t15 = space();
    			div2 = element("div");
    			label2 = element("label");
    			label2.textContent = "Space above row";
    			t17 = space();
    			input2 = element("input");
    			t18 = space();
    			code3 = element("code");
    			t19 = text(/*columnBetweenBorderPaddingTop*/ ctx[9]);
    			t20 = text(" px");
    			t21 = space();
    			div3 = element("div");
    			label3 = element("label");
    			label3.textContent = "Space below row";
    			t23 = space();
    			input3 = element("input");
    			t24 = space();
    			code4 = element("code");
    			t25 = text(/*columnBetweenBorderPaddingBottom*/ ctx[10]);
    			t26 = text(" px");
    			t27 = space();
    			div4 = element("div");
    			label4 = element("label");
    			label4.textContent = "Horizontal gap";
    			t29 = space();
    			input4 = element("input");
    			t30 = space();
    			code5 = element("code");
    			t31 = text(/*columnsHGap*/ ctx[4]);
    			t32 = text(" px");
    			t33 = space();
    			div5 = element("div");
    			label5 = element("label");
    			label5.textContent = "Border";
    			t35 = space();
    			input5 = element("input");
    			t36 = space();
    			code6 = element("code");
    			t37 = text(/*columnBetweenBorderThickness*/ ctx[6]);
    			t38 = text(" px");
    			t39 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(label0, "for", "maxWidth");
    			attr_dev(label0, "class", "svelte-a9jl9f");
    			add_location(label0, file$2, 353, 8, 9767);
    			attr_dev(input0, "id", "maxWidth");
    			attr_dev(input0, "type", "range");
    			attr_dev(input0, "min", "100");
    			attr_dev(input0, "max", "1200");
    			add_location(input0, file$2, 354, 8, 9819);
    			add_location(code0, file$2, 360, 8, 9957);
    			add_location(code1, file$2, 361, 16, 10000);
    			add_location(small, file$2, 361, 8, 9992);
    			attr_dev(div0, "class", "ctrl-flex");
    			add_location(div0, file$2, 352, 6, 9735);
    			attr_dev(label1, "for", "colImgsPerRow");
    			attr_dev(label1, "class", "svelte-a9jl9f");
    			add_location(label1, file$2, 365, 8, 10098);
    			attr_dev(input1, "id", "colImgsPerRow");
    			attr_dev(input1, "type", "range");
    			attr_dev(input1, "min", "1");
    			attr_dev(input1, "max", "6");
    			add_location(input1, file$2, 366, 8, 10156);
    			add_location(code2, file$2, 372, 8, 10298);
    			attr_dev(div1, "class", "ctrl-flex");
    			add_location(div1, file$2, 364, 6, 10066);
    			attr_dev(label2, "for", "colBrdrSpcTop");
    			attr_dev(label2, "class", "svelte-a9jl9f");
    			add_location(label2, file$2, 376, 8, 10378);
    			attr_dev(input2, "id", "colBrdrSpcTop");
    			attr_dev(input2, "type", "range");
    			attr_dev(input2, "min", "0");
    			attr_dev(input2, "max", "40");
    			add_location(input2, file$2, 377, 8, 10437);
    			add_location(code3, file$2, 383, 8, 10597);
    			attr_dev(div2, "class", "ctrl-flex");
    			add_location(div2, file$2, 375, 6, 10346);
    			attr_dev(label3, "for", "colBrdrSpcBtm");
    			attr_dev(label3, "class", "svelte-a9jl9f");
    			add_location(label3, file$2, 386, 8, 10696);
    			attr_dev(input3, "id", "colBrdrSpcBtm");
    			attr_dev(input3, "type", "range");
    			attr_dev(input3, "min", "0");
    			attr_dev(input3, "max", "40");
    			add_location(input3, file$2, 387, 8, 10755);
    			add_location(code4, file$2, 393, 8, 10918);
    			attr_dev(div3, "class", "ctrl-flex");
    			add_location(div3, file$2, 385, 6, 10664);
    			attr_dev(label4, "for", "colHgap");
    			attr_dev(label4, "class", "svelte-a9jl9f");
    			add_location(label4, file$2, 397, 8, 11021);
    			attr_dev(input4, "id", "colHgap");
    			attr_dev(input4, "type", "range");
    			attr_dev(input4, "min", "0");
    			attr_dev(input4, "max", "32");
    			add_location(input4, file$2, 398, 8, 11073);
    			add_location(code5, file$2, 404, 8, 11209);
    			attr_dev(div4, "class", "ctrl-flex");
    			add_location(div4, file$2, 396, 6, 10989);
    			attr_dev(label5, "for", "colBrdrThcc");
    			attr_dev(label5, "class", "svelte-a9jl9f");
    			add_location(label5, file$2, 408, 8, 11291);
    			attr_dev(input5, "id", "colBrdrThcc");
    			attr_dev(input5, "type", "range");
    			attr_dev(input5, "min", "0");
    			attr_dev(input5, "max", "10");
    			add_location(input5, file$2, 409, 8, 11339);
    			add_location(code6, file$2, 415, 8, 11496);
    			attr_dev(div5, "class", "ctrl-flex");
    			add_location(div5, file$2, 407, 6, 11259);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, label0);
    			append_dev(div0, t1);
    			append_dev(div0, input0);
    			set_input_value(input0, /*maxWidth*/ ctx[16]);
    			append_dev(div0, t2);
    			append_dev(div0, code0);
    			append_dev(code0, t3);
    			append_dev(code0, t4);
    			append_dev(div0, t5);
    			append_dev(div0, small);
    			append_dev(small, t6);
    			append_dev(small, code1);
    			append_dev(code1, t7);
    			append_dev(code1, t8);
    			append_dev(small, t9);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, label1);
    			append_dev(div1, t12);
    			append_dev(div1, input1);
    			set_input_value(input1, /*imagesPerRow*/ ctx[3]);
    			append_dev(div1, t13);
    			append_dev(div1, code2);
    			append_dev(code2, t14);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, label2);
    			append_dev(div2, t17);
    			append_dev(div2, input2);
    			set_input_value(input2, /*columnBetweenBorderPaddingTop*/ ctx[9]);
    			append_dev(div2, t18);
    			append_dev(div2, code3);
    			append_dev(code3, t19);
    			append_dev(code3, t20);
    			insert_dev(target, t21, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, label3);
    			append_dev(div3, t23);
    			append_dev(div3, input3);
    			set_input_value(input3, /*columnBetweenBorderPaddingBottom*/ ctx[10]);
    			append_dev(div3, t24);
    			append_dev(div3, code4);
    			append_dev(code4, t25);
    			append_dev(code4, t26);
    			insert_dev(target, t27, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, label4);
    			append_dev(div4, t29);
    			append_dev(div4, input4);
    			set_input_value(input4, /*columnsHGap*/ ctx[4]);
    			append_dev(div4, t30);
    			append_dev(div4, code5);
    			append_dev(code5, t31);
    			append_dev(code5, t32);
    			insert_dev(target, t33, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, label5);
    			append_dev(div5, t35);
    			append_dev(div5, input5);
    			set_input_value(input5, /*columnBetweenBorderThickness*/ ctx[6]);
    			append_dev(div5, t36);
    			append_dev(div5, code6);
    			append_dev(code6, t37);
    			append_dev(code6, t38);
    			insert_dev(target, t39, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*input0_change_input_handler*/ ctx[36]),
    					listen_dev(input0, "input", /*input0_change_input_handler*/ ctx[36]),
    					listen_dev(input1, "change", /*input1_change_input_handler*/ ctx[37]),
    					listen_dev(input1, "input", /*input1_change_input_handler*/ ctx[37]),
    					listen_dev(input2, "change", /*input2_change_input_handler*/ ctx[38]),
    					listen_dev(input2, "input", /*input2_change_input_handler*/ ctx[38]),
    					listen_dev(input3, "change", /*input3_change_input_handler*/ ctx[39]),
    					listen_dev(input3, "input", /*input3_change_input_handler*/ ctx[39]),
    					listen_dev(input4, "change", /*input4_change_input_handler*/ ctx[40]),
    					listen_dev(input4, "input", /*input4_change_input_handler*/ ctx[40]),
    					listen_dev(input5, "change", /*input5_change_input_handler*/ ctx[41]),
    					listen_dev(input5, "input", /*input5_change_input_handler*/ ctx[41])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*maxWidth*/ 65536) {
    				set_input_value(input0, /*maxWidth*/ ctx[16]);
    			}

    			if (!current || dirty[0] & /*maxWidth*/ 65536) set_data_dev(t3, /*maxWidth*/ ctx[16]);
    			if (!current || dirty[0] & /*colWidth*/ 2097152) set_data_dev(t7, /*colWidth*/ ctx[21]);

    			if (dirty[0] & /*imagesPerRow*/ 8) {
    				set_input_value(input1, /*imagesPerRow*/ ctx[3]);
    			}

    			if (!current || dirty[0] & /*imagesPerRow*/ 8) set_data_dev(t14, /*imagesPerRow*/ ctx[3]);

    			if (dirty[0] & /*columnBetweenBorderPaddingTop*/ 512) {
    				set_input_value(input2, /*columnBetweenBorderPaddingTop*/ ctx[9]);
    			}

    			if (!current || dirty[0] & /*columnBetweenBorderPaddingTop*/ 512) set_data_dev(t19, /*columnBetweenBorderPaddingTop*/ ctx[9]);

    			if (dirty[0] & /*columnBetweenBorderPaddingBottom*/ 1024) {
    				set_input_value(input3, /*columnBetweenBorderPaddingBottom*/ ctx[10]);
    			}

    			if (!current || dirty[0] & /*columnBetweenBorderPaddingBottom*/ 1024) set_data_dev(t25, /*columnBetweenBorderPaddingBottom*/ ctx[10]);

    			if (dirty[0] & /*columnsHGap*/ 16) {
    				set_input_value(input4, /*columnsHGap*/ ctx[4]);
    			}

    			if (!current || dirty[0] & /*columnsHGap*/ 16) set_data_dev(t31, /*columnsHGap*/ ctx[4]);

    			if (dirty[0] & /*columnBetweenBorderThickness*/ 64) {
    				set_input_value(input5, /*columnBetweenBorderThickness*/ ctx[6]);
    			}

    			if (!current || dirty[0] & /*columnBetweenBorderThickness*/ 64) set_data_dev(t37, /*columnBetweenBorderThickness*/ ctx[6]);

    			if (/*columnBetweenBorderThickness*/ ctx[6] > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*columnBetweenBorderThickness*/ 64) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t21);
    			if (detaching) detach_dev(div3);
    			if (detaching) detach_dev(t27);
    			if (detaching) detach_dev(div4);
    			if (detaching) detach_dev(t33);
    			if (detaching) detach_dev(div5);
    			if (detaching) detach_dev(t39);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(352:4) <ExpandableItem title=\\\"Container\\\">",
    		ctx
    	});

    	return block;
    }

    // (448:4) <ExpandableItem title="Advanced">
    function create_default_slot_1$1(ctx) {
    	let div0;
    	let label0;
    	let t0;
    	let code0;
    	let t2;
    	let t3;
    	let input0;
    	let t4;
    	let div1;
    	let label1;
    	let t5;
    	let code1;
    	let t7;
    	let t8;
    	let input1;
    	let t9;
    	let div2;
    	let label2;
    	let t11;
    	let small0;
    	let t12;
    	let code2;
    	let t14;
    	let t15;
    	let div3;
    	let label3;
    	let t17;
    	let small1;
    	let t18;
    	let code3;
    	let t20;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			label0 = element("label");
    			t0 = text("Style for ");
    			code0 = element("code");
    			code0.textContent = "a";
    			t2 = text(" tags");
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			div1 = element("div");
    			label1 = element("label");
    			t5 = text("Style for ");
    			code1 = element("code");
    			code1.textContent = "img";
    			t7 = text(" tags");
    			t8 = space();
    			input1 = element("input");
    			t9 = space();
    			div2 = element("div");
    			label2 = element("label");
    			label2.textContent = " ";
    			t11 = space();
    			small0 = element("small");
    			t12 = text("Use ");
    			code2 = element("code");
    			code2.textContent = `${"{columnWidth}"}`;
    			t14 = text(" as a placeholder\n          for the actual image width.");
    			t15 = space();
    			div3 = element("div");
    			label3 = element("label");
    			label3.textContent = " ";
    			t17 = space();
    			small1 = element("small");
    			t18 = text("Use ");
    			code3 = element("code");
    			code3.textContent = `${"{setGap}"}`;
    			t20 = text(" as a placeholder\n          for spacing set above.");
    			add_location(code0, file$2, 449, 38, 12713);
    			attr_dev(label0, "for", "astyle");
    			attr_dev(label0, "class", "svelte-a9jl9f");
    			add_location(label0, file$2, 449, 8, 12683);
    			set_style(input0, "font-family", "'Inconsolata', monospace");
    			set_style(input0, "width", "30rem");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "id", "astyle");
    			add_location(input0, file$2, 450, 8, 12749);
    			attr_dev(div0, "class", "ctrl-flex");
    			add_location(div0, file$2, 448, 6, 12651);
    			add_location(code1, file$2, 458, 40, 12988);
    			attr_dev(label1, "for", "imgstyle");
    			attr_dev(label1, "class", "svelte-a9jl9f");
    			add_location(label1, file$2, 458, 8, 12956);
    			set_style(input1, "font-family", "'Inconsolata', monospace");
    			set_style(input1, "width", "30rem");
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "id", "imgstyle");
    			add_location(input1, file$2, 459, 8, 13026);
    			attr_dev(div1, "class", "ctrl-flex");
    			add_location(div1, file$2, 457, 6, 12924);
    			attr_dev(label2, "for", "__");
    			attr_dev(label2, "class", "svelte-a9jl9f");
    			add_location(label2, file$2, 467, 8, 13239);
    			set_style(code2, "color", "var(--accent)");
    			add_location(code2, file$2, 469, 14, 13300);
    			add_location(small0, file$2, 468, 8, 13278);
    			attr_dev(div2, "class", "ctrl-flex");
    			add_location(div2, file$2, 466, 6, 13207);
    			attr_dev(label3, "for", "___");
    			attr_dev(label3, "class", "svelte-a9jl9f");
    			add_location(label3, file$2, 474, 8, 13483);
    			set_style(code3, "color", "var(--accent)");
    			add_location(code3, file$2, 476, 14, 13545);
    			add_location(small1, file$2, 475, 8, 13523);
    			attr_dev(div3, "class", "ctrl-flex");
    			add_location(div3, file$2, 473, 6, 13451);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, label0);
    			append_dev(label0, t0);
    			append_dev(label0, code0);
    			append_dev(label0, t2);
    			append_dev(div0, t3);
    			append_dev(div0, input0);
    			set_input_value(input0, /*aStyle*/ ctx[15]);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, label1);
    			append_dev(label1, t5);
    			append_dev(label1, code1);
    			append_dev(label1, t7);
    			append_dev(div1, t8);
    			append_dev(div1, input1);
    			set_input_value(input1, /*imageStyle*/ ctx[14]);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, label2);
    			append_dev(div2, t11);
    			append_dev(div2, small0);
    			append_dev(small0, t12);
    			append_dev(small0, code2);
    			append_dev(small0, t14);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, label3);
    			append_dev(div3, t17);
    			append_dev(div3, small1);
    			append_dev(small1, t18);
    			append_dev(small1, code3);
    			append_dev(small1, t20);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler_1*/ ctx[45]),
    					listen_dev(input1, "input", /*input1_input_handler_1*/ ctx[46])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*aStyle*/ 32768 && input0.value !== /*aStyle*/ ctx[15]) {
    				set_input_value(input0, /*aStyle*/ ctx[15]);
    			}

    			if (dirty[0] & /*imageStyle*/ 16384 && input1.value !== /*imageStyle*/ ctx[14]) {
    				set_input_value(input1, /*imageStyle*/ ctx[14]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(448:4) <ExpandableItem title=\\\"Advanced\\\">",
    		ctx
    	});

    	return block;
    }

    // (483:4) <ExpandableItem title="Misc">
    function create_default_slot$1(ctx) {
    	let div;
    	let small;
    	let t1;
    	let button0;
    	let t3;
    	let button1;
    	let t5;
    	let button2;
    	let t7;
    	let span0;
    	let t9;
    	let span1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			small = element("small");
    			small.textContent = "Clear";
    			t1 = space();
    			button0 = element("button");
    			button0.textContent = "Images";
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "URLs";
    			t5 = space();
    			button2 = element("button");
    			button2.textContent = "Both";
    			t7 = space();
    			span0 = element("span");
    			span0.textContent = "Add dummy data";
    			t9 = space();
    			span1 = element("span");
    			span1.textContent = "Add XL dummy data";
    			set_style(small, "margin-right", "0.5rem");
    			add_location(small, file$2, 484, 8, 13803);
    			set_style(button0, "border-top-right-radius", "0");
    			set_style(button0, "border-bottom-right-radius", "0");
    			add_location(button0, file$2, 485, 8, 13861);
    			set_style(button1, "border-radius", "0");
    			set_style(button1, "border-left-width", "0");
    			set_style(button1, "border-right-width", "0");
    			add_location(button1, file$2, 488, 8, 14016);
    			set_style(button2, "border-top-left-radius", "0");
    			set_style(button2, "border-bottom-left-radius", "0");
    			add_location(button2, file$2, 491, 8, 14171);
    			set_style(div, "display", "flex");
    			set_style(div, "align-items", "baseline");
    			add_location(div, file$2, 483, 6, 13743);
    			set_style(span0, "opacity", "0.5");
    			set_style(span0, "cursor", "pointer");
    			set_style(span0, "font-size", "0.8rem");
    			set_style(span0, "display", "inline-block");
    			add_location(span0, file$2, 498, 6, 14387);
    			set_style(span1, "opacity", "0.5");
    			set_style(span1, "cursor", "pointer");
    			set_style(span1, "font-size", "0.8rem");
    			set_style(span1, "display", "inline-block");
    			set_style(span1, "margin", "0 1rem");
    			add_location(span1, file$2, 505, 6, 14812);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, small);
    			append_dev(div, t1);
    			append_dev(div, button0);
    			append_dev(div, t3);
    			append_dev(div, button1);
    			append_dev(div, t5);
    			append_dev(div, button2);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, span0, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, span1, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_3*/ ctx[47], false, false, false),
    					listen_dev(button1, "click", /*click_handler_4*/ ctx[48], false, false, false),
    					listen_dev(button2, "click", /*click_handler_5*/ ctx[49], false, false, false),
    					listen_dev(span0, "click", /*click_handler_6*/ ctx[50], false, false, false),
    					listen_dev(span1, "click", /*click_handler_7*/ ctx[51], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(span1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(483:4) <ExpandableItem title=\\\"Misc\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div3;
    	let main;
    	let h1;
    	let t1;
    	let div0;
    	let label0;
    	let t3;
    	let label1;
    	let t5;
    	let textarea0;
    	let t6;
    	let textarea1;
    	let t7;
    	let span0;
    	let t8;
    	let t9;
    	let t10;
    	let t11;
    	let t12;
    	let t13;
    	let aside;
    	let div1;
    	let current_block_type_index;
    	let if_block3;
    	let t14;
    	let t15;
    	let expandableitem0;
    	let t16;
    	let expandableitem1;
    	let t17;
    	let expandableitem2;
    	let t18;
    	let div2;
    	let span1;
    	let t20;
    	let textarea2;
    	let t21;
    	let p;
    	let t22;
    	let t23;
    	let dialog;
    	let h3;
    	let t25;
    	let label2;
    	let t27;
    	let input;
    	let t28;
    	let br;
    	let t29;
    	let div4;
    	let small;
    	let t31;
    	let button0;
    	let t33;
    	let button1;
    	let t34;
    	let button1_disabled_value;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*uploading*/ ctx[12] && create_if_block_6(ctx);
    	let if_block1 = /*splitImages*/ ctx[22].length != /*splitUrls*/ ctx[23].length && create_if_block_5(ctx);
    	let if_block2 = /*splitImages*/ ctx[22].length > 0 && /*columnImages*/ ctx[0].length > 0 && !/*uploading*/ ctx[12] && create_if_block_4(ctx);
    	const if_block_creators = [create_if_block_2, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*connState*/ ctx[18] == null) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block3 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let if_block4 = /*connState*/ ctx[18] != null && create_if_block_1(ctx);

    	expandableitem0 = new ExpandableItem({
    			props: {
    				title: "Container",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	expandableitem1 = new ExpandableItem({
    			props: {
    				title: "Advanced",
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	expandableitem2 = new ExpandableItem({
    			props: {
    				title: "Misc",
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Multi-column images";
    			t1 = space();
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Images";
    			t3 = space();
    			label1 = element("label");
    			label1.textContent = "URLs";
    			t5 = space();
    			textarea0 = element("textarea");
    			t6 = space();
    			textarea1 = element("textarea");
    			t7 = space();
    			span0 = element("span");
    			t8 = text(/*colWidth*/ ctx[21]);
    			t9 = text("px");
    			t10 = space();
    			if (if_block0) if_block0.c();
    			t11 = space();
    			if (if_block1) if_block1.c();
    			t12 = space();
    			if (if_block2) if_block2.c();
    			t13 = space();
    			aside = element("aside");
    			div1 = element("div");
    			if_block3.c();
    			t14 = space();
    			if (if_block4) if_block4.c();
    			t15 = space();
    			create_component(expandableitem0.$$.fragment);
    			t16 = space();
    			create_component(expandableitem1.$$.fragment);
    			t17 = space();
    			create_component(expandableitem2.$$.fragment);
    			t18 = space();
    			div2 = element("div");
    			span1 = element("span");
    			span1.textContent = "Code";
    			t20 = space();
    			textarea2 = element("textarea");
    			t21 = space();
    			p = element("p");
    			t22 = text(/*columnCopiedToClipboardTxt*/ ctx[11]);
    			t23 = space();
    			dialog = element("dialog");
    			h3 = element("h3");
    			h3.textContent = "Connect";
    			t25 = space();
    			label2 = element("label");
    			label2.textContent = "API key";
    			t27 = space();
    			input = element("input");
    			t28 = space();
    			br = element("br");
    			t29 = space();
    			div4 = element("div");
    			small = element("small");
    			small.textContent = "Demo\n      API key";
    			t31 = space();
    			button0 = element("button");
    			button0.textContent = "Cancel";
    			t33 = space();
    			button1 = element("button");
    			t34 = text("Connect");
    			add_location(h1, file$2, 246, 4, 6419);
    			attr_dev(label0, "for", "inputImages");
    			attr_dev(label0, "class", "svelte-a9jl9f");
    			add_location(label0, file$2, 249, 6, 6478);
    			attr_dev(label1, "for", "inputUrls");
    			attr_dev(label1, "class", "svelte-a9jl9f");
    			add_location(label1, file$2, 250, 6, 6524);
    			textarea0.disabled = /*uploading*/ ctx[12];
    			attr_dev(textarea0, "id", "inputImages");
    			add_location(textarea0, file$2, 251, 6, 6566);
    			textarea1.disabled = /*uploading*/ ctx[12];
    			attr_dev(textarea1, "id", "inputUrls");
    			add_location(textarea1, file$2, 255, 6, 6673);
    			attr_dev(div0, "class", "flex");
    			add_location(div0, file$2, 248, 4, 6453);
    			add_location(span0, file$2, 258, 4, 6762);
    			add_location(main, file$2, 245, 2, 6408);
    			attr_dev(div1, "class", "item");
    			add_location(div1, file$2, 297, 4, 8035);
    			attr_dev(span1, "class", "section-title");
    			add_location(span1, file$2, 514, 6, 15509);
    			attr_dev(textarea2, "class", "output");
    			attr_dev(textarea2, "type", "text");
    			textarea2.readOnly = true;
    			add_location(textarea2, file$2, 516, 6, 15556);
    			attr_dev(p, "class", "copiedToClipboardTxt svelte-a9jl9f");
    			add_location(p, file$2, 524, 6, 15751);
    			attr_dev(div2, "class", "item");
    			add_location(div2, file$2, 513, 4, 15484);
    			attr_dev(aside, "class", "svelte-a9jl9f");
    			toggle_class(aside, "uploading", /*uploading*/ ctx[12]);
    			add_location(aside, file$2, 296, 2, 8007);
    			attr_dev(div3, "class", "sidebar-grid");
    			add_location(div3, file$2, 244, 0, 6379);
    			attr_dev(h3, "class", "svelte-a9jl9f");
    			add_location(h3, file$2, 530, 2, 15882);
    			attr_dev(label2, "for", "apiKeyTxt");
    			attr_dev(label2, "class", "svelte-a9jl9f");
    			add_location(label2, file$2, 532, 2, 15902);
    			set_style(input, "width", "20rem");
    			set_style(input, "font-family", "'Inconsolata', 'SF Mono', Menlo, Consolas, 'Courier New', Courier, monospace");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "apiKeyField");
    			attr_dev(input, "id", "apiKeyTxt");
    			add_location(input, file$2, 533, 2, 15943);
    			add_location(br, file$2, 540, 2, 16156);
    			set_style(small, "opacity", "0.6");
    			set_style(small, "cursor", "pointer");
    			set_style(small, "margin-right", "auto");
    			add_location(small, file$2, 544, 4, 16281);
    			add_location(button0, file$2, 549, 4, 16457);
    			button1.disabled = button1_disabled_value = /*apiKey*/ ctx[17].length < 1;
    			add_location(button1, file$2, 550, 4, 16523);
    			set_style(div4, "display", "flex");
    			set_style(div4, "gap", "4px");
    			set_style(div4, "justify-content", "flex-end");
    			set_style(div4, "align-items", "center");
    			set_style(div4, "margin-top", "0.5rem");
    			add_location(div4, file$2, 542, 2, 16166);
    			add_location(dialog, file$2, 529, 0, 15846);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, main);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t3);
    			append_dev(div0, label1);
    			append_dev(div0, t5);
    			append_dev(div0, textarea0);
    			set_input_value(textarea0, /*columnImages*/ ctx[0]);
    			append_dev(div0, t6);
    			append_dev(div0, textarea1);
    			set_input_value(textarea1, /*columnUrls*/ ctx[1]);
    			append_dev(main, t7);
    			append_dev(main, span0);
    			append_dev(span0, t8);
    			append_dev(span0, t9);
    			append_dev(main, t10);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t11);
    			if (if_block1) if_block1.m(main, null);
    			append_dev(main, t12);
    			if (if_block2) if_block2.m(main, null);
    			append_dev(div3, t13);
    			append_dev(div3, aside);
    			append_dev(aside, div1);
    			if_blocks[current_block_type_index].m(div1, null);
    			append_dev(aside, t14);
    			if (if_block4) if_block4.m(aside, null);
    			append_dev(aside, t15);
    			mount_component(expandableitem0, aside, null);
    			append_dev(aside, t16);
    			mount_component(expandableitem1, aside, null);
    			append_dev(aside, t17);
    			mount_component(expandableitem2, aside, null);
    			append_dev(aside, t18);
    			append_dev(aside, div2);
    			append_dev(div2, span1);
    			append_dev(div2, t20);
    			append_dev(div2, textarea2);
    			/*textarea2_binding*/ ctx[52](textarea2);
    			set_input_value(textarea2, /*columnOutputCode*/ ctx[24]);
    			append_dev(div2, t21);
    			append_dev(div2, p);
    			append_dev(p, t22);
    			insert_dev(target, t23, anchor);
    			insert_dev(target, dialog, anchor);
    			append_dev(dialog, h3);
    			append_dev(dialog, t25);
    			append_dev(dialog, label2);
    			append_dev(dialog, t27);
    			append_dev(dialog, input);
    			set_input_value(input, /*apiKey*/ ctx[17]);
    			append_dev(dialog, t28);
    			append_dev(dialog, br);
    			append_dev(dialog, t29);
    			append_dev(dialog, div4);
    			append_dev(div4, small);
    			append_dev(div4, t31);
    			append_dev(div4, button0);
    			append_dev(div4, t33);
    			append_dev(div4, button1);
    			append_dev(button1, t34);
    			/*dialog_binding*/ ctx[57](dialog);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(textarea0, "input", /*textarea0_input_handler*/ ctx[29]),
    					listen_dev(textarea1, "input", /*textarea1_input_handler*/ ctx[30]),
    					listen_dev(textarea2, "input", /*textarea2_input_handler*/ ctx[53]),
    					listen_dev(textarea2, "click", /*columnSelectCode*/ ctx[25], false, false, false),
    					listen_dev(input, "input", /*input_input_handler_1*/ ctx[54]),
    					listen_dev(small, "click", /*click_handler_8*/ ctx[55], false, false, false),
    					listen_dev(button0, "click", /*click_handler_9*/ ctx[56], false, false, false),
    					listen_dev(button1, "click", /*setUp*/ ctx[28], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*uploading*/ 4096) {
    				prop_dev(textarea0, "disabled", /*uploading*/ ctx[12]);
    			}

    			if (dirty[0] & /*columnImages*/ 1) {
    				set_input_value(textarea0, /*columnImages*/ ctx[0]);
    			}

    			if (!current || dirty[0] & /*uploading*/ 4096) {
    				prop_dev(textarea1, "disabled", /*uploading*/ ctx[12]);
    			}

    			if (dirty[0] & /*columnUrls*/ 2) {
    				set_input_value(textarea1, /*columnUrls*/ ctx[1]);
    			}

    			if (!current || dirty[0] & /*colWidth*/ 2097152) set_data_dev(t8, /*colWidth*/ ctx[21]);

    			if (/*uploading*/ ctx[12]) {
    				if (if_block0) {
    					if (dirty[0] & /*uploading*/ 4096) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_6(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(main, t11);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*splitImages*/ ctx[22].length != /*splitUrls*/ ctx[23].length) {
    				if (if_block1) {
    					if (dirty[0] & /*splitImages, splitUrls*/ 12582912) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_5(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(main, t12);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*splitImages*/ ctx[22].length > 0 && /*columnImages*/ ctx[0].length > 0 && !/*uploading*/ ctx[12]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*splitImages, columnImages, uploading*/ 4198401) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_4(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(main, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block3 = if_blocks[current_block_type_index];

    				if (!if_block3) {
    					if_block3 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block3.c();
    				}

    				transition_in(if_block3, 1);
    				if_block3.m(div1, null);
    			}

    			if (/*connState*/ ctx[18] != null) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);

    					if (dirty[0] & /*connState*/ 262144) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block_1(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(aside, t15);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}

    			const expandableitem0_changes = {};

    			if (dirty[0] & /*columnBetweenBorderStyle, columnBetweenBorderThickness, columnBetweenBorderColor, columnsHGap, columnBetweenBorderPaddingBottom, columnBetweenBorderPaddingTop, imagesPerRow, colWidth, maxWidth*/ 2164696 | dirty[2] & /*$$scope*/ 65536) {
    				expandableitem0_changes.$$scope = { dirty, ctx };
    			}

    			expandableitem0.$set(expandableitem0_changes);
    			const expandableitem1_changes = {};

    			if (dirty[0] & /*imageStyle, aStyle*/ 49152 | dirty[2] & /*$$scope*/ 65536) {
    				expandableitem1_changes.$$scope = { dirty, ctx };
    			}

    			expandableitem1.$set(expandableitem1_changes);
    			const expandableitem2_changes = {};

    			if (dirty[0] & /*columnImages, columnUrls*/ 3 | dirty[2] & /*$$scope*/ 65536) {
    				expandableitem2_changes.$$scope = { dirty, ctx };
    			}

    			expandableitem2.$set(expandableitem2_changes);

    			if (dirty[0] & /*columnOutputCode*/ 16777216) {
    				set_input_value(textarea2, /*columnOutputCode*/ ctx[24]);
    			}

    			if (!current || dirty[0] & /*columnCopiedToClipboardTxt*/ 2048) set_data_dev(t22, /*columnCopiedToClipboardTxt*/ ctx[11]);

    			if (dirty[0] & /*uploading*/ 4096) {
    				toggle_class(aside, "uploading", /*uploading*/ ctx[12]);
    			}

    			if (dirty[0] & /*apiKey*/ 131072 && input.value !== /*apiKey*/ ctx[17]) {
    				set_input_value(input, /*apiKey*/ ctx[17]);
    			}

    			if (!current || dirty[0] & /*apiKey*/ 131072 && button1_disabled_value !== (button1_disabled_value = /*apiKey*/ ctx[17].length < 1)) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(if_block4);
    			transition_in(expandableitem0.$$.fragment, local);
    			transition_in(expandableitem1.$$.fragment, local);
    			transition_in(expandableitem2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(if_block4);
    			transition_out(expandableitem0.$$.fragment, local);
    			transition_out(expandableitem1.$$.fragment, local);
    			transition_out(expandableitem2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if_blocks[current_block_type_index].d();
    			if (if_block4) if_block4.d();
    			destroy_component(expandableitem0);
    			destroy_component(expandableitem1);
    			destroy_component(expandableitem2);
    			/*textarea2_binding*/ ctx[52](null);
    			if (detaching) detach_dev(t23);
    			if (detaching) detach_dev(dialog);
    			/*dialog_binding*/ ctx[57](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	var Mailchimp = require("mailchimp-api-v3");
    	let columnImages = "";
    	let columnUrls = "";
    	let apiKeyDialog;
    	let imagesPerRow = 3;
    	let columnsHGap = 0;
    	let columnsVGap = 0;
    	let folderId = 0;
    	let newFolderName = "";
    	let columnBetweenBorderThickness = 0;
    	let columnBetweenBorderStyle = "solid";
    	let columnBetweenBorderColor = "#aaaaaa";
    	let columnBetweenBorderPaddingTop = 0;
    	let columnBetweenBorderPaddingBottom = 0;
    	let columnCopiedToClipboardTxt = "Click to copy";
    	let uploading = false;
    	let filesToUpload = [];
    	let folders = [];
    	let imageStyle = "display: block; width: {columnWidth}px; margin: {setGap}; padding: 0; line-height: 1;";
    	let aStyle = "text-decoration: none; margin: 0; padding: 0; display: block; line-height: 1;";
    	let maxWidth = 600;
    	let apiKey = "";
    	let connState;
    	let columnOutputTextArea;

    	const columnSelectCode = e => {
    		columnOutputTextArea.select();
    		columnOutputTextArea.setSelectionRange(0, 99999);
    		document.execCommand("copy");
    		$$invalidate(11, columnCopiedToClipboardTxt = "Copied to clipboard");
    		setTimeout(() => $$invalidate(11, columnCopiedToClipboardTxt = "Click to copy"), 2000);
    	};

    	let previewDebug = false;

    	const toBase64 = () => {
    		filesToUpload = [...uploadElement.files];

    		if (filesToUpload.length > 10) {
    			alert("Select up to 10 files!");
    			return;
    		}

    		$$invalidate(12, uploading = true);

    		for (let piece of chunk(filesToUpload, 10)) {
    			for (let file of piece) {
    				let reader = new FileReader();

    				reader.onloadend = async () => {
    					const readerResult = reader.result;
    					currentBase64 = readerResult.substring(reader.result.indexOf("base64,") + 7);
    					await doUpload(file.name, currentBase64);
    					filesToUpload.shift();

    					if (filesToUpload.length == 0) {
    						$$invalidate(20, uploadElement.value = "", uploadElement);
    						$$invalidate(12, uploading = false);
    					}
    				};

    				reader.readAsDataURL(file);
    			}
    		}
    	};

    	const getFolderList = async () => {
    		const mailChimp = new Mailchimp(apiKey);
    		let r = await mailChimp.get("/file-manager/folders");
    		console.log(r);
    		let tempFolders = [{ id: 0, name: "Main folder" }];

    		for (let folder of r.folders) {
    			tempFolders.push({ id: folder.id, name: folder.name });
    		}

    		$$invalidate(13, folders = [...tempFolders]);
    	};

    	const addFolder = async () => {
    		const mailChimp = new Mailchimp(apiKey);
    		let r = await mailChimp.post("/file-manager/folders", { name: newFolderName });
    		alert("Folder added!");
    		$$invalidate(5, newFolderName = "");
    		getFolderList();
    	};

    	const doUpload = async (fileName, fileBase64) => {
    		const mailChimp = new Mailchimp(apiKey);

    		let r = await mailChimp.post("/file-manager/files", {
    			folder_id: folderId,
    			name: fileName,
    			file_data: fileBase64
    		});

    		const newImageUrl = r.full_size_url;
    		$$invalidate(0, columnImages += newImageUrl);
    		$$invalidate(0, columnImages += "\n");
    		$$invalidate(1, columnUrls += "#");
    		$$invalidate(1, columnUrls += "\n");
    		currentBase64 = null;
    		currentFileName = null;
    	};

    	let uploadElement;
    	let currentBase64;
    	let currentFileName;

    	const testConnection = async e => {
    		const response = await client.ping.get();
    		$$invalidate(18, connState = "✔ connected");
    	};

    	const setUp = () => {
    		const mailchimp = new Mailchimp(apiKey);

    		mailchimp.get({ path: "/ping" }).then(r => {
    			if (r.statusCode === 200) {
    				$$invalidate(18, connState = "✔ connected");
    				apiKeyDialog.close();
    				getFolderList();
    			}
    		});
    	};

    	const chunk = (arr, chunkSize) => {
    		let R = [];
    		for (let i = 0, len = arr.length; i < len; i += chunkSize) R.push(arr.slice(i, i + chunkSize));
    		return R;
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<MultiColumn> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("MultiColumn", $$slots, []);

    	function textarea0_input_handler() {
    		columnImages = this.value;
    		$$invalidate(0, columnImages);
    	}

    	function textarea1_input_handler() {
    		columnUrls = this.value;
    		$$invalidate(1, columnUrls);
    	}

    	const click_handler = () => apiKeyDialog.showModal();

    	const click_handler_1 = () => {
    		$$invalidate(17, apiKey = "");
    		$$invalidate(18, connState = null);
    	};

    	function input_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			uploadElement = $$value;
    			$$invalidate(20, uploadElement);
    		});
    	}

    	function input_input_handler() {
    		newFolderName = this.value;
    		$$invalidate(5, newFolderName);
    	}

    	const click_handler_2 = () => addFolder();

    	function input0_change_input_handler() {
    		maxWidth = to_number(this.value);
    		$$invalidate(16, maxWidth);
    	}

    	function input1_change_input_handler() {
    		imagesPerRow = to_number(this.value);
    		$$invalidate(3, imagesPerRow);
    	}

    	function input2_change_input_handler() {
    		columnBetweenBorderPaddingTop = to_number(this.value);
    		$$invalidate(9, columnBetweenBorderPaddingTop);
    	}

    	function input3_change_input_handler() {
    		columnBetweenBorderPaddingBottom = to_number(this.value);
    		$$invalidate(10, columnBetweenBorderPaddingBottom);
    	}

    	function input4_change_input_handler() {
    		columnsHGap = to_number(this.value);
    		$$invalidate(4, columnsHGap);
    	}

    	function input5_change_input_handler() {
    		columnBetweenBorderThickness = to_number(this.value);
    		$$invalidate(6, columnBetweenBorderThickness);
    	}

    	function input0_input_handler() {
    		columnBetweenBorderColor = this.value;
    		$$invalidate(8, columnBetweenBorderColor);
    	}

    	function input1_input_handler() {
    		columnBetweenBorderColor = this.value;
    		$$invalidate(8, columnBetweenBorderColor);
    	}

    	function select_change_handler() {
    		columnBetweenBorderStyle = select_value(this);
    		$$invalidate(7, columnBetweenBorderStyle);
    	}

    	function input0_input_handler_1() {
    		aStyle = this.value;
    		$$invalidate(15, aStyle);
    	}

    	function input1_input_handler_1() {
    		imageStyle = this.value;
    		$$invalidate(14, imageStyle);
    	}

    	const click_handler_3 = () => $$invalidate(0, columnImages = "");
    	const click_handler_4 = () => $$invalidate(1, columnUrls = "");

    	const click_handler_5 = () => {
    		$$invalidate(0, columnImages = "");
    		$$invalidate(1, columnUrls = "");
    	};

    	const click_handler_6 = () => {
    		$$invalidate(0, columnImages += "\nhttps://yt3.ggpht.com/a/AATXAJzF-K41Fq96yE6jxs_fE6Hr7zvMXsQbqz1QNxGpjg=s88-c-k-c0xffffffff-no-rj-mo\nhttps://yt3.ggpht.com/a/AATXAJzF-K41Fq96yE6jxs_fE6Hr7zvMXsQbqz1QNxGpjg=s88-c-k-c0xffffffff-no-rj-mo");
    		$$invalidate(1, columnUrls += "\n#\n#");
    	};

    	const click_handler_7 = () => {
    		$$invalidate(0, columnImages += "\nhttps://yt3.ggpht.com/a/AATXAJzF-K41Fq96yE6jxs_fE6Hr7zvMXsQbqz1QNxGpjg=s88-c-k-c0xffffffff-no-rj-mo\nhttps://yt3.ggpht.com/a/AATXAJzF-K41Fq96yE6jxs_fE6Hr7zvMXsQbqz1QNxGpjg=s88-c-k-c0xffffffff-no-rj-mo\nhttps://yt3.ggpht.com/a/AATXAJzF-K41Fq96yE6jxs_fE6Hr7zvMXsQbqz1QNxGpjg=s88-c-k-c0xffffffff-no-rj-mo\nhttps://yt3.ggpht.com/a/AATXAJzF-K41Fq96yE6jxs_fE6Hr7zvMXsQbqz1QNxGpjg=s88-c-k-c0xffffffff-no-rj-mo");
    		$$invalidate(1, columnUrls += "\n#\n#\n#\n#");
    	};

    	function textarea2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			columnOutputTextArea = $$value;
    			$$invalidate(19, columnOutputTextArea);
    		});
    	}

    	function textarea2_input_handler() {
    		columnOutputCode = this.value;
    		((((((((((((((((((((($$invalidate(24, columnOutputCode), $$invalidate(63, columnItemsChunked)), $$invalidate(65, getColChildItems)), $$invalidate(66, columnBetweenBorder)), $$invalidate(62, columnItems)), $$invalidate(3, imagesPerRow)), $$invalidate(15, aStyle)), $$invalidate(61, parsedImageStyle)), $$invalidate(64, columnSeparatorTd)), $$invalidate(4, columnsHGap)), $$invalidate(9, columnBetweenBorderPaddingTop)), $$invalidate(6, columnBetweenBorderThickness)), $$invalidate(7, columnBetweenBorderStyle)), $$invalidate(8, columnBetweenBorderColor)), $$invalidate(10, columnBetweenBorderPaddingBottom)), $$invalidate(22, splitImages)), $$invalidate(23, splitUrls)), $$invalidate(14, imageStyle)), $$invalidate(21, colWidth)), $$invalidate(0, columnImages)), $$invalidate(1, columnUrls)), $$invalidate(16, maxWidth));
    	}

    	function input_input_handler_1() {
    		apiKey = this.value;
    		$$invalidate(17, apiKey);
    	}

    	const click_handler_8 = () => $$invalidate(17, apiKey = "be378ccde22c3aa784133ae1fe4ed5ec-us2");
    	const click_handler_9 = () => apiKeyDialog.close();

    	function dialog_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			apiKeyDialog = $$value;
    			$$invalidate(2, apiKeyDialog);
    		});
    	}

    	$$self.$capture_state = () => ({
    		slide,
    		ExpandableItem,
    		Mailchimp,
    		columnImages,
    		columnUrls,
    		apiKeyDialog,
    		imagesPerRow,
    		columnsHGap,
    		columnsVGap,
    		folderId,
    		newFolderName,
    		columnBetweenBorderThickness,
    		columnBetweenBorderStyle,
    		columnBetweenBorderColor,
    		columnBetweenBorderPaddingTop,
    		columnBetweenBorderPaddingBottom,
    		columnCopiedToClipboardTxt,
    		uploading,
    		filesToUpload,
    		folders,
    		imageStyle,
    		aStyle,
    		maxWidth,
    		apiKey,
    		connState,
    		columnOutputTextArea,
    		columnSelectCode,
    		previewDebug,
    		toBase64,
    		getFolderList,
    		addFolder,
    		doUpload,
    		uploadElement,
    		currentBase64,
    		currentFileName,
    		testConnection,
    		setUp,
    		chunk,
    		parsedImageStyle,
    		colWidth,
    		splitImages,
    		splitUrls,
    		columnItems,
    		columnItemsChunked,
    		columnSeparatorTd,
    		getColChildItems,
    		columnOutputCode,
    		columnBetweenBorder
    	});

    	$$self.$inject_state = $$props => {
    		if ("Mailchimp" in $$props) Mailchimp = $$props.Mailchimp;
    		if ("columnImages" in $$props) $$invalidate(0, columnImages = $$props.columnImages);
    		if ("columnUrls" in $$props) $$invalidate(1, columnUrls = $$props.columnUrls);
    		if ("apiKeyDialog" in $$props) $$invalidate(2, apiKeyDialog = $$props.apiKeyDialog);
    		if ("imagesPerRow" in $$props) $$invalidate(3, imagesPerRow = $$props.imagesPerRow);
    		if ("columnsHGap" in $$props) $$invalidate(4, columnsHGap = $$props.columnsHGap);
    		if ("columnsVGap" in $$props) columnsVGap = $$props.columnsVGap;
    		if ("folderId" in $$props) folderId = $$props.folderId;
    		if ("newFolderName" in $$props) $$invalidate(5, newFolderName = $$props.newFolderName);
    		if ("columnBetweenBorderThickness" in $$props) $$invalidate(6, columnBetweenBorderThickness = $$props.columnBetweenBorderThickness);
    		if ("columnBetweenBorderStyle" in $$props) $$invalidate(7, columnBetweenBorderStyle = $$props.columnBetweenBorderStyle);
    		if ("columnBetweenBorderColor" in $$props) $$invalidate(8, columnBetweenBorderColor = $$props.columnBetweenBorderColor);
    		if ("columnBetweenBorderPaddingTop" in $$props) $$invalidate(9, columnBetweenBorderPaddingTop = $$props.columnBetweenBorderPaddingTop);
    		if ("columnBetweenBorderPaddingBottom" in $$props) $$invalidate(10, columnBetweenBorderPaddingBottom = $$props.columnBetweenBorderPaddingBottom);
    		if ("columnCopiedToClipboardTxt" in $$props) $$invalidate(11, columnCopiedToClipboardTxt = $$props.columnCopiedToClipboardTxt);
    		if ("uploading" in $$props) $$invalidate(12, uploading = $$props.uploading);
    		if ("filesToUpload" in $$props) filesToUpload = $$props.filesToUpload;
    		if ("folders" in $$props) $$invalidate(13, folders = $$props.folders);
    		if ("imageStyle" in $$props) $$invalidate(14, imageStyle = $$props.imageStyle);
    		if ("aStyle" in $$props) $$invalidate(15, aStyle = $$props.aStyle);
    		if ("maxWidth" in $$props) $$invalidate(16, maxWidth = $$props.maxWidth);
    		if ("apiKey" in $$props) $$invalidate(17, apiKey = $$props.apiKey);
    		if ("connState" in $$props) $$invalidate(18, connState = $$props.connState);
    		if ("columnOutputTextArea" in $$props) $$invalidate(19, columnOutputTextArea = $$props.columnOutputTextArea);
    		if ("previewDebug" in $$props) previewDebug = $$props.previewDebug;
    		if ("uploadElement" in $$props) $$invalidate(20, uploadElement = $$props.uploadElement);
    		if ("currentBase64" in $$props) currentBase64 = $$props.currentBase64;
    		if ("currentFileName" in $$props) currentFileName = $$props.currentFileName;
    		if ("parsedImageStyle" in $$props) $$invalidate(61, parsedImageStyle = $$props.parsedImageStyle);
    		if ("colWidth" in $$props) $$invalidate(21, colWidth = $$props.colWidth);
    		if ("splitImages" in $$props) $$invalidate(22, splitImages = $$props.splitImages);
    		if ("splitUrls" in $$props) $$invalidate(23, splitUrls = $$props.splitUrls);
    		if ("columnItems" in $$props) $$invalidate(62, columnItems = $$props.columnItems);
    		if ("columnItemsChunked" in $$props) $$invalidate(63, columnItemsChunked = $$props.columnItemsChunked);
    		if ("columnSeparatorTd" in $$props) $$invalidate(64, columnSeparatorTd = $$props.columnSeparatorTd);
    		if ("getColChildItems" in $$props) $$invalidate(65, getColChildItems = $$props.getColChildItems);
    		if ("columnOutputCode" in $$props) $$invalidate(24, columnOutputCode = $$props.columnOutputCode);
    		if ("columnBetweenBorder" in $$props) $$invalidate(66, columnBetweenBorder = $$props.columnBetweenBorder);
    	};

    	let parsedImageStyle;
    	let splitImages;
    	let splitUrls;
    	let colWidth;
    	let columnItems;
    	let columnItemsChunked;
    	let columnSeparatorTd;
    	let getColChildItems;
    	let columnOutputCode;
    	let columnBetweenBorder;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*maxWidth, imagesPerRow, columnsHGap*/ 65560) {
    			 $$invalidate(21, colWidth = Math.floor((maxWidth - (imagesPerRow - 1) * columnsHGap) / imagesPerRow));
    		}

    		if ($$self.$$.dirty[0] & /*imageStyle, colWidth*/ 2113536) {
    			 $$invalidate(61, parsedImageStyle = imageStyle.replace("{columnWidth}", colWidth));
    		}

    		if ($$self.$$.dirty[0] & /*columnImages*/ 1) {
    			 $$invalidate(22, splitImages = columnImages.trimEnd().split("\n"));
    		}

    		if ($$self.$$.dirty[0] & /*columnUrls*/ 2) {
    			 $$invalidate(23, splitUrls = columnUrls.trimEnd().split("\n"));
    		}

    		if ($$self.$$.dirty[0] & /*splitImages, splitUrls*/ 12582912) {
    			 $$invalidate(62, columnItems = splitImages.map(i => {
    				let index = splitImages.indexOf(i);
    				return { image: i, url: splitUrls[index] };
    			}));
    		}

    		if ($$self.$$.dirty[0] & /*imagesPerRow*/ 8 | $$self.$$.dirty[2] & /*columnItems*/ 1) {
    			 $$invalidate(63, columnItemsChunked = new Array(Math.ceil(columnItems.length / imagesPerRow)).fill().map((_, i) => columnItems.slice(i * imagesPerRow, i * imagesPerRow + imagesPerRow)));
    		}

    		if ($$self.$$.dirty[0] & /*columnsHGap*/ 16) {
    			 $$invalidate(64, columnSeparatorTd = columnsHGap > 0
    			? `<td style="padding: 0; margin: 0; border: 0; padding: 0 ${columnsHGap}px 0 0;"></td>`
    			: "");
    		}

    		if ($$self.$$.dirty[0] & /*aStyle*/ 32768 | $$self.$$.dirty[1] & /*parsedImageStyle*/ 1073741824 | $$self.$$.dirty[2] & /*columnSeparatorTd*/ 4) {
    			 $$invalidate(65, getColChildItems = source => source.map(item => `<td style="border: 0; padding: 0; margin: 0;">\n\t<a href="${item.url}" style="${aStyle}">\n\t\t<img src="${item.image}" style="padding: 0; margin: 0; display: block; ${parsedImageStyle}" />
      </a></td>`).join(`${columnSeparatorTd}\n`));
    		}

    		if ($$self.$$.dirty[0] & /*columnsHGap, imagesPerRow, columnBetweenBorderPaddingTop, columnBetweenBorderThickness, columnBetweenBorderStyle, columnBetweenBorderColor, columnBetweenBorderPaddingBottom*/ 2008) {
    			 $$invalidate(66, columnBetweenBorder = `\n<tr style="border: 0; padding: 0; margin: 0;"><td colspan="${columnsHGap > 0
			? imagesPerRow + (imagesPerRow - 1)
			: imagesPerRow}" style="padding: 0; padding-top: ${columnBetweenBorderPaddingTop}px; height: 0; ${columnBetweenBorderThickness > 0
			? `border-bottom: ${columnBetweenBorderThickness}px ${columnBetweenBorderStyle} ${columnBetweenBorderColor};`
			: "border: 0;"}"></td></tr><tr style="border: 0; padding: 0; margin: 0;"><td colspan="${imagesPerRow}" style="padding: 0; padding-top: ${columnBetweenBorderPaddingBottom}px; height: 0; border: 0;}"></td></tr>`);
    		}

    		if ($$self.$$.dirty[2] & /*columnItemsChunked, getColChildItems, columnBetweenBorder*/ 26) {
    			 $$invalidate(24, columnOutputCode = "<div class=\"mcnTextContent\" style=\"text-align: center; margin: 0; padding: 0; line-height: 0;\"><table style=\"border-collapse: collapse; margin: 0; padding: 0;\">" + columnItemsChunked.map(item => `<tr style="border: 0; padding: 0; margin: 0;">\n${getColChildItems(item)}\n</tr>`).join(`${columnBetweenBorder}\n`) + "</table></div>");
    		}
    	};

    	return [
    		columnImages,
    		columnUrls,
    		apiKeyDialog,
    		imagesPerRow,
    		columnsHGap,
    		newFolderName,
    		columnBetweenBorderThickness,
    		columnBetweenBorderStyle,
    		columnBetweenBorderColor,
    		columnBetweenBorderPaddingTop,
    		columnBetweenBorderPaddingBottom,
    		columnCopiedToClipboardTxt,
    		uploading,
    		folders,
    		imageStyle,
    		aStyle,
    		maxWidth,
    		apiKey,
    		connState,
    		columnOutputTextArea,
    		uploadElement,
    		colWidth,
    		splitImages,
    		splitUrls,
    		columnOutputCode,
    		columnSelectCode,
    		toBase64,
    		addFolder,
    		setUp,
    		textarea0_input_handler,
    		textarea1_input_handler,
    		click_handler,
    		click_handler_1,
    		input_binding,
    		input_input_handler,
    		click_handler_2,
    		input0_change_input_handler,
    		input1_change_input_handler,
    		input2_change_input_handler,
    		input3_change_input_handler,
    		input4_change_input_handler,
    		input5_change_input_handler,
    		input0_input_handler,
    		input1_input_handler,
    		select_change_handler,
    		input0_input_handler_1,
    		input1_input_handler_1,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		textarea2_binding,
    		textarea2_input_handler,
    		input_input_handler_1,
    		click_handler_8,
    		click_handler_9,
    		dialog_binding
    	];
    }

    class MultiColumn extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {}, [-1, -1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MultiColumn",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.24.1 */
    const file$3 = "src/App.svelte";

    // (152:4) {#if process.platform === 'darwin'}
    function create_if_block_3$1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "✗";
    			set_style(button, "margin-right", "0.25rem");
    			attr_dev(button, "class", "macCloseBtn svelte-1g2vejw");
    			add_location(button, file$3, 152, 6, 3118);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(152:4) {#if process.platform === 'darwin'}",
    		ctx
    	});

    	return block;
    }

    // (168:4) {#if process.platform !== 'darwin'}
    function create_if_block_2$1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "×";
    			attr_dev(button, "class", "winCloseBtn svelte-1g2vejw");
    			add_location(button, file$3, 168, 6, 3581);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_3*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(168:4) {#if process.platform !== 'darwin'}",
    		ctx
    	});

    	return block;
    }

    // (178:31) 
    function create_if_block_1$1(ctx) {
    	let div;
    	let buttongenerator;
    	let div_transition;
    	let current;
    	buttongenerator = new ButtonGenerator({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(buttongenerator.$$.fragment);
    			add_location(div, file$3, 178, 6, 3861);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(buttongenerator, div, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(buttongenerator.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, slide, { duration: 250, x: 250, y: 0 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(buttongenerator.$$.fragment, local);
    			if (!div_transition) div_transition = create_bidirectional_transition(div, slide, { duration: 250, x: 250, y: 0 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(buttongenerator);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(178:31) ",
    		ctx
    	});

    	return block;
    }

    // (174:4) {#if currentPage == 1}
    function create_if_block$2(ctx) {
    	let div;
    	let multicolumn;
    	let div_transition;
    	let current;
    	multicolumn = new MultiColumn({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(multicolumn.$$.fragment);
    			add_location(div, file$3, 174, 6, 3729);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(multicolumn, div, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(multicolumn.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, slide, { duration: 250, x: 250, y: 0 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(multicolumn.$$.fragment, local);
    			if (!div_transition) div_transition = create_bidirectional_transition(div, slide, { duration: 250, x: 250, y: 0 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(multicolumn);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(174:4) {#if currentPage == 1}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div2;
    	let div0;
    	let t0;
    	let button0;
    	let t2;
    	let button1;
    	let t4;
    	let t5;
    	let div1;
    	let current_block_type_index;
    	let if_block2;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = process.platform === "darwin" && create_if_block_3$1(ctx);
    	let if_block1 = process.platform !== "darwin" && create_if_block_2$1(ctx);
    	const if_block_creators = [create_if_block$2, create_if_block_1$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*currentPage*/ ctx[0] == 1) return 0;
    		if (/*currentPage*/ ctx[0] == 2) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block2 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			button0 = element("button");
    			button0.textContent = "Multi-column images";
    			t2 = space();
    			button1 = element("button");
    			button1.textContent = "Button generator";
    			t4 = space();
    			if (if_block1) if_block1.c();
    			t5 = space();
    			div1 = element("div");
    			if (if_block2) if_block2.c();
    			attr_dev(button0, "class", "tabBtn svelte-1g2vejw");
    			toggle_class(button0, "active", /*currentPage*/ ctx[0] == 1);
    			add_location(button0, file$3, 158, 4, 3259);
    			attr_dev(button1, "class", "tabBtn svelte-1g2vejw");
    			toggle_class(button1, "active", /*currentPage*/ ctx[0] == 2);
    			add_location(button1, file$3, 162, 4, 3400);
    			attr_dev(div0, "class", "sidebar svelte-1g2vejw");
    			add_location(div0, file$3, 150, 2, 3050);
    			attr_dev(div1, "class", "content svelte-1g2vejw");
    			add_location(div1, file$3, 172, 2, 3674);
    			attr_dev(div2, "class", "grid svelte-1g2vejw");
    			add_location(div2, file$3, 149, 0, 3029);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div0, t0);
    			append_dev(div0, button0);
    			append_dev(div0, t2);
    			append_dev(div0, button1);
    			append_dev(div0, t4);
    			if (if_block1) if_block1.m(div0, null);
    			append_dev(div2, t5);
    			append_dev(div2, div1);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div1, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_1*/ ctx[2], false, false, false),
    					listen_dev(button1, "click", /*click_handler_2*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (process.platform === "darwin") if_block0.p(ctx, dirty);

    			if (dirty & /*currentPage*/ 1) {
    				toggle_class(button0, "active", /*currentPage*/ ctx[0] == 1);
    			}

    			if (dirty & /*currentPage*/ 1) {
    				toggle_class(button1, "active", /*currentPage*/ ctx[0] == 2);
    			}

    			if (process.platform !== "darwin") if_block1.p(ctx, dirty);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				if (if_block2) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block2 = if_blocks[current_block_type_index];

    					if (!if_block2) {
    						if_block2 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block2.c();
    					}

    					transition_in(if_block2, 1);
    					if_block2.m(div1, null);
    				} else {
    					if_block2 = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let currentPage = 1;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	const click_handler = () => window.close();
    	const click_handler_1 = () => $$invalidate(0, currentPage = 1);
    	const click_handler_2 = () => $$invalidate(0, currentPage = 2);
    	const click_handler_3 = () => window.close();

    	$$self.$capture_state = () => ({
    		slide,
    		ButtonGenerator,
    		MultiColumn,
    		currentPage
    	});

    	$$self.$inject_state = $$props => {
    		if ("currentPage" in $$props) $$invalidate(0, currentPage = $$props.currentPage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [currentPage, click_handler, click_handler_1, click_handler_2, click_handler_3];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
