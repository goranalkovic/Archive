
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
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
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
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

    /* src\ButtonGenerator.svelte generated by Svelte v3.24.1 */

    const { Object: Object_1 } = globals;
    const file = "src\\ButtonGenerator.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[55] = list[i][0];
    	child_ctx[56] = list[i][1];
    	child_ctx[58] = i;
    	return child_ctx;
    }

    // (162:0) {#if btnContrastLevel < 4.5}
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
    			add_location(label, file, 163, 4, 4919);
    			attr_dev(small, "class", "warning");
    			add_location(small, file, 164, 4, 4944);
    			attr_dev(div, "class", "ctrl-flex");
    			add_location(div, file, 162, 2, 4874);
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
    		source: "(162:0) {#if btnContrastLevel < 4.5}",
    		ctx
    	});

    	return block;
    }

    // (205:4) {#each Object.entries(fonts) as [key, value], i}
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
    			add_location(option, file, 205, 6, 5909);
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
    		source: "(205:4) {#each Object.entries(fonts) as [key, value], i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let h1;
    	let t1;
    	let h30;
    	let t3;
    	let div0;
    	let label0;
    	let t5;
    	let label1;
    	let t7;
    	let textarea0;
    	let t8;
    	let textarea1;
    	let t9;
    	let h31;
    	let t11;
    	let textarea2;
    	let textarea2_transition;
    	let t12;
    	let p;
    	let t13;
    	let p_transition;
    	let t14;
    	let h32;
    	let t16;
    	let div1;
    	let t17;
    	let h33;
    	let t19;
    	let div2;
    	let label2;
    	let t21;
    	let select0;
    	let option0;
    	let option1;
    	let option2;
    	let t25;
    	let div3;
    	let label3;
    	let t27;
    	let small0;
    	let t29;
    	let input0;
    	let t30;
    	let small1;
    	let t32;
    	let small2;
    	let t34;
    	let input1;
    	let t35;
    	let small3;
    	let t37;
    	let h34;
    	let t39;
    	let div4;
    	let label4;
    	let i;
    	let t41;
    	let a;
    	let t42;
    	let t43;
    	let t44;
    	let div5;
    	let label5;
    	let t46;
    	let input2;
    	let t47;
    	let input3;
    	let t48;
    	let div6;
    	let label6;
    	let t50;
    	let input4;
    	let t51;
    	let input5;
    	let input5_pattern_value;
    	let t52;
    	let div7;
    	let label7;
    	let t54;
    	let select1;
    	let t55;
    	let button0;
    	let t57;
    	let button1;
    	let t59;
    	let div8;
    	let label8;
    	let t61;
    	let input6;
    	let t62;
    	let small4;
    	let t64;
    	let div9;
    	let label9;
    	let t66;
    	let small5;
    	let t68;
    	let input7;
    	let t69;
    	let small6;
    	let t71;
    	let small7;
    	let t73;
    	let input8;
    	let t74;
    	let small8;
    	let t76;
    	let div10;
    	let label10;
    	let t78;
    	let input9;
    	let t79;
    	let code0;
    	let t80;
    	let t81;
    	let t82;
    	let div11;
    	let label11;
    	let t84;
    	let input10;
    	let t85;
    	let code1;

    	let t86_value = (/*buttonWidth*/ ctx[12] >= 0
    	? `${/*buttonWidth*/ ctx[12]}%`
    	: "Automatic") + "";

    	let t86;
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
    			h1 = element("h1");
    			h1.textContent = "Button generator";
    			t1 = space();
    			h30 = element("h3");
    			h30.textContent = "Links";
    			t3 = space();
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Captions";
    			t5 = space();
    			label1 = element("label");
    			label1.textContent = "URLs";
    			t7 = space();
    			textarea0 = element("textarea");
    			t8 = space();
    			textarea1 = element("textarea");
    			t9 = space();
    			h31 = element("h3");
    			h31.textContent = "Code";
    			t11 = space();
    			textarea2 = element("textarea");
    			t12 = space();
    			p = element("p");
    			t13 = text(/*btnCopiedToClipboardTxt*/ ctx[16]);
    			t14 = space();
    			h32 = element("h3");
    			h32.textContent = "Preview";
    			t16 = space();
    			div1 = element("div");
    			t17 = space();
    			h33 = element("h3");
    			h33.textContent = "Container style";
    			t19 = space();
    			div2 = element("div");
    			label2 = element("label");
    			label2.textContent = "Alignment";
    			t21 = space();
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "Left";
    			option1 = element("option");
    			option1.textContent = "Center";
    			option2 = element("option");
    			option2.textContent = "Right";
    			t25 = space();
    			div3 = element("div");
    			label3 = element("label");
    			label3.textContent = "Margin";
    			t27 = space();
    			small0 = element("small");
    			small0.textContent = "↔";
    			t29 = space();
    			input0 = element("input");
    			t30 = space();
    			small1 = element("small");
    			small1.textContent = "px";
    			t32 = space();
    			small2 = element("small");
    			small2.textContent = "↕";
    			t34 = space();
    			input1 = element("input");
    			t35 = space();
    			small3 = element("small");
    			small3.textContent = "px";
    			t37 = space();
    			h34 = element("h3");
    			h34.textContent = "Button style";
    			t39 = space();
    			div4 = element("div");
    			label4 = element("label");
    			i = element("i");
    			i.textContent = "Preview";
    			t41 = space();
    			a = element("a");
    			t42 = text("Sample button");
    			t43 = space();
    			if (if_block) if_block.c();
    			t44 = space();
    			div5 = element("div");
    			label5 = element("label");
    			label5.textContent = "Background color";
    			t46 = space();
    			input2 = element("input");
    			t47 = space();
    			input3 = element("input");
    			t48 = space();
    			div6 = element("div");
    			label6 = element("label");
    			label6.textContent = "Text color";
    			t50 = space();
    			input4 = element("input");
    			t51 = space();
    			input5 = element("input");
    			t52 = space();
    			div7 = element("div");
    			label7 = element("label");
    			label7.textContent = "Font";
    			t54 = space();
    			select1 = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t55 = space();
    			button0 = element("button");
    			button0.textContent = "Bold";
    			t57 = space();
    			button1 = element("button");
    			button1.textContent = "Italic";
    			t59 = space();
    			div8 = element("div");
    			label8 = element("label");
    			label8.textContent = "Padding";
    			t61 = space();
    			input6 = element("input");
    			t62 = space();
    			small4 = element("small");
    			small4.textContent = "px";
    			t64 = space();
    			div9 = element("div");
    			label9 = element("label");
    			label9.textContent = "Margin";
    			t66 = space();
    			small5 = element("small");
    			small5.textContent = "↔";
    			t68 = space();
    			input7 = element("input");
    			t69 = space();
    			small6 = element("small");
    			small6.textContent = "px";
    			t71 = space();
    			small7 = element("small");
    			small7.textContent = "↕";
    			t73 = space();
    			input8 = element("input");
    			t74 = space();
    			small8 = element("small");
    			small8.textContent = "px";
    			t76 = space();
    			div10 = element("div");
    			label10 = element("label");
    			label10.textContent = "Corner radius";
    			t78 = space();
    			input9 = element("input");
    			t79 = space();
    			code0 = element("code");
    			t80 = text(/*borderRadius*/ ctx[7]);
    			t81 = text(" px");
    			t82 = space();
    			div11 = element("div");
    			label11 = element("label");
    			label11.textContent = "Button width (%)";
    			t84 = space();
    			input10 = element("input");
    			t85 = space();
    			code1 = element("code");
    			t86 = text(t86_value);
    			add_location(h1, file, 101, 0, 3252);
    			add_location(h30, file, 103, 0, 3279);
    			attr_dev(label0, "for", "captions");
    			add_location(label0, file, 106, 2, 3316);
    			attr_dev(label1, "for", "urls");
    			add_location(label1, file, 107, 2, 3357);
    			attr_dev(textarea0, "id", "captions");
    			add_location(textarea0, file, 109, 2, 3391);
    			attr_dev(textarea1, "id", "urls");
    			add_location(textarea1, file, 110, 2, 3448);
    			attr_dev(div0, "class", "flex");
    			add_location(div0, file, 105, 0, 3295);
    			add_location(h31, file, 113, 0, 3503);
    			set_style(textarea2, "height", "auto");
    			set_style(textarea2, "min-height", "6rem");
    			attr_dev(textarea2, "class", "output");
    			attr_dev(textarea2, "type", "text");
    			textarea2.readOnly = true;
    			add_location(textarea2, file, 115, 0, 3518);
    			attr_dev(p, "class", "copiedToClipboardTxt");
    			add_location(p, file, 125, 0, 3731);
    			add_location(h32, file, 127, 0, 3811);
    			attr_dev(div1, "class", "preview");
    			add_location(div1, file, 129, 0, 3829);
    			set_style(h33, "margin-top", "2rem");
    			add_location(h33, file, 133, 0, 3886);
    			attr_dev(label2, "for", "containerAlign");
    			add_location(label2, file, 136, 2, 3964);
    			option0.__value = "left";
    			option0.value = option0.__value;
    			add_location(option0, file, 138, 4, 4077);
    			option1.__value = "center";
    			option1.value = option1.__value;
    			add_location(option1, file, 139, 4, 4116);
    			option2.__value = "right";
    			option2.value = option2.__value;
    			add_location(option2, file, 140, 4, 4159);
    			attr_dev(select0, "id", "containerAlign");
    			if (/*containerTextAlign*/ ctx[11] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[27].call(select0));
    			add_location(select0, file, 137, 2, 4012);
    			attr_dev(div2, "class", "ctrl-flex");
    			add_location(div2, file, 135, 0, 3938);
    			attr_dev(label3, "for", "_");
    			add_location(label3, file, 145, 2, 4242);
    			set_style(small0, "margin-right", "-0.8rem");
    			add_location(small0, file, 146, 2, 4274);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "min", "0");
    			attr_dev(input0, "max", "100");
    			add_location(input0, file, 147, 2, 4323);
    			set_style(small1, "margin-left", "-0.8rem");
    			add_location(small1, file, 148, 2, 4397);
    			set_style(small2, "margin-right", "-0.8rem");
    			add_location(small2, file, 149, 2, 4446);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "min", "0");
    			attr_dev(input1, "max", "100");
    			add_location(input1, file, 150, 2, 4495);
    			set_style(small3, "margin-left", "-0.8rem");
    			add_location(small3, file, 151, 2, 4569);
    			attr_dev(div3, "class", "ctrl-flex");
    			add_location(div3, file, 144, 0, 4216);
    			set_style(h34, "margin-top", "2rem");
    			add_location(h34, file, 154, 0, 4624);
    			add_location(i, file, 157, 19, 4744);
    			attr_dev(label4, "for", "___");
    			add_location(label4, file, 157, 2, 4727);
    			attr_dev(a, "href", ".");
    			attr_dev(a, "style", /*buttonStyle*/ ctx[18]);
    			attr_dev(a, "target", "_blank");
    			add_location(a, file, 158, 2, 4769);
    			attr_dev(div4, "class", "ctrl-flex");
    			set_style(div4, "margin-bottom", "2rem");
    			add_location(div4, file, 156, 0, 4673);
    			attr_dev(label5, "for", "bgColor");
    			add_location(label5, file, 169, 2, 5070);
    			attr_dev(input2, "type", "color");
    			attr_dev(input2, "id", "bgColor");
    			add_location(input2, file, 170, 2, 5118);
    			set_style(input3, "width", "5rem");
    			attr_dev(input3, "type", "text");
    			attr_dev(input3, "maxlength", "7");
    			attr_dev(input3, "minlength", "7");
    			add_location(input3, file, 175, 2, 5225);
    			attr_dev(div5, "class", "ctrl-flex");
    			add_location(div5, file, 168, 0, 5044);
    			attr_dev(label6, "for", "txtColor");
    			add_location(label6, file, 185, 2, 5406);
    			attr_dev(input4, "type", "color");
    			attr_dev(input4, "id", "txtColor");
    			attr_dev(input4, "maxlength", "7");
    			attr_dev(input4, "minlength", "7");
    			add_location(input4, file, 186, 2, 5449);
    			set_style(input5, "width", "5rem");
    			attr_dev(input5, "type", "text");
    			attr_dev(input5, "pattern", input5_pattern_value = "#." + 6);
    			add_location(input5, file, 193, 2, 5595);
    			attr_dev(div6, "class", "ctrl-flex");
    			add_location(div6, file, 184, 0, 5380);
    			attr_dev(label7, "for", "fontFamily");
    			add_location(label7, file, 202, 2, 5762);
    			attr_dev(select1, "name", "font");
    			attr_dev(select1, "id", "font");
    			if (/*font*/ ctx[8] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[38].call(select1));
    			add_location(select1, file, 203, 2, 5801);
    			attr_dev(button0, "class", "toggleBtn");
    			toggle_class(button0, "toggled", /*isBold*/ ctx[9]);
    			add_location(button0, file, 212, 2, 6108);
    			attr_dev(button1, "class", "toggleBtn");
    			toggle_class(button1, "toggled", /*isItalic*/ ctx[10]);
    			add_location(button1, file, 216, 2, 6221);
    			attr_dev(div7, "class", "ctrl-flex");
    			add_location(div7, file, 201, 0, 5736);
    			attr_dev(label8, "for", "padding");
    			add_location(label8, file, 223, 2, 6374);
    			attr_dev(input6, "type", "number");
    			attr_dev(input6, "min", "0");
    			attr_dev(input6, "max", "100");
    			attr_dev(input6, "id", "padding");
    			add_location(input6, file, 224, 2, 6413);
    			set_style(small4, "margin-left", "-0.8rem");
    			add_location(small4, file, 225, 2, 6491);
    			attr_dev(div8, "class", "ctrl-flex");
    			add_location(div8, file, 222, 0, 6348);
    			attr_dev(label9, "for", "__");
    			add_location(label9, file, 229, 2, 6572);
    			set_style(small5, "margin-right", "-0.8rem");
    			add_location(small5, file, 230, 2, 6605);
    			attr_dev(input7, "type", "number");
    			attr_dev(input7, "min", "0");
    			attr_dev(input7, "max", "100");
    			add_location(input7, file, 231, 2, 6654);
    			set_style(small6, "margin-left", "-0.8rem");
    			add_location(small6, file, 232, 2, 6725);
    			set_style(small7, "margin-right", "-0.8rem");
    			add_location(small7, file, 233, 2, 6774);
    			attr_dev(input8, "type", "number");
    			attr_dev(input8, "min", "0");
    			attr_dev(input8, "max", "100");
    			add_location(input8, file, 234, 2, 6823);
    			set_style(small8, "margin-left", "-0.8rem");
    			add_location(small8, file, 235, 2, 6894);
    			attr_dev(div9, "class", "ctrl-flex");
    			add_location(div9, file, 228, 0, 6546);
    			attr_dev(label10, "for", "borderRadius");
    			add_location(label10, file, 239, 2, 6975);
    			attr_dev(input9, "type", "range");
    			attr_dev(input9, "min", "0");
    			attr_dev(input9, "max", "50");
    			attr_dev(input9, "id", "borderRadius");
    			add_location(input9, file, 240, 2, 7025);
    			add_location(code0, file, 246, 2, 7131);
    			attr_dev(div10, "class", "ctrl-flex");
    			add_location(div10, file, 238, 0, 6949);
    			attr_dev(label11, "for", "btnWidth");
    			add_location(label11, file, 250, 2, 7196);
    			attr_dev(input10, "type", "range");
    			attr_dev(input10, "min", "-1");
    			attr_dev(input10, "max", "100");
    			attr_dev(input10, "id", "btnWidth");
    			add_location(input10, file, 252, 2, 7246);
    			add_location(code1, file, 258, 2, 7349);
    			attr_dev(div11, "class", "ctrl-flex");
    			add_location(div11, file, 249, 0, 7170);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h30, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, label0);
    			append_dev(div0, t5);
    			append_dev(div0, label1);
    			append_dev(div0, t7);
    			append_dev(div0, textarea0);
    			set_input_value(textarea0, /*buttonCaptions*/ ctx[13]);
    			append_dev(div0, t8);
    			append_dev(div0, textarea1);
    			set_input_value(textarea1, /*buttonUrls*/ ctx[14]);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, h31, anchor);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, textarea2, anchor);
    			/*textarea2_binding*/ ctx[25](textarea2);
    			set_input_value(textarea2, /*buttonOutputCode*/ ctx[19]);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, p, anchor);
    			append_dev(p, t13);
    			insert_dev(target, t14, anchor);
    			insert_dev(target, h32, anchor);
    			insert_dev(target, t16, anchor);
    			insert_dev(target, div1, anchor);
    			div1.innerHTML = /*buttonOutputCode*/ ctx[19];
    			insert_dev(target, t17, anchor);
    			insert_dev(target, h33, anchor);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, label2);
    			append_dev(div2, t21);
    			append_dev(div2, select0);
    			append_dev(select0, option0);
    			append_dev(select0, option1);
    			append_dev(select0, option2);
    			select_option(select0, /*containerTextAlign*/ ctx[11]);
    			insert_dev(target, t25, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, label3);
    			append_dev(div3, t27);
    			append_dev(div3, small0);
    			append_dev(div3, t29);
    			append_dev(div3, input0);
    			set_input_value(input0, /*containerMarginH*/ ctx[4]);
    			append_dev(div3, t30);
    			append_dev(div3, small1);
    			append_dev(div3, t32);
    			append_dev(div3, small2);
    			append_dev(div3, t34);
    			append_dev(div3, input1);
    			set_input_value(input1, /*containerMarginV*/ ctx[3]);
    			append_dev(div3, t35);
    			append_dev(div3, small3);
    			insert_dev(target, t37, anchor);
    			insert_dev(target, h34, anchor);
    			insert_dev(target, t39, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, label4);
    			append_dev(label4, i);
    			append_dev(div4, t41);
    			append_dev(div4, a);
    			append_dev(a, t42);
    			insert_dev(target, t43, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t44, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, label5);
    			append_dev(div5, t46);
    			append_dev(div5, input2);
    			set_input_value(input2, /*bgColor*/ ctx[5]);
    			append_dev(div5, t47);
    			append_dev(div5, input3);
    			set_input_value(input3, /*bgColor*/ ctx[5]);
    			insert_dev(target, t48, anchor);
    			insert_dev(target, div6, anchor);
    			append_dev(div6, label6);
    			append_dev(div6, t50);
    			append_dev(div6, input4);
    			set_input_value(input4, /*textColor*/ ctx[6]);
    			append_dev(div6, t51);
    			append_dev(div6, input5);
    			set_input_value(input5, /*textColor*/ ctx[6]);
    			insert_dev(target, t52, anchor);
    			insert_dev(target, div7, anchor);
    			append_dev(div7, label7);
    			append_dev(div7, t54);
    			append_dev(div7, select1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select1, null);
    			}

    			select_option(select1, /*font*/ ctx[8]);
    			append_dev(div7, t55);
    			append_dev(div7, button0);
    			append_dev(div7, t57);
    			append_dev(div7, button1);
    			insert_dev(target, t59, anchor);
    			insert_dev(target, div8, anchor);
    			append_dev(div8, label8);
    			append_dev(div8, t61);
    			append_dev(div8, input6);
    			set_input_value(input6, /*padding*/ ctx[0]);
    			append_dev(div8, t62);
    			append_dev(div8, small4);
    			insert_dev(target, t64, anchor);
    			insert_dev(target, div9, anchor);
    			append_dev(div9, label9);
    			append_dev(div9, t66);
    			append_dev(div9, small5);
    			append_dev(div9, t68);
    			append_dev(div9, input7);
    			set_input_value(input7, /*buttonMarginH*/ ctx[2]);
    			append_dev(div9, t69);
    			append_dev(div9, small6);
    			append_dev(div9, t71);
    			append_dev(div9, small7);
    			append_dev(div9, t73);
    			append_dev(div9, input8);
    			set_input_value(input8, /*buttonMarginV*/ ctx[1]);
    			append_dev(div9, t74);
    			append_dev(div9, small8);
    			insert_dev(target, t76, anchor);
    			insert_dev(target, div10, anchor);
    			append_dev(div10, label10);
    			append_dev(div10, t78);
    			append_dev(div10, input9);
    			set_input_value(input9, /*borderRadius*/ ctx[7]);
    			append_dev(div10, t79);
    			append_dev(div10, code0);
    			append_dev(code0, t80);
    			append_dev(code0, t81);
    			insert_dev(target, t82, anchor);
    			insert_dev(target, div11, anchor);
    			append_dev(div11, label11);
    			append_dev(div11, t84);
    			append_dev(div11, input10);
    			set_input_value(input10, /*buttonWidth*/ ctx[12]);
    			append_dev(div11, t85);
    			append_dev(div11, code1);
    			append_dev(code1, t86);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(textarea0, "input", /*textarea0_input_handler*/ ctx[23]),
    					listen_dev(textarea1, "input", /*textarea1_input_handler*/ ctx[24]),
    					listen_dev(textarea2, "input", /*textarea2_input_handler*/ ctx[26]),
    					listen_dev(textarea2, "click", /*buttonSelectCode*/ ctx[21], false, false, false),
    					listen_dev(select0, "change", /*select0_change_handler*/ ctx[27]),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[28]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[29]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[30]),
    					listen_dev(input2, "change", /*change_handler*/ ctx[31], false, false, false),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[32]),
    					listen_dev(input3, "change", /*change_handler_1*/ ctx[33], false, false, false),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[34]),
    					listen_dev(input4, "change", /*change_handler_2*/ ctx[35], false, false, false),
    					listen_dev(input5, "input", /*input5_input_handler*/ ctx[36]),
    					listen_dev(input5, "change", /*change_handler_3*/ ctx[37], false, false, false),
    					listen_dev(select1, "change", /*select1_change_handler*/ ctx[38]),
    					listen_dev(button0, "click", /*click_handler*/ ctx[39], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[40], false, false, false),
    					listen_dev(input6, "input", /*input6_input_handler*/ ctx[41]),
    					listen_dev(input7, "input", /*input7_input_handler*/ ctx[42]),
    					listen_dev(input8, "input", /*input8_input_handler*/ ctx[43]),
    					listen_dev(input9, "change", /*input9_change_input_handler*/ ctx[44]),
    					listen_dev(input9, "input", /*input9_change_input_handler*/ ctx[44]),
    					listen_dev(input10, "change", /*input10_change_input_handler*/ ctx[45]),
    					listen_dev(input10, "input", /*input10_change_input_handler*/ ctx[45])
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

    			if (dirty[0] & /*buttonOutputCode*/ 524288) {
    				set_input_value(textarea2, /*buttonOutputCode*/ ctx[19]);
    			}

    			if (!current || dirty[0] & /*btnCopiedToClipboardTxt*/ 65536) set_data_dev(t13, /*btnCopiedToClipboardTxt*/ ctx[16]);
    			if (!current || dirty[0] & /*buttonOutputCode*/ 524288) div1.innerHTML = /*buttonOutputCode*/ ctx[19];
    			if (dirty[0] & /*containerTextAlign*/ 2048) {
    				select_option(select0, /*containerTextAlign*/ ctx[11]);
    			}

    			if (dirty[0] & /*containerMarginH*/ 16 && to_number(input0.value) !== /*containerMarginH*/ ctx[4]) {
    				set_input_value(input0, /*containerMarginH*/ ctx[4]);
    			}

    			if (dirty[0] & /*containerMarginV*/ 8 && to_number(input1.value) !== /*containerMarginV*/ ctx[3]) {
    				set_input_value(input1, /*containerMarginV*/ ctx[3]);
    			}

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
    					if_block.m(t44.parentNode, t44);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty[0] & /*bgColor*/ 32) {
    				set_input_value(input2, /*bgColor*/ ctx[5]);
    			}

    			if (dirty[0] & /*bgColor*/ 32 && input3.value !== /*bgColor*/ ctx[5]) {
    				set_input_value(input3, /*bgColor*/ ctx[5]);
    			}

    			if (dirty[0] & /*textColor*/ 64) {
    				set_input_value(input4, /*textColor*/ ctx[6]);
    			}

    			if (dirty[0] & /*textColor*/ 64 && input5.value !== /*textColor*/ ctx[6]) {
    				set_input_value(input5, /*textColor*/ ctx[6]);
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
    						each_blocks[i].m(select1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty[0] & /*font, fonts*/ 1048832) {
    				select_option(select1, /*font*/ ctx[8]);
    			}

    			if (dirty[0] & /*isBold*/ 512) {
    				toggle_class(button0, "toggled", /*isBold*/ ctx[9]);
    			}

    			if (dirty[0] & /*isItalic*/ 1024) {
    				toggle_class(button1, "toggled", /*isItalic*/ ctx[10]);
    			}

    			if (dirty[0] & /*padding*/ 1 && to_number(input6.value) !== /*padding*/ ctx[0]) {
    				set_input_value(input6, /*padding*/ ctx[0]);
    			}

    			if (dirty[0] & /*buttonMarginH*/ 4 && to_number(input7.value) !== /*buttonMarginH*/ ctx[2]) {
    				set_input_value(input7, /*buttonMarginH*/ ctx[2]);
    			}

    			if (dirty[0] & /*buttonMarginV*/ 2 && to_number(input8.value) !== /*buttonMarginV*/ ctx[1]) {
    				set_input_value(input8, /*buttonMarginV*/ ctx[1]);
    			}

    			if (dirty[0] & /*borderRadius*/ 128) {
    				set_input_value(input9, /*borderRadius*/ ctx[7]);
    			}

    			if (!current || dirty[0] & /*borderRadius*/ 128) set_data_dev(t80, /*borderRadius*/ ctx[7]);

    			if (dirty[0] & /*buttonWidth*/ 4096) {
    				set_input_value(input10, /*buttonWidth*/ ctx[12]);
    			}

    			if ((!current || dirty[0] & /*buttonWidth*/ 4096) && t86_value !== (t86_value = (/*buttonWidth*/ ctx[12] >= 0
    			? `${/*buttonWidth*/ ctx[12]}%`
    			: "Automatic") + "")) set_data_dev(t86, t86_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!textarea2_transition) textarea2_transition = create_bidirectional_transition(textarea2, slide, {}, true);
    				textarea2_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!p_transition) p_transition = create_bidirectional_transition(p, slide, {}, true);
    				p_transition.run(1);
    			});

    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			if (!textarea2_transition) textarea2_transition = create_bidirectional_transition(textarea2, slide, {}, false);
    			textarea2_transition.run(0);
    			if (!p_transition) p_transition = create_bidirectional_transition(p, slide, {}, false);
    			p_transition.run(0);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h30);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(h31);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(textarea2);
    			/*textarea2_binding*/ ctx[25](null);
    			if (detaching && textarea2_transition) textarea2_transition.end();
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(p);
    			if (detaching && p_transition) p_transition.end();
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(h32);
    			if (detaching) detach_dev(t16);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(h33);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t25);
    			if (detaching) detach_dev(div3);
    			if (detaching) detach_dev(t37);
    			if (detaching) detach_dev(h34);
    			if (detaching) detach_dev(t39);
    			if (detaching) detach_dev(div4);
    			if (detaching) detach_dev(t43);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t44);
    			if (detaching) detach_dev(div5);
    			if (detaching) detach_dev(t48);
    			if (detaching) detach_dev(div6);
    			if (detaching) detach_dev(t52);
    			if (detaching) detach_dev(div7);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t59);
    			if (detaching) detach_dev(div8);
    			if (detaching) detach_dev(t64);
    			if (detaching) detach_dev(div9);
    			if (detaching) detach_dev(t76);
    			if (detaching) detach_dev(div10);
    			if (detaching) detach_dev(t82);
    			if (detaching) detach_dev(div11);
    			mounted = false;
    			run_all(dispose);
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
    	let buttonMarginV = 0;
    	let buttonMarginH = 0;
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

    	function select0_change_handler() {
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

    	function input2_input_handler() {
    		bgColor = this.value;
    		$$invalidate(5, bgColor);
    	}

    	const change_handler = () => getContrast();

    	function input3_input_handler() {
    		bgColor = this.value;
    		$$invalidate(5, bgColor);
    	}

    	const change_handler_1 = () => getContrast();

    	function input4_input_handler() {
    		textColor = this.value;
    		$$invalidate(6, textColor);
    	}

    	const change_handler_2 = () => getContrast();

    	function input5_input_handler() {
    		textColor = this.value;
    		$$invalidate(6, textColor);
    	}

    	const change_handler_3 = () => getContrast();

    	function select1_change_handler() {
    		font = select_value(this);
    		$$invalidate(8, font);
    		$$invalidate(20, fonts);
    	}

    	const click_handler = () => $$invalidate(9, isBold = !isBold);
    	const click_handler_1 = () => $$invalidate(10, isItalic = !isItalic);

    	function input6_input_handler() {
    		padding = to_number(this.value);
    		$$invalidate(0, padding);
    	}

    	function input7_input_handler() {
    		buttonMarginH = to_number(this.value);
    		$$invalidate(2, buttonMarginH);
    	}

    	function input8_input_handler() {
    		buttonMarginV = to_number(this.value);
    		$$invalidate(1, buttonMarginV);
    	}

    	function input9_change_input_handler() {
    		borderRadius = to_number(this.value);
    		$$invalidate(7, borderRadius);
    	}

    	function input10_change_input_handler() {
    		buttonWidth = to_number(this.value);
    		$$invalidate(12, buttonWidth);
    	}

    	$$self.$capture_state = () => ({
    		slide,
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
    		textarea2_binding,
    		textarea2_input_handler,
    		select0_change_handler,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		change_handler,
    		input3_input_handler,
    		change_handler_1,
    		input4_input_handler,
    		change_handler_2,
    		input5_input_handler,
    		change_handler_3,
    		select1_change_handler,
    		click_handler,
    		click_handler_1,
    		input6_input_handler,
    		input7_input_handler,
    		input8_input_handler,
    		input9_change_input_handler,
    		input10_change_input_handler
    	];
    }

    class ButtonGenerator extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ButtonGenerator",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src\MultiColumn.svelte generated by Svelte v3.24.1 */

    const { console: console_1 } = globals;
    const file$1 = "src\\MultiColumn.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[77] = list[i];
    	return child_ctx;
    }

    // (240:0) {:else}
    function create_else_block(ctx) {
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
    			t0 = text("Connected to MailChimp API");
    			br = element("br");
    			t1 = space();
    			small = element("small");
    			small.textContent = "Click to disconnect";
    			add_location(br, file$1, 245, 33, 6048);
    			set_style(small, "opacity", "0.6");
    			add_location(small, file$1, 246, 4, 6059);
    			attr_dev(button, "class", "connectedBtn svelte-1aiio0v");
    			add_location(button, file$1, 240, 2, 5917);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, br);
    			append_dev(button, t1);
    			append_dev(button, small);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[32], false, false, false);
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
    		id: create_else_block.name,
    		type: "else",
    		source: "(240:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (234:0) {#if connState == null}
    function create_if_block_6(ctx) {
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
    			add_location(br, file$1, 236, 71, 5831);
    			set_style(small, "opacity", "0.6");
    			add_location(small, file$1, 237, 4, 5842);
    			set_style(button, "text-align", "left");
    			add_location(button, file$1, 234, 2, 5723);
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
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(234:0) {#if connState == null}",
    		ctx
    	});

    	return block;
    }

    // (250:0) {#if connState != null}
    function create_if_block_4(ctx) {
    	let div3;
    	let h3;
    	let t1;
    	let div0;
    	let label0;
    	let t3;
    	let input0;
    	let t4;
    	let small;
    	let t6;
    	let div1;
    	let label1;
    	let t8;
    	let select;
    	let t9;
    	let div2;
    	let label2;
    	let t11;
    	let input1;
    	let t12;
    	let button;
    	let t13;
    	let button_disabled_value;
    	let t14;
    	let div3_transition;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*folders*/ ctx[15];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	let if_block = /*uploading*/ ctx[14] && create_if_block_5(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Upload";
    			t1 = space();
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Drag and drop or";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			small = element("small");
    			small.textContent = "Max 10 files at once";
    			t6 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Folder";
    			t8 = space();
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t9 = space();
    			div2 = element("div");
    			label2 = element("label");
    			label2.textContent = "Add a folder";
    			t11 = space();
    			input1 = element("input");
    			t12 = space();
    			button = element("button");
    			t13 = text("Add folder");
    			t14 = space();
    			if (if_block) if_block.c();
    			attr_dev(h3, "class", "svelte-1aiio0v");
    			add_location(h3, file$1, 251, 4, 6184);
    			attr_dev(label0, "for", "upload");
    			attr_dev(label0, "class", "svelte-1aiio0v");
    			add_location(label0, file$1, 254, 6, 6235);
    			attr_dev(input0, "type", "file");
    			attr_dev(input0, "id", "upload");
    			input0.multiple = true;
    			input0.disabled = /*uploading*/ ctx[14];
    			add_location(input0, file$1, 255, 6, 6286);
    			attr_dev(small, "class", "warning-inverse");
    			add_location(small, file$1, 262, 6, 6451);
    			attr_dev(div0, "class", "ctrl-flex");
    			add_location(div0, file$1, 253, 4, 6205);
    			attr_dev(label1, "for", "folderPicker");
    			attr_dev(label1, "class", "svelte-1aiio0v");
    			add_location(label1, file$1, 266, 6, 6557);
    			attr_dev(select, "id", "folderPicker");
    			add_location(select, file$1, 267, 6, 6604);
    			attr_dev(div1, "class", "ctrl-flex");
    			add_location(div1, file$1, 265, 4, 6527);
    			attr_dev(label2, "for", "newFolderName");
    			attr_dev(label2, "class", "svelte-1aiio0v");
    			add_location(label2, file$1, 278, 6, 6870);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "id", "newFolderName");
    			add_location(input1, file$1, 279, 6, 6924);
    			button.disabled = button_disabled_value = /*newFolderName*/ ctx[7].length < 1;
    			add_location(button, file$1, 281, 6, 6999);
    			attr_dev(div2, "class", "ctrl-flex");
    			add_location(div2, file$1, 277, 4, 6840);
    			add_location(div3, file$1, 250, 2, 6157);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, h3);
    			append_dev(div3, t1);
    			append_dev(div3, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t3);
    			append_dev(div0, input0);
    			/*input0_binding*/ ctx[33](input0);
    			append_dev(div0, t4);
    			append_dev(div0, small);
    			append_dev(div3, t6);
    			append_dev(div3, div1);
    			append_dev(div1, label1);
    			append_dev(div1, t8);
    			append_dev(div1, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			append_dev(div3, t9);
    			append_dev(div3, div2);
    			append_dev(div2, label2);
    			append_dev(div2, t11);
    			append_dev(div2, input1);
    			set_input_value(input1, /*newFolderName*/ ctx[7]);
    			append_dev(div2, t12);
    			append_dev(div2, button);
    			append_dev(button, t13);
    			append_dev(div3, t14);
    			if (if_block) if_block.m(div3, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*toBase64*/ ctx[28], false, false, false),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[34]),
    					listen_dev(button, "click", /*click_handler_2*/ ctx[35], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*uploading*/ 16384) {
    				prop_dev(input0, "disabled", /*uploading*/ ctx[14]);
    			}

    			if (dirty[0] & /*folders*/ 32768) {
    				each_value = /*folders*/ ctx[15];
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

    			if (dirty[0] & /*newFolderName*/ 128 && input1.value !== /*newFolderName*/ ctx[7]) {
    				set_input_value(input1, /*newFolderName*/ ctx[7]);
    			}

    			if (!current || dirty[0] & /*newFolderName*/ 128 && button_disabled_value !== (button_disabled_value = /*newFolderName*/ ctx[7].length < 1)) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}

    			if (/*uploading*/ ctx[14]) {
    				if (if_block) {
    					if (dirty[0] & /*uploading*/ 16384) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_5(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div3, null);
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

    			add_render_callback(() => {
    				if (!div3_transition) div3_transition = create_bidirectional_transition(div3, slide, {}, true);
    				div3_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			if (!div3_transition) div3_transition = create_bidirectional_transition(div3, slide, {}, false);
    			div3_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			/*input0_binding*/ ctx[33](null);
    			destroy_each(each_blocks, detaching);
    			if (if_block) if_block.d();
    			if (detaching && div3_transition) div3_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(250:0) {#if connState != null}",
    		ctx
    	});

    	return block;
    }

    // (269:8) {#each folders as folder}
    function create_each_block$1(ctx) {
    	let option;
    	let t0_value = /*folder*/ ctx[77].name + "";
    	let t0;
    	let t1;
    	let small;
    	let t2;
    	let t3_value = /*folder*/ ctx[77].id + "";
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
    			add_location(small, file$1, 271, 12, 6740);
    			option.__value = option_value_value = /*folder*/ ctx[77].id;
    			option.value = option.__value;
    			add_location(option, file$1, 269, 10, 6675);
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
    			if (dirty[0] & /*folders*/ 32768 && t0_value !== (t0_value = /*folder*/ ctx[77].name + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*folders*/ 32768 && t3_value !== (t3_value = /*folder*/ ctx[77].id + "")) set_data_dev(t3, t3_value);

    			if (dirty[0] & /*folders*/ 32768 && option_value_value !== (option_value_value = /*folder*/ ctx[77].id)) {
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
    		source: "(269:8) {#each folders as folder}",
    		ctx
    	});

    	return block;
    }

    // (287:4) {#if uploading}
    function create_if_block_5(ctx) {
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
    			add_location(div0, file$1, 288, 8, 7202);
    			attr_dev(div1, "class", "sk-circle2 sk-circle");
    			add_location(div1, file$1, 289, 8, 7247);
    			attr_dev(div2, "class", "sk-circle3 sk-circle");
    			add_location(div2, file$1, 290, 8, 7292);
    			attr_dev(div3, "class", "sk-circle4 sk-circle");
    			add_location(div3, file$1, 291, 8, 7337);
    			attr_dev(div4, "class", "sk-circle5 sk-circle");
    			add_location(div4, file$1, 292, 8, 7382);
    			attr_dev(div5, "class", "sk-circle6 sk-circle");
    			add_location(div5, file$1, 293, 8, 7427);
    			attr_dev(div6, "class", "sk-circle7 sk-circle");
    			add_location(div6, file$1, 294, 8, 7472);
    			attr_dev(div7, "class", "sk-circle8 sk-circle");
    			add_location(div7, file$1, 295, 8, 7517);
    			attr_dev(div8, "class", "sk-circle9 sk-circle");
    			add_location(div8, file$1, 296, 8, 7562);
    			attr_dev(div9, "class", "sk-circle10 sk-circle");
    			add_location(div9, file$1, 297, 8, 7607);
    			attr_dev(div10, "class", "sk-circle11 sk-circle");
    			add_location(div10, file$1, 298, 8, 7653);
    			attr_dev(div11, "class", "sk-circle12 sk-circle");
    			add_location(div11, file$1, 299, 8, 7699);
    			attr_dev(div12, "class", "sk-fading-circle");
    			add_location(div12, file$1, 287, 6, 7146);
    			add_location(span, file$1, 301, 6, 7756);
    			add_location(br, file$1, 302, 6, 7785);
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
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(287:4) {#if uploading}",
    		ctx
    	});

    	return block;
    }

    // (349:0) {#if splitImages.length != splitUrls.length}
    function create_if_block_3(ctx) {
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
    			add_location(small, file$1, 349, 2, 9901);
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
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(349:0) {#if splitImages.length != splitUrls.length}",
    		ctx
    	});

    	return block;
    }

    // (417:0) {#if columnBetweenBorderThickness > 0}
    function create_if_block_2(ctx) {
    	let div0;
    	let label0;
    	let t1;
    	let input0;
    	let t2;
    	let input1;
    	let div0_transition;
    	let t3;
    	let div2;
    	let label1;
    	let t5;
    	let div1;
    	let div1_style_value;
    	let t6;
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
    			label0 = element("label");
    			label0.textContent = "Color";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			input1 = element("input");
    			t3 = space();
    			div2 = element("div");
    			label1 = element("label");
    			label1.textContent = "Style";
    			t5 = space();
    			div1 = element("div");
    			t6 = space();
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
    			attr_dev(label0, "for", "bgColor");
    			attr_dev(label0, "class", "svelte-1aiio0v");
    			add_location(label0, file$1, 418, 4, 11467);
    			attr_dev(input0, "type", "color");
    			attr_dev(input0, "id", "bgColor");
    			add_location(input0, file$1, 419, 4, 11506);
    			set_style(input1, "width", "5rem");
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "maxlength", "7");
    			attr_dev(input1, "minlength", "7");
    			add_location(input1, file$1, 420, 4, 11584);
    			attr_dev(div0, "class", "ctrl-flex");
    			add_location(div0, file$1, 417, 2, 11422);
    			attr_dev(label1, "for", "containerAlign");
    			attr_dev(label1, "class", "svelte-1aiio0v");
    			add_location(label1, file$1, 429, 4, 11779);
    			attr_dev(div1, "style", div1_style_value = "height: 1px; width :32px; border-bottom: " + /*columnBetweenBorderThickness*/ ctx[8] + "px " + /*columnBetweenBorderStyle*/ ctx[9] + " grey");
    			add_location(div1, file$1, 430, 4, 11825);
    			option0.__value = "solid";
    			option0.value = option0.__value;
    			add_location(option0, file$1, 433, 6, 12030);
    			option1.__value = "dotted";
    			option1.value = option1.__value;
    			add_location(option1, file$1, 434, 6, 12073);
    			option2.__value = "dashed";
    			option2.value = option2.__value;
    			add_location(option2, file$1, 435, 6, 12118);
    			option3.__value = "double";
    			option3.value = option3.__value;
    			add_location(option3, file$1, 436, 6, 12163);
    			option4.__value = "groove";
    			option4.value = option4.__value;
    			add_location(option4, file$1, 437, 6, 12208);
    			option5.__value = "ridge";
    			option5.value = option5.__value;
    			add_location(option5, file$1, 438, 6, 12253);
    			attr_dev(select, "id", "containerAlign");
    			if (/*columnBetweenBorderStyle*/ ctx[9] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[50].call(select));
    			add_location(select, file$1, 432, 4, 11957);
    			attr_dev(div2, "class", "ctrl-flex");
    			add_location(div2, file$1, 428, 2, 11734);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, label0);
    			append_dev(div0, t1);
    			append_dev(div0, input0);
    			set_input_value(input0, /*columnBetweenBorderColor*/ ctx[10]);
    			append_dev(div0, t2);
    			append_dev(div0, input1);
    			set_input_value(input1, /*columnBetweenBorderColor*/ ctx[10]);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, label1);
    			append_dev(div2, t5);
    			append_dev(div2, div1);
    			append_dev(div2, t6);
    			append_dev(div2, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			append_dev(select, option3);
    			append_dev(select, option4);
    			append_dev(select, option5);
    			select_option(select, /*columnBetweenBorderStyle*/ ctx[9]);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[48]),
    					listen_dev(input1, "input", /*input1_input_handler_1*/ ctx[49]),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[50])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*columnBetweenBorderColor*/ 1024) {
    				set_input_value(input0, /*columnBetweenBorderColor*/ ctx[10]);
    			}

    			if (dirty[0] & /*columnBetweenBorderColor*/ 1024 && input1.value !== /*columnBetweenBorderColor*/ ctx[10]) {
    				set_input_value(input1, /*columnBetweenBorderColor*/ ctx[10]);
    			}

    			if (!current || dirty[0] & /*columnBetweenBorderThickness, columnBetweenBorderStyle*/ 768 && div1_style_value !== (div1_style_value = "height: 1px; width :32px; border-bottom: " + /*columnBetweenBorderThickness*/ ctx[8] + "px " + /*columnBetweenBorderStyle*/ ctx[9] + " grey")) {
    				attr_dev(div1, "style", div1_style_value);
    			}

    			if (dirty[0] & /*columnBetweenBorderStyle*/ 512) {
    				select_option(select, /*columnBetweenBorderStyle*/ ctx[9]);
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
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div2);
    			if (detaching && div2_transition) div2_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(417:0) {#if columnBetweenBorderThickness > 0}",
    		ctx
    	});

    	return block;
    }

    // (464:0) {#if advancedMode}
    function create_if_block_1(ctx) {
    	let div0;
    	let label0;
    	let t0;
    	let code0;
    	let t2;
    	let t3;
    	let input0;
    	let div0_transition;
    	let t4;
    	let div1;
    	let label1;
    	let t5;
    	let code1;
    	let t7;
    	let t8;
    	let input1;
    	let div1_transition;
    	let t9;
    	let div2;
    	let label2;
    	let t11;
    	let small0;
    	let t12;
    	let code2;
    	let t14;
    	let div2_transition;
    	let t15;
    	let div3;
    	let label3;
    	let t17;
    	let small1;
    	let t18;
    	let code3;
    	let t20;
    	let div3_transition;
    	let current;
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
    			t14 = text(" as a placeholder\n      for the actual image width.");
    			t15 = space();
    			div3 = element("div");
    			label3 = element("label");
    			label3.textContent = " ";
    			t17 = space();
    			small1 = element("small");
    			t18 = text("Use ");
    			code3 = element("code");
    			code3.textContent = `${"{setGap}"}`;
    			t20 = text(" as a placeholder\n      for spacing set above.");
    			add_location(code0, file$1, 465, 34, 13003);
    			attr_dev(label0, "for", "astyle");
    			attr_dev(label0, "class", "svelte-1aiio0v");
    			add_location(label0, file$1, 465, 4, 12973);
    			set_style(input0, "font-family", "'Inconsolata', monospace");
    			set_style(input0, "width", "30rem");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "id", "astyle");
    			add_location(input0, file$1, 466, 4, 13035);
    			attr_dev(div0, "class", "ctrl-flex");
    			add_location(div0, file$1, 464, 2, 12928);
    			add_location(code1, file$1, 474, 36, 13263);
    			attr_dev(label1, "for", "imgstyle");
    			attr_dev(label1, "class", "svelte-1aiio0v");
    			add_location(label1, file$1, 474, 4, 13231);
    			set_style(input1, "font-family", "'Inconsolata', monospace");
    			set_style(input1, "width", "30rem");
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "id", "imgstyle");
    			add_location(input1, file$1, 475, 4, 13297);
    			attr_dev(div1, "class", "ctrl-flex");
    			add_location(div1, file$1, 473, 2, 13186);
    			attr_dev(label2, "for", "__");
    			attr_dev(label2, "class", "svelte-1aiio0v");
    			add_location(label2, file$1, 483, 4, 13499);
    			set_style(code2, "color", "var(--accent)");
    			add_location(code2, file$1, 485, 10, 13552);
    			add_location(small0, file$1, 484, 4, 13534);
    			attr_dev(div2, "class", "ctrl-flex");
    			add_location(div2, file$1, 482, 2, 13454);
    			attr_dev(label3, "for", "___");
    			attr_dev(label3, "class", "svelte-1aiio0v");
    			add_location(label3, file$1, 490, 4, 13732);
    			set_style(code3, "color", "var(--accent)");
    			add_location(code3, file$1, 492, 10, 13786);
    			add_location(small1, file$1, 491, 4, 13768);
    			attr_dev(div3, "class", "ctrl-flex");
    			add_location(div3, file$1, 489, 2, 13687);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, label0);
    			append_dev(label0, t0);
    			append_dev(label0, code0);
    			append_dev(label0, t2);
    			append_dev(div0, t3);
    			append_dev(div0, input0);
    			set_input_value(input0, /*aStyle*/ ctx[17]);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, label1);
    			append_dev(label1, t5);
    			append_dev(label1, code1);
    			append_dev(label1, t7);
    			append_dev(div1, t8);
    			append_dev(div1, input1);
    			set_input_value(input1, /*imageStyle*/ ctx[16]);
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
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler_1*/ ctx[54]),
    					listen_dev(input1, "input", /*input1_input_handler_2*/ ctx[55])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*aStyle*/ 131072 && input0.value !== /*aStyle*/ ctx[17]) {
    				set_input_value(input0, /*aStyle*/ ctx[17]);
    			}

    			if (dirty[0] & /*imageStyle*/ 65536 && input1.value !== /*imageStyle*/ ctx[16]) {
    				set_input_value(input1, /*imageStyle*/ ctx[16]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div0_transition) div0_transition = create_bidirectional_transition(div0, slide, {}, true);
    				div0_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, slide, {}, true);
    				div1_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, slide, {}, true);
    				div2_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!div3_transition) div3_transition = create_bidirectional_transition(div3, slide, {}, true);
    				div3_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div0_transition) div0_transition = create_bidirectional_transition(div0, slide, {}, false);
    			div0_transition.run(0);
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, slide, {}, false);
    			div1_transition.run(0);
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, slide, {}, false);
    			div2_transition.run(0);
    			if (!div3_transition) div3_transition = create_bidirectional_transition(div3, slide, {}, false);
    			div3_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching && div0_transition) div0_transition.end();
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(div2);
    			if (detaching && div2_transition) div2_transition.end();
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(div3);
    			if (detaching && div3_transition) div3_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(464:0) {#if advancedMode}",
    		ctx
    	});

    	return block;
    }

    // (499:0) {#if splitImages.length > 0 && columnImages.length > 0 && !uploading}
    function create_if_block$1(ctx) {
    	let h30;
    	let h30_transition;
    	let t1;
    	let textarea;
    	let textarea_transition;
    	let t2;
    	let p;
    	let t3;
    	let p_transition;
    	let t4;
    	let h31;
    	let h31_transition;
    	let t6;
    	let div;
    	let div_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h30 = element("h3");
    			h30.textContent = "Code";
    			t1 = space();
    			textarea = element("textarea");
    			t2 = space();
    			p = element("p");
    			t3 = text(/*columnCopiedToClipboardTxt*/ ctx[13]);
    			t4 = space();
    			h31 = element("h3");
    			h31.textContent = "Preview";
    			t6 = space();
    			div = element("div");
    			attr_dev(h30, "class", "svelte-1aiio0v");
    			add_location(h30, file$1, 499, 2, 13988);
    			attr_dev(textarea, "class", "output");
    			attr_dev(textarea, "type", "text");
    			textarea.readOnly = true;
    			add_location(textarea, file$1, 501, 2, 14022);
    			attr_dev(p, "class", "copiedToClipboardTxt svelte-1aiio0v");
    			add_location(p, file$1, 510, 2, 14210);
    			set_style(h31, "margin", "1rem 0");
    			attr_dev(h31, "class", "svelte-1aiio0v");
    			add_location(h31, file$1, 514, 2, 14303);
    			attr_dev(div, "class", "preview");
    			set_style(div, "width", /*maxWidth*/ ctx[18] + "px");
    			add_location(div, file$1, 515, 2, 14362);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h30, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, textarea, anchor);
    			/*textarea_binding*/ ctx[56](textarea);
    			set_input_value(textarea, /*columnOutputCode*/ ctx[26]);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, p, anchor);
    			append_dev(p, t3);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, h31, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div, anchor);
    			div.innerHTML = /*columnOutputCode*/ ctx[26];
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[57]),
    					listen_dev(textarea, "click", /*columnSelectCode*/ ctx[27], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*columnOutputCode*/ 67108864) {
    				set_input_value(textarea, /*columnOutputCode*/ ctx[26]);
    			}

    			if (!current || dirty[0] & /*columnCopiedToClipboardTxt*/ 8192) set_data_dev(t3, /*columnCopiedToClipboardTxt*/ ctx[13]);
    			if (!current || dirty[0] & /*columnOutputCode*/ 67108864) div.innerHTML = /*columnOutputCode*/ ctx[26];
    			if (!current || dirty[0] & /*maxWidth*/ 262144) {
    				set_style(div, "width", /*maxWidth*/ ctx[18] + "px");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h30_transition) h30_transition = create_bidirectional_transition(h30, slide, {}, true);
    				h30_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!textarea_transition) textarea_transition = create_bidirectional_transition(textarea, slide, {}, true);
    				textarea_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!p_transition) p_transition = create_bidirectional_transition(p, slide, {}, true);
    				p_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!h31_transition) h31_transition = create_bidirectional_transition(h31, slide, {}, true);
    				h31_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!h30_transition) h30_transition = create_bidirectional_transition(h30, slide, {}, false);
    			h30_transition.run(0);
    			if (!textarea_transition) textarea_transition = create_bidirectional_transition(textarea, slide, {}, false);
    			textarea_transition.run(0);
    			if (!p_transition) p_transition = create_bidirectional_transition(p, slide, {}, false);
    			p_transition.run(0);
    			if (!h31_transition) h31_transition = create_bidirectional_transition(h31, slide, {}, false);
    			h31_transition.run(0);
    			if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h30);
    			if (detaching && h30_transition) h30_transition.end();
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(textarea);
    			/*textarea_binding*/ ctx[56](null);
    			if (detaching && textarea_transition) textarea_transition.end();
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(p);
    			if (detaching && p_transition) p_transition.end();
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(h31);
    			if (detaching && h31_transition) h31_transition.end();
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(499:0) {#if splitImages.length > 0 && columnImages.length > 0 && !uploading}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let h1;
    	let t1;
    	let t2;
    	let t3;
    	let div1;
    	let h30;
    	let t5;
    	let div0;
    	let span0;
    	let t7;
    	let span1;
    	let t9;
    	let small0;
    	let t11;
    	let button0;
    	let t13;
    	let button1;
    	let t15;
    	let button2;
    	let t17;
    	let div2;
    	let label0;
    	let t19;
    	let label1;
    	let t21;
    	let textarea0;
    	let t22;
    	let textarea1;
    	let t23;
    	let t24;
    	let h31;
    	let t26;
    	let div3;
    	let label2;
    	let t28;
    	let input0;
    	let t29;
    	let code0;
    	let t30;
    	let t31;
    	let t32;
    	let small1;
    	let t33;
    	let code1;
    	let t34;
    	let t35;
    	let t36;
    	let t37;
    	let div4;
    	let label3;
    	let t39;
    	let input1;
    	let t40;
    	let code2;
    	let t41;
    	let t42;
    	let h4;
    	let t44;
    	let div5;
    	let label4;
    	let t46;
    	let input2;
    	let t47;
    	let code3;
    	let t48;
    	let t49;
    	let t50;
    	let div6;
    	let label5;
    	let t52;
    	let input3;
    	let t53;
    	let code4;
    	let t54;
    	let t55;
    	let t56;
    	let div7;
    	let label6;
    	let t58;
    	let input4;
    	let t59;
    	let code5;
    	let t60;
    	let t61;
    	let t62;
    	let t63;
    	let h32;
    	let t65;
    	let div8;
    	let label7;
    	let t67;
    	let input5;
    	let t68;
    	let code6;
    	let t69;
    	let t70;
    	let t71;
    	let div9;
    	let label8;
    	let t73;
    	let input6;
    	let t74;
    	let code7;
    	let t75;
    	let t76;
    	let t77;
    	let div10;
    	let label9;
    	let t79;
    	let button3;
    	let t80_value = (/*advancedMode*/ ctx[1] ? "Hide" : "Show") + "";
    	let t80;
    	let t81;
    	let t82;
    	let t83;
    	let dialog;
    	let h33;
    	let t85;
    	let label10;
    	let t87;
    	let input7;
    	let t88;
    	let br;
    	let t89;
    	let div11;
    	let small2;
    	let t91;
    	let button4;
    	let t93;
    	let button5;
    	let t94;
    	let button5_disabled_value;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*connState*/ ctx[20] == null) return create_if_block_6;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*connState*/ ctx[20] != null && create_if_block_4(ctx);
    	let if_block2 = /*splitImages*/ ctx[24].length != /*splitUrls*/ ctx[25].length && create_if_block_3(ctx);
    	let if_block3 = /*columnBetweenBorderThickness*/ ctx[8] > 0 && create_if_block_2(ctx);
    	let if_block4 = /*advancedMode*/ ctx[1] && create_if_block_1(ctx);
    	let if_block5 = /*splitImages*/ ctx[24].length > 0 && /*columnImages*/ ctx[0].length > 0 && !/*uploading*/ ctx[14] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Multi-column images";
    			t1 = space();
    			if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();
    			t3 = space();
    			div1 = element("div");
    			h30 = element("h3");
    			h30.textContent = "Inputs";
    			t5 = space();
    			div0 = element("div");
    			span0 = element("span");
    			span0.textContent = "Dummy data";
    			t7 = space();
    			span1 = element("span");
    			span1.textContent = "Dummy data XL";
    			t9 = space();
    			small0 = element("small");
    			small0.textContent = "Clear";
    			t11 = space();
    			button0 = element("button");
    			button0.textContent = "Images";
    			t13 = space();
    			button1 = element("button");
    			button1.textContent = "URLs";
    			t15 = space();
    			button2 = element("button");
    			button2.textContent = "Both";
    			t17 = space();
    			div2 = element("div");
    			label0 = element("label");
    			label0.textContent = "Images";
    			t19 = space();
    			label1 = element("label");
    			label1.textContent = "URLs";
    			t21 = space();
    			textarea0 = element("textarea");
    			t22 = space();
    			textarea1 = element("textarea");
    			t23 = space();
    			if (if_block2) if_block2.c();
    			t24 = space();
    			h31 = element("h3");
    			h31.textContent = "Container style";
    			t26 = space();
    			div3 = element("div");
    			label2 = element("label");
    			label2.textContent = "Maximum width";
    			t28 = space();
    			input0 = element("input");
    			t29 = space();
    			code0 = element("code");
    			t30 = text(/*maxWidth*/ ctx[18]);
    			t31 = text(" px");
    			t32 = space();
    			small1 = element("small");
    			t33 = text("(");
    			code1 = element("code");
    			t34 = text(/*colWidth*/ ctx[23]);
    			t35 = text(" px");
    			t36 = text(" per image)");
    			t37 = space();
    			div4 = element("div");
    			label3 = element("label");
    			label3.textContent = "Images per row";
    			t39 = space();
    			input1 = element("input");
    			t40 = space();
    			code2 = element("code");
    			t41 = text(/*imagesPerRow*/ ctx[4]);
    			t42 = space();
    			h4 = element("h4");
    			h4.textContent = "Border between rows";
    			t44 = space();
    			div5 = element("div");
    			label4 = element("label");
    			label4.textContent = "Space above";
    			t46 = space();
    			input2 = element("input");
    			t47 = space();
    			code3 = element("code");
    			t48 = text(/*columnBetweenBorderPaddingTop*/ ctx[11]);
    			t49 = text(" px");
    			t50 = space();
    			div6 = element("div");
    			label5 = element("label");
    			label5.textContent = "Space below";
    			t52 = space();
    			input3 = element("input");
    			t53 = space();
    			code4 = element("code");
    			t54 = text(/*columnBetweenBorderPaddingBottom*/ ctx[12]);
    			t55 = text(" px");
    			t56 = space();
    			div7 = element("div");
    			label6 = element("label");
    			label6.textContent = "Thickness";
    			t58 = space();
    			input4 = element("input");
    			t59 = space();
    			code5 = element("code");
    			t60 = text(/*columnBetweenBorderThickness*/ ctx[8]);
    			t61 = text(" px");
    			t62 = space();
    			if (if_block3) if_block3.c();
    			t63 = space();
    			h32 = element("h3");
    			h32.textContent = "Image style";
    			t65 = space();
    			div8 = element("div");
    			label7 = element("label");
    			label7.textContent = "Horizontal spacing";
    			t67 = space();
    			input5 = element("input");
    			t68 = space();
    			code6 = element("code");
    			t69 = text(/*columnsHGap*/ ctx[5]);
    			t70 = text(" px");
    			t71 = space();
    			div9 = element("div");
    			label8 = element("label");
    			label8.textContent = "Vertical spacing";
    			t73 = space();
    			input6 = element("input");
    			t74 = space();
    			code7 = element("code");
    			t75 = text(/*columnsVGap*/ ctx[6]);
    			t76 = text(" px");
    			t77 = space();
    			div10 = element("div");
    			label9 = element("label");
    			label9.textContent = "Advanced controls";
    			t79 = space();
    			button3 = element("button");
    			t80 = text(t80_value);
    			t81 = space();
    			if (if_block4) if_block4.c();
    			t82 = space();
    			if (if_block5) if_block5.c();
    			t83 = space();
    			dialog = element("dialog");
    			h33 = element("h3");
    			h33.textContent = "Connect";
    			t85 = space();
    			label10 = element("label");
    			label10.textContent = "API key";
    			t87 = space();
    			input7 = element("input");
    			t88 = space();
    			br = element("br");
    			t89 = space();
    			div11 = element("div");
    			small2 = element("small");
    			small2.textContent = "Demo\n      API key";
    			t91 = space();
    			button4 = element("button");
    			button4.textContent = "Cancel";
    			t93 = space();
    			button5 = element("button");
    			t94 = text("Connect");
    			add_location(h1, file$1, 231, 0, 5667);
    			set_style(h30, "margin", "0");
    			set_style(h30, "padding", "0");
    			attr_dev(h30, "class", "svelte-1aiio0v");
    			add_location(h30, file$1, 309, 2, 7921);
    			set_style(span0, "opacity", "0.5");
    			set_style(span0, "cursor", "pointer");
    			set_style(span0, "font-size", "0.8rem");
    			set_style(span0, "display", "inline-block");
    			add_location(span0, file$1, 312, 4, 8027);
    			set_style(span1, "opacity", "0.5");
    			set_style(span1, "cursor", "pointer");
    			set_style(span1, "font-size", "0.8rem");
    			set_style(span1, "display", "inline-block");
    			set_style(span1, "margin", "0 1rem");
    			add_location(span1, file$1, 319, 4, 8430);
    			set_style(small0, "margin-right", "0.5rem");
    			add_location(small0, file$1, 325, 4, 9059);
    			set_style(button0, "border-top-right-radius", "0");
    			set_style(button0, "border-bottom-right-radius", "0");
    			add_location(button0, file$1, 326, 4, 9113);
    			set_style(button1, "border-radius", "0");
    			set_style(button1, "border-left-width", "0");
    			set_style(button1, "border-right-width", "0");
    			add_location(button1, file$1, 329, 4, 9256);
    			set_style(button2, "border-top-left-radius", "0");
    			set_style(button2, "border-bottom-left-radius", "0");
    			add_location(button2, file$1, 332, 4, 9399);
    			set_style(div0, "display", "flex");
    			set_style(div0, "align-items", "baseline");
    			add_location(div0, file$1, 311, 2, 7971);
    			set_style(div1, "display", "flex");
    			set_style(div1, "justify-content", "space-between");
    			set_style(div1, "align-items", "baseline");
    			set_style(div1, "margin", "1rem 0");
    			add_location(div1, file$1, 307, 0, 7818);
    			attr_dev(label0, "for", "inputImages");
    			attr_dev(label0, "class", "svelte-1aiio0v");
    			add_location(label0, file$1, 342, 2, 9614);
    			attr_dev(label1, "for", "inputUrls");
    			attr_dev(label1, "class", "svelte-1aiio0v");
    			add_location(label1, file$1, 343, 2, 9656);
    			textarea0.disabled = /*uploading*/ ctx[14];
    			attr_dev(textarea0, "id", "inputImages");
    			add_location(textarea0, file$1, 344, 2, 9694);
    			textarea1.disabled = /*uploading*/ ctx[14];
    			attr_dev(textarea1, "id", "inputUrls");
    			add_location(textarea1, file$1, 345, 2, 9773);
    			attr_dev(div2, "class", "flex");
    			add_location(div2, file$1, 341, 0, 9593);
    			attr_dev(h31, "class", "svelte-1aiio0v");
    			add_location(h31, file$1, 357, 0, 10078);
    			attr_dev(label2, "for", "maxWidth");
    			attr_dev(label2, "class", "svelte-1aiio0v");
    			add_location(label2, file$1, 360, 2, 10130);
    			attr_dev(input0, "id", "maxWidth");
    			attr_dev(input0, "type", "range");
    			attr_dev(input0, "min", "100");
    			attr_dev(input0, "max", "1200");
    			add_location(input0, file$1, 361, 2, 10176);
    			add_location(code0, file$1, 367, 2, 10278);
    			add_location(code1, file$1, 368, 10, 10315);
    			add_location(small1, file$1, 368, 2, 10307);
    			attr_dev(div3, "class", "ctrl-flex");
    			add_location(div3, file$1, 359, 0, 10104);
    			attr_dev(label3, "for", "colImgsPerRow");
    			attr_dev(label3, "class", "svelte-1aiio0v");
    			add_location(label3, file$1, 372, 2, 10395);
    			attr_dev(input1, "id", "colImgsPerRow");
    			attr_dev(input1, "type", "range");
    			attr_dev(input1, "min", "1");
    			attr_dev(input1, "max", "6");
    			add_location(input1, file$1, 373, 2, 10447);
    			add_location(code2, file$1, 379, 2, 10553);
    			attr_dev(div4, "class", "ctrl-flex");
    			add_location(div4, file$1, 371, 0, 10369);
    			add_location(h4, file$1, 382, 0, 10589);
    			attr_dev(label4, "for", "colBrdrSpcTop");
    			attr_dev(label4, "class", "svelte-1aiio0v");
    			add_location(label4, file$1, 385, 2, 10645);
    			attr_dev(input2, "id", "colBrdrSpcTop");
    			attr_dev(input2, "type", "range");
    			attr_dev(input2, "min", "0");
    			attr_dev(input2, "max", "40");
    			add_location(input2, file$1, 386, 2, 10694);
    			add_location(code3, file$1, 392, 2, 10818);
    			attr_dev(div5, "class", "ctrl-flex");
    			add_location(div5, file$1, 384, 0, 10619);
    			attr_dev(label5, "for", "colBrdrSpcBtm");
    			attr_dev(label5, "class", "svelte-1aiio0v");
    			add_location(label5, file$1, 395, 2, 10899);
    			attr_dev(input3, "id", "colBrdrSpcBtm");
    			attr_dev(input3, "type", "range");
    			attr_dev(input3, "min", "0");
    			attr_dev(input3, "max", "40");
    			add_location(input3, file$1, 396, 2, 10948);
    			add_location(code4, file$1, 402, 2, 11075);
    			attr_dev(div6, "class", "ctrl-flex");
    			add_location(div6, file$1, 394, 0, 10873);
    			attr_dev(label6, "for", "colBrdrThcc");
    			attr_dev(label6, "class", "svelte-1aiio0v");
    			add_location(label6, file$1, 406, 2, 11160);
    			attr_dev(input4, "id", "colBrdrThcc");
    			attr_dev(input4, "type", "range");
    			attr_dev(input4, "min", "0");
    			attr_dev(input4, "max", "10");
    			add_location(input4, file$1, 407, 2, 11205);
    			add_location(code5, file$1, 413, 2, 11326);
    			attr_dev(div7, "class", "ctrl-flex");
    			add_location(div7, file$1, 405, 0, 11134);
    			attr_dev(h32, "class", "svelte-1aiio0v");
    			add_location(h32, file$1, 443, 0, 12320);
    			attr_dev(label7, "for", "colHgap");
    			attr_dev(label7, "class", "svelte-1aiio0v");
    			add_location(label7, file$1, 446, 2, 12368);
    			attr_dev(input5, "id", "colHgap");
    			attr_dev(input5, "type", "range");
    			attr_dev(input5, "min", "0");
    			attr_dev(input5, "max", "20");
    			add_location(input5, file$1, 447, 2, 12418);
    			add_location(code6, file$1, 448, 2, 12498);
    			attr_dev(div8, "class", "ctrl-flex");
    			add_location(div8, file$1, 445, 0, 12342);
    			attr_dev(label8, "for", "colVgap");
    			attr_dev(label8, "class", "svelte-1aiio0v");
    			add_location(label8, file$1, 452, 2, 12562);
    			attr_dev(input6, "id", "colVgap");
    			attr_dev(input6, "type", "range");
    			attr_dev(input6, "min", "0");
    			attr_dev(input6, "max", "20");
    			add_location(input6, file$1, 453, 2, 12610);
    			add_location(code7, file$1, 454, 2, 12690);
    			attr_dev(div9, "class", "ctrl-flex");
    			add_location(div9, file$1, 451, 0, 12536);
    			attr_dev(label9, "for", "_");
    			attr_dev(label9, "class", "svelte-1aiio0v");
    			add_location(label9, file$1, 458, 2, 12754);
    			add_location(button3, file$1, 459, 2, 12797);
    			attr_dev(div10, "class", "ctrl-flex");
    			add_location(div10, file$1, 457, 0, 12728);
    			attr_dev(h33, "class", "svelte-1aiio0v");
    			add_location(h33, file$1, 521, 2, 14510);
    			attr_dev(label10, "for", "apiKeyTxt");
    			attr_dev(label10, "class", "svelte-1aiio0v");
    			add_location(label10, file$1, 523, 2, 14530);
    			set_style(input7, "width", "20rem");
    			set_style(input7, "font-family", "'Inconsolata', 'SF Mono', Menlo, Consolas, 'Courier New', Courier, monospace");
    			attr_dev(input7, "type", "text");
    			attr_dev(input7, "class", "apiKeyField");
    			attr_dev(input7, "id", "apiKeyTxt");
    			add_location(input7, file$1, 524, 2, 14571);
    			add_location(br, file$1, 531, 2, 14784);
    			set_style(small2, "opacity", "0.6");
    			set_style(small2, "cursor", "pointer");
    			set_style(small2, "margin-right", "auto");
    			add_location(small2, file$1, 535, 4, 14909);
    			add_location(button4, file$1, 540, 4, 15085);
    			button5.disabled = button5_disabled_value = /*apiKey*/ ctx[19].length < 1;
    			add_location(button5, file$1, 541, 4, 15151);
    			set_style(div11, "display", "flex");
    			set_style(div11, "gap", "4px");
    			set_style(div11, "justify-content", "flex-end");
    			set_style(div11, "align-items", "center");
    			set_style(div11, "margin-top", "0.5rem");
    			add_location(div11, file$1, 533, 2, 14794);
    			add_location(dialog, file$1, 520, 0, 14474);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			if_block0.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h30);
    			append_dev(div1, t5);
    			append_dev(div1, div0);
    			append_dev(div0, span0);
    			append_dev(div0, t7);
    			append_dev(div0, span1);
    			append_dev(div0, t9);
    			append_dev(div0, small0);
    			append_dev(div0, t11);
    			append_dev(div0, button0);
    			append_dev(div0, t13);
    			append_dev(div0, button1);
    			append_dev(div0, t15);
    			append_dev(div0, button2);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, label0);
    			append_dev(div2, t19);
    			append_dev(div2, label1);
    			append_dev(div2, t21);
    			append_dev(div2, textarea0);
    			set_input_value(textarea0, /*columnImages*/ ctx[0]);
    			append_dev(div2, t22);
    			append_dev(div2, textarea1);
    			set_input_value(textarea1, /*columnUrls*/ ctx[2]);
    			insert_dev(target, t23, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, t24, anchor);
    			insert_dev(target, h31, anchor);
    			insert_dev(target, t26, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, label2);
    			append_dev(div3, t28);
    			append_dev(div3, input0);
    			set_input_value(input0, /*maxWidth*/ ctx[18]);
    			append_dev(div3, t29);
    			append_dev(div3, code0);
    			append_dev(code0, t30);
    			append_dev(code0, t31);
    			append_dev(div3, t32);
    			append_dev(div3, small1);
    			append_dev(small1, t33);
    			append_dev(small1, code1);
    			append_dev(code1, t34);
    			append_dev(code1, t35);
    			append_dev(small1, t36);
    			insert_dev(target, t37, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, label3);
    			append_dev(div4, t39);
    			append_dev(div4, input1);
    			set_input_value(input1, /*imagesPerRow*/ ctx[4]);
    			append_dev(div4, t40);
    			append_dev(div4, code2);
    			append_dev(code2, t41);
    			insert_dev(target, t42, anchor);
    			insert_dev(target, h4, anchor);
    			insert_dev(target, t44, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, label4);
    			append_dev(div5, t46);
    			append_dev(div5, input2);
    			set_input_value(input2, /*columnBetweenBorderPaddingTop*/ ctx[11]);
    			append_dev(div5, t47);
    			append_dev(div5, code3);
    			append_dev(code3, t48);
    			append_dev(code3, t49);
    			insert_dev(target, t50, anchor);
    			insert_dev(target, div6, anchor);
    			append_dev(div6, label5);
    			append_dev(div6, t52);
    			append_dev(div6, input3);
    			set_input_value(input3, /*columnBetweenBorderPaddingBottom*/ ctx[12]);
    			append_dev(div6, t53);
    			append_dev(div6, code4);
    			append_dev(code4, t54);
    			append_dev(code4, t55);
    			insert_dev(target, t56, anchor);
    			insert_dev(target, div7, anchor);
    			append_dev(div7, label6);
    			append_dev(div7, t58);
    			append_dev(div7, input4);
    			set_input_value(input4, /*columnBetweenBorderThickness*/ ctx[8]);
    			append_dev(div7, t59);
    			append_dev(div7, code5);
    			append_dev(code5, t60);
    			append_dev(code5, t61);
    			insert_dev(target, t62, anchor);
    			if (if_block3) if_block3.m(target, anchor);
    			insert_dev(target, t63, anchor);
    			insert_dev(target, h32, anchor);
    			insert_dev(target, t65, anchor);
    			insert_dev(target, div8, anchor);
    			append_dev(div8, label7);
    			append_dev(div8, t67);
    			append_dev(div8, input5);
    			set_input_value(input5, /*columnsHGap*/ ctx[5]);
    			append_dev(div8, t68);
    			append_dev(div8, code6);
    			append_dev(code6, t69);
    			append_dev(code6, t70);
    			insert_dev(target, t71, anchor);
    			insert_dev(target, div9, anchor);
    			append_dev(div9, label8);
    			append_dev(div9, t73);
    			append_dev(div9, input6);
    			set_input_value(input6, /*columnsVGap*/ ctx[6]);
    			append_dev(div9, t74);
    			append_dev(div9, code7);
    			append_dev(code7, t75);
    			append_dev(code7, t76);
    			insert_dev(target, t77, anchor);
    			insert_dev(target, div10, anchor);
    			append_dev(div10, label9);
    			append_dev(div10, t79);
    			append_dev(div10, button3);
    			append_dev(button3, t80);
    			insert_dev(target, t81, anchor);
    			if (if_block4) if_block4.m(target, anchor);
    			insert_dev(target, t82, anchor);
    			if (if_block5) if_block5.m(target, anchor);
    			insert_dev(target, t83, anchor);
    			insert_dev(target, dialog, anchor);
    			append_dev(dialog, h33);
    			append_dev(dialog, t85);
    			append_dev(dialog, label10);
    			append_dev(dialog, t87);
    			append_dev(dialog, input7);
    			set_input_value(input7, /*apiKey*/ ctx[19]);
    			append_dev(dialog, t88);
    			append_dev(dialog, br);
    			append_dev(dialog, t89);
    			append_dev(dialog, div11);
    			append_dev(div11, small2);
    			append_dev(div11, t91);
    			append_dev(div11, button4);
    			append_dev(div11, t93);
    			append_dev(div11, button5);
    			append_dev(button5, t94);
    			/*dialog_binding*/ ctx[61](dialog);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(span0, "click", /*click_handler_3*/ ctx[36], false, false, false),
    					listen_dev(span1, "click", /*click_handler_4*/ ctx[37], false, false, false),
    					listen_dev(button0, "click", /*click_handler_5*/ ctx[38], false, false, false),
    					listen_dev(button1, "click", /*click_handler_6*/ ctx[39], false, false, false),
    					listen_dev(button2, "click", /*click_handler_7*/ ctx[40], false, false, false),
    					listen_dev(textarea0, "input", /*textarea0_input_handler*/ ctx[41]),
    					listen_dev(textarea1, "input", /*textarea1_input_handler*/ ctx[42]),
    					listen_dev(input0, "change", /*input0_change_input_handler*/ ctx[43]),
    					listen_dev(input0, "input", /*input0_change_input_handler*/ ctx[43]),
    					listen_dev(input1, "change", /*input1_change_input_handler*/ ctx[44]),
    					listen_dev(input1, "input", /*input1_change_input_handler*/ ctx[44]),
    					listen_dev(input2, "change", /*input2_change_input_handler*/ ctx[45]),
    					listen_dev(input2, "input", /*input2_change_input_handler*/ ctx[45]),
    					listen_dev(input3, "change", /*input3_change_input_handler*/ ctx[46]),
    					listen_dev(input3, "input", /*input3_change_input_handler*/ ctx[46]),
    					listen_dev(input4, "change", /*input4_change_input_handler*/ ctx[47]),
    					listen_dev(input4, "input", /*input4_change_input_handler*/ ctx[47]),
    					listen_dev(input5, "change", /*input5_change_input_handler*/ ctx[51]),
    					listen_dev(input5, "input", /*input5_change_input_handler*/ ctx[51]),
    					listen_dev(input6, "change", /*input6_change_input_handler*/ ctx[52]),
    					listen_dev(input6, "input", /*input6_change_input_handler*/ ctx[52]),
    					listen_dev(button3, "click", /*click_handler_8*/ ctx[53], false, false, false),
    					listen_dev(input7, "input", /*input7_input_handler*/ ctx[58]),
    					listen_dev(small2, "click", /*click_handler_9*/ ctx[59], false, false, false),
    					listen_dev(button4, "click", /*click_handler_10*/ ctx[60], false, false, false),
    					listen_dev(button5, "click", /*setUp*/ ctx[30], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(t2.parentNode, t2);
    				}
    			}

    			if (/*connState*/ ctx[20] != null) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*connState*/ 1048576) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_4(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(t3.parentNode, t3);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*uploading*/ 16384) {
    				prop_dev(textarea0, "disabled", /*uploading*/ ctx[14]);
    			}

    			if (dirty[0] & /*columnImages*/ 1) {
    				set_input_value(textarea0, /*columnImages*/ ctx[0]);
    			}

    			if (!current || dirty[0] & /*uploading*/ 16384) {
    				prop_dev(textarea1, "disabled", /*uploading*/ ctx[14]);
    			}

    			if (dirty[0] & /*columnUrls*/ 4) {
    				set_input_value(textarea1, /*columnUrls*/ ctx[2]);
    			}

    			if (/*splitImages*/ ctx[24].length != /*splitUrls*/ ctx[25].length) {
    				if (if_block2) {
    					if (dirty[0] & /*splitImages, splitUrls*/ 50331648) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_3(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(t24.parentNode, t24);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (dirty[0] & /*maxWidth*/ 262144) {
    				set_input_value(input0, /*maxWidth*/ ctx[18]);
    			}

    			if (!current || dirty[0] & /*maxWidth*/ 262144) set_data_dev(t30, /*maxWidth*/ ctx[18]);
    			if (!current || dirty[0] & /*colWidth*/ 8388608) set_data_dev(t34, /*colWidth*/ ctx[23]);

    			if (dirty[0] & /*imagesPerRow*/ 16) {
    				set_input_value(input1, /*imagesPerRow*/ ctx[4]);
    			}

    			if (!current || dirty[0] & /*imagesPerRow*/ 16) set_data_dev(t41, /*imagesPerRow*/ ctx[4]);

    			if (dirty[0] & /*columnBetweenBorderPaddingTop*/ 2048) {
    				set_input_value(input2, /*columnBetweenBorderPaddingTop*/ ctx[11]);
    			}

    			if (!current || dirty[0] & /*columnBetweenBorderPaddingTop*/ 2048) set_data_dev(t48, /*columnBetweenBorderPaddingTop*/ ctx[11]);

    			if (dirty[0] & /*columnBetweenBorderPaddingBottom*/ 4096) {
    				set_input_value(input3, /*columnBetweenBorderPaddingBottom*/ ctx[12]);
    			}

    			if (!current || dirty[0] & /*columnBetweenBorderPaddingBottom*/ 4096) set_data_dev(t54, /*columnBetweenBorderPaddingBottom*/ ctx[12]);

    			if (dirty[0] & /*columnBetweenBorderThickness*/ 256) {
    				set_input_value(input4, /*columnBetweenBorderThickness*/ ctx[8]);
    			}

    			if (!current || dirty[0] & /*columnBetweenBorderThickness*/ 256) set_data_dev(t60, /*columnBetweenBorderThickness*/ ctx[8]);

    			if (/*columnBetweenBorderThickness*/ ctx[8] > 0) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty[0] & /*columnBetweenBorderThickness*/ 256) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_2(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(t63.parentNode, t63);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (dirty[0] & /*columnsHGap*/ 32) {
    				set_input_value(input5, /*columnsHGap*/ ctx[5]);
    			}

    			if (!current || dirty[0] & /*columnsHGap*/ 32) set_data_dev(t69, /*columnsHGap*/ ctx[5]);

    			if (dirty[0] & /*columnsVGap*/ 64) {
    				set_input_value(input6, /*columnsVGap*/ ctx[6]);
    			}

    			if (!current || dirty[0] & /*columnsVGap*/ 64) set_data_dev(t75, /*columnsVGap*/ ctx[6]);
    			if ((!current || dirty[0] & /*advancedMode*/ 2) && t80_value !== (t80_value = (/*advancedMode*/ ctx[1] ? "Hide" : "Show") + "")) set_data_dev(t80, t80_value);

    			if (/*advancedMode*/ ctx[1]) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);

    					if (dirty[0] & /*advancedMode*/ 2) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block_1(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(t82.parentNode, t82);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}

    			if (/*splitImages*/ ctx[24].length > 0 && /*columnImages*/ ctx[0].length > 0 && !/*uploading*/ ctx[14]) {
    				if (if_block5) {
    					if_block5.p(ctx, dirty);

    					if (dirty[0] & /*splitImages, columnImages, uploading*/ 16793601) {
    						transition_in(if_block5, 1);
    					}
    				} else {
    					if_block5 = create_if_block$1(ctx);
    					if_block5.c();
    					transition_in(if_block5, 1);
    					if_block5.m(t83.parentNode, t83);
    				}
    			} else if (if_block5) {
    				group_outros();

    				transition_out(if_block5, 1, 1, () => {
    					if_block5 = null;
    				});

    				check_outros();
    			}

    			if (dirty[0] & /*apiKey*/ 524288 && input7.value !== /*apiKey*/ ctx[19]) {
    				set_input_value(input7, /*apiKey*/ ctx[19]);
    			}

    			if (!current || dirty[0] & /*apiKey*/ 524288 && button5_disabled_value !== (button5_disabled_value = /*apiKey*/ ctx[19].length < 1)) {
    				prop_dev(button5, "disabled", button5_disabled_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(if_block4);
    			transition_in(if_block5);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(if_block4);
    			transition_out(if_block5);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if_block0.d(detaching);
    			if (detaching) detach_dev(t2);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t23);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(t24);
    			if (detaching) detach_dev(h31);
    			if (detaching) detach_dev(t26);
    			if (detaching) detach_dev(div3);
    			if (detaching) detach_dev(t37);
    			if (detaching) detach_dev(div4);
    			if (detaching) detach_dev(t42);
    			if (detaching) detach_dev(h4);
    			if (detaching) detach_dev(t44);
    			if (detaching) detach_dev(div5);
    			if (detaching) detach_dev(t50);
    			if (detaching) detach_dev(div6);
    			if (detaching) detach_dev(t56);
    			if (detaching) detach_dev(div7);
    			if (detaching) detach_dev(t62);
    			if (if_block3) if_block3.d(detaching);
    			if (detaching) detach_dev(t63);
    			if (detaching) detach_dev(h32);
    			if (detaching) detach_dev(t65);
    			if (detaching) detach_dev(div8);
    			if (detaching) detach_dev(t71);
    			if (detaching) detach_dev(div9);
    			if (detaching) detach_dev(t77);
    			if (detaching) detach_dev(div10);
    			if (detaching) detach_dev(t81);
    			if (if_block4) if_block4.d(detaching);
    			if (detaching) detach_dev(t82);
    			if (if_block5) if_block5.d(detaching);
    			if (detaching) detach_dev(t83);
    			if (detaching) detach_dev(dialog);
    			/*dialog_binding*/ ctx[61](null);
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
    	var Mailchimp = require("mailchimp-api-v3");
    	let columnImages = "";
    	let advancedMode = false;
    	let columnUrls = "";
    	let apiKeyDialog;
    	let imagesPerRow = 2;
    	let columnsHGap = 0;
    	let columnsVGap = 0;
    	let folderId = 0;
    	let newFolderName = "";
    	let columnBetweenBorderThickness = 1;
    	let columnBetweenBorderStyle = "solid";
    	let columnBetweenBorderColor = "#aaaaaa";
    	let columnBetweenBorderPaddingTop = 18;
    	let columnBetweenBorderPaddingBottom = 20;
    	let columnCopiedToClipboardTxt = "Click to copy";
    	let uploading = false;
    	let filesToUpload = [];
    	let folders = [];
    	let imageStyle = "display: inline-block; width: {columnWidth}px; margin: {setGap}; padding: 0; line-height: 1;";
    	let aStyle = "text-decoration: none; margin: 0; padding: 0; display: inline-block; line-height: 1;";
    	let maxWidth = 600;
    	let apiKey = "";
    	let connState;
    	let columnOutputTextArea;

    	const columnSelectCode = e => {
    		columnOutputTextArea.select();
    		columnOutputTextArea.setSelectionRange(0, 99999);
    		document.execCommand("copy");
    		$$invalidate(13, columnCopiedToClipboardTxt = "Copied to clipboard");
    		setTimeout(() => $$invalidate(13, columnCopiedToClipboardTxt = "Click to copy"), 2000);
    	};

    	let previewDebug = false;

    	const toBase64 = () => {
    		filesToUpload = [...uploadElement.files];

    		if (filesToUpload.length > 10) {
    			alert("Select up to 10 files!");
    			return;
    		}

    		$$invalidate(14, uploading = true);

    		for (let piece of chunk(filesToUpload, 10)) {
    			for (let file of piece) {
    				let reader = new FileReader();

    				reader.onloadend = async () => {
    					const readerResult = reader.result;
    					currentBase64 = readerResult.substring(reader.result.indexOf("base64,") + 7);
    					await doUpload(file.name, currentBase64);
    					filesToUpload.shift();

    					if (filesToUpload.length == 0) {
    						$$invalidate(22, uploadElement.value = "", uploadElement);
    						$$invalidate(14, uploading = false);
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

    		$$invalidate(15, folders = [...tempFolders]);
    	};

    	const addFolder = async () => {
    		const mailChimp = new Mailchimp(apiKey);
    		let r = await mailChimp.post("/file-manager/folders", { name: newFolderName });
    		alert("Folder added!");
    		$$invalidate(7, newFolderName = "");
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
    		$$invalidate(2, columnUrls += "#");
    		$$invalidate(2, columnUrls += "\n");
    		currentBase64 = null;
    		currentFileName = null;
    	};

    	let uploadElement;
    	let currentBase64;
    	let currentFileName;

    	const testConnection = async e => {
    		const response = await client.ping.get();
    		$$invalidate(20, connState = "✔ connected");
    	};

    	const setUp = () => {
    		const mailchimp = new Mailchimp(apiKey);

    		mailchimp.get({ path: "/ping" }).then(r => {
    			if (r.statusCode === 200) {
    				$$invalidate(20, connState = "✔ connected");
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
    	const click_handler = () => apiKeyDialog.showModal();

    	const click_handler_1 = () => {
    		$$invalidate(19, apiKey = "");
    		$$invalidate(20, connState = null);
    	};

    	function input0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			uploadElement = $$value;
    			$$invalidate(22, uploadElement);
    		});
    	}

    	function input1_input_handler() {
    		newFolderName = this.value;
    		$$invalidate(7, newFolderName);
    	}

    	const click_handler_2 = () => addFolder();

    	const click_handler_3 = () => {
    		$$invalidate(0, columnImages = "https://yt3.ggpht.com/a/AATXAJzF-K41Fq96yE6jxs_fE6Hr7zvMXsQbqz1QNxGpjg=s88-c-k-c0xffffffff-no-rj-mo\nhttps://yt3.ggpht.com/a/AATXAJzF-K41Fq96yE6jxs_fE6Hr7zvMXsQbqz1QNxGpjg=s88-c-k-c0xffffffff-no-rj-mo");
    		$$invalidate(2, columnUrls = "#\n#");
    	};

    	const click_handler_4 = () => {
    		$$invalidate(0, columnImages = "https://yt3.ggpht.com/a/AATXAJzF-K41Fq96yE6jxs_fE6Hr7zvMXsQbqz1QNxGpjg=s88-c-k-c0xffffffff-no-rj-mo\nhttps://yt3.ggpht.com/a/AATXAJzF-K41Fq96yE6jxs_fE6Hr7zvMXsQbqz1QNxGpjg=s88-c-k-c0xffffffff-no-rj-mo\nhttps://yt3.ggpht.com/a/AATXAJzF-K41Fq96yE6jxs_fE6Hr7zvMXsQbqz1QNxGpjg=s88-c-k-c0xffffffff-no-rj-mo\nhttps://yt3.ggpht.com/a/AATXAJzF-K41Fq96yE6jxs_fE6Hr7zvMXsQbqz1QNxGpjg=s88-c-k-c0xffffffff-no-rj-mo");
    		$$invalidate(2, columnUrls = "#\n#\n#\n#");
    	};

    	const click_handler_5 = () => $$invalidate(0, columnImages = "");
    	const click_handler_6 = () => $$invalidate(2, columnUrls = "");

    	const click_handler_7 = () => {
    		$$invalidate(0, columnImages = "");
    		$$invalidate(2, columnUrls = "");
    	};

    	function textarea0_input_handler() {
    		columnImages = this.value;
    		$$invalidate(0, columnImages);
    	}

    	function textarea1_input_handler() {
    		columnUrls = this.value;
    		$$invalidate(2, columnUrls);
    	}

    	function input0_change_input_handler() {
    		maxWidth = to_number(this.value);
    		$$invalidate(18, maxWidth);
    	}

    	function input1_change_input_handler() {
    		imagesPerRow = to_number(this.value);
    		$$invalidate(4, imagesPerRow);
    	}

    	function input2_change_input_handler() {
    		columnBetweenBorderPaddingTop = to_number(this.value);
    		$$invalidate(11, columnBetweenBorderPaddingTop);
    	}

    	function input3_change_input_handler() {
    		columnBetweenBorderPaddingBottom = to_number(this.value);
    		$$invalidate(12, columnBetweenBorderPaddingBottom);
    	}

    	function input4_change_input_handler() {
    		columnBetweenBorderThickness = to_number(this.value);
    		$$invalidate(8, columnBetweenBorderThickness);
    	}

    	function input0_input_handler() {
    		columnBetweenBorderColor = this.value;
    		$$invalidate(10, columnBetweenBorderColor);
    	}

    	function input1_input_handler_1() {
    		columnBetweenBorderColor = this.value;
    		$$invalidate(10, columnBetweenBorderColor);
    	}

    	function select_change_handler() {
    		columnBetweenBorderStyle = select_value(this);
    		$$invalidate(9, columnBetweenBorderStyle);
    	}

    	function input5_change_input_handler() {
    		columnsHGap = to_number(this.value);
    		$$invalidate(5, columnsHGap);
    	}

    	function input6_change_input_handler() {
    		columnsVGap = to_number(this.value);
    		$$invalidate(6, columnsVGap);
    	}

    	const click_handler_8 = () => $$invalidate(1, advancedMode = !advancedMode);

    	function input0_input_handler_1() {
    		aStyle = this.value;
    		$$invalidate(17, aStyle);
    	}

    	function input1_input_handler_2() {
    		imageStyle = this.value;
    		$$invalidate(16, imageStyle);
    	}

    	function textarea_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			columnOutputTextArea = $$value;
    			$$invalidate(21, columnOutputTextArea);
    		});
    	}

    	function textarea_input_handler() {
    		columnOutputCode = this.value;
    		((((((((((((((((((((($$invalidate(26, columnOutputCode), $$invalidate(67, columnItemsChunked)), $$invalidate(68, getColChildItems)), $$invalidate(69, columnBetweenBorder)), $$invalidate(66, columnItems)), $$invalidate(4, imagesPerRow)), $$invalidate(17, aStyle)), $$invalidate(65, parsedImageStyle)), $$invalidate(11, columnBetweenBorderPaddingTop)), $$invalidate(12, columnBetweenBorderPaddingBottom)), $$invalidate(8, columnBetweenBorderThickness)), $$invalidate(9, columnBetweenBorderStyle)), $$invalidate(10, columnBetweenBorderColor)), $$invalidate(24, splitImages)), $$invalidate(25, splitUrls)), $$invalidate(16, imageStyle)), $$invalidate(23, colWidth)), $$invalidate(6, columnsVGap)), $$invalidate(5, columnsHGap)), $$invalidate(0, columnImages)), $$invalidate(2, columnUrls)), $$invalidate(18, maxWidth));
    	}

    	function input7_input_handler() {
    		apiKey = this.value;
    		$$invalidate(19, apiKey);
    	}

    	const click_handler_9 = () => $$invalidate(19, apiKey = "be378ccde22c3aa784133ae1fe4ed5ec-us2");
    	const click_handler_10 = () => apiKeyDialog.close();

    	function dialog_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			apiKeyDialog = $$value;
    			$$invalidate(3, apiKeyDialog);
    		});
    	}

    	$$self.$capture_state = () => ({
    		slide,
    		Mailchimp,
    		columnImages,
    		advancedMode,
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
    		getColChildItems,
    		columnOutputCode,
    		columnBetweenBorder
    	});

    	$$self.$inject_state = $$props => {
    		if ("Mailchimp" in $$props) Mailchimp = $$props.Mailchimp;
    		if ("columnImages" in $$props) $$invalidate(0, columnImages = $$props.columnImages);
    		if ("advancedMode" in $$props) $$invalidate(1, advancedMode = $$props.advancedMode);
    		if ("columnUrls" in $$props) $$invalidate(2, columnUrls = $$props.columnUrls);
    		if ("apiKeyDialog" in $$props) $$invalidate(3, apiKeyDialog = $$props.apiKeyDialog);
    		if ("imagesPerRow" in $$props) $$invalidate(4, imagesPerRow = $$props.imagesPerRow);
    		if ("columnsHGap" in $$props) $$invalidate(5, columnsHGap = $$props.columnsHGap);
    		if ("columnsVGap" in $$props) $$invalidate(6, columnsVGap = $$props.columnsVGap);
    		if ("folderId" in $$props) folderId = $$props.folderId;
    		if ("newFolderName" in $$props) $$invalidate(7, newFolderName = $$props.newFolderName);
    		if ("columnBetweenBorderThickness" in $$props) $$invalidate(8, columnBetweenBorderThickness = $$props.columnBetweenBorderThickness);
    		if ("columnBetweenBorderStyle" in $$props) $$invalidate(9, columnBetweenBorderStyle = $$props.columnBetweenBorderStyle);
    		if ("columnBetweenBorderColor" in $$props) $$invalidate(10, columnBetweenBorderColor = $$props.columnBetweenBorderColor);
    		if ("columnBetweenBorderPaddingTop" in $$props) $$invalidate(11, columnBetweenBorderPaddingTop = $$props.columnBetweenBorderPaddingTop);
    		if ("columnBetweenBorderPaddingBottom" in $$props) $$invalidate(12, columnBetweenBorderPaddingBottom = $$props.columnBetweenBorderPaddingBottom);
    		if ("columnCopiedToClipboardTxt" in $$props) $$invalidate(13, columnCopiedToClipboardTxt = $$props.columnCopiedToClipboardTxt);
    		if ("uploading" in $$props) $$invalidate(14, uploading = $$props.uploading);
    		if ("filesToUpload" in $$props) filesToUpload = $$props.filesToUpload;
    		if ("folders" in $$props) $$invalidate(15, folders = $$props.folders);
    		if ("imageStyle" in $$props) $$invalidate(16, imageStyle = $$props.imageStyle);
    		if ("aStyle" in $$props) $$invalidate(17, aStyle = $$props.aStyle);
    		if ("maxWidth" in $$props) $$invalidate(18, maxWidth = $$props.maxWidth);
    		if ("apiKey" in $$props) $$invalidate(19, apiKey = $$props.apiKey);
    		if ("connState" in $$props) $$invalidate(20, connState = $$props.connState);
    		if ("columnOutputTextArea" in $$props) $$invalidate(21, columnOutputTextArea = $$props.columnOutputTextArea);
    		if ("previewDebug" in $$props) previewDebug = $$props.previewDebug;
    		if ("uploadElement" in $$props) $$invalidate(22, uploadElement = $$props.uploadElement);
    		if ("currentBase64" in $$props) currentBase64 = $$props.currentBase64;
    		if ("currentFileName" in $$props) currentFileName = $$props.currentFileName;
    		if ("parsedImageStyle" in $$props) $$invalidate(65, parsedImageStyle = $$props.parsedImageStyle);
    		if ("colWidth" in $$props) $$invalidate(23, colWidth = $$props.colWidth);
    		if ("splitImages" in $$props) $$invalidate(24, splitImages = $$props.splitImages);
    		if ("splitUrls" in $$props) $$invalidate(25, splitUrls = $$props.splitUrls);
    		if ("columnItems" in $$props) $$invalidate(66, columnItems = $$props.columnItems);
    		if ("columnItemsChunked" in $$props) $$invalidate(67, columnItemsChunked = $$props.columnItemsChunked);
    		if ("getColChildItems" in $$props) $$invalidate(68, getColChildItems = $$props.getColChildItems);
    		if ("columnOutputCode" in $$props) $$invalidate(26, columnOutputCode = $$props.columnOutputCode);
    		if ("columnBetweenBorder" in $$props) $$invalidate(69, columnBetweenBorder = $$props.columnBetweenBorder);
    	};

    	let parsedImageStyle;
    	let splitImages;
    	let splitUrls;
    	let colWidth;
    	let columnItems;
    	let columnItemsChunked;
    	let getColChildItems;
    	let columnOutputCode;
    	let columnBetweenBorder;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*maxWidth, imagesPerRow, columnsHGap*/ 262192) {
    			 $$invalidate(23, colWidth = Math.round(maxWidth / imagesPerRow - columnsHGap * imagesPerRow - 6));
    		}

    		if ($$self.$$.dirty[0] & /*imageStyle, colWidth, columnsVGap, columnsHGap*/ 8454240) {
    			 $$invalidate(65, parsedImageStyle = imageStyle.replace("{columnWidth}", colWidth).replace("{setGap}", `${columnsVGap}px ${columnsHGap}px`));
    		}

    		if ($$self.$$.dirty[0] & /*columnImages*/ 1) {
    			 $$invalidate(24, splitImages = columnImages.trimEnd().split("\n"));
    		}

    		if ($$self.$$.dirty[0] & /*columnUrls*/ 4) {
    			 $$invalidate(25, splitUrls = columnUrls.trimEnd().split("\n"));
    		}

    		if ($$self.$$.dirty[0] & /*splitImages, splitUrls*/ 50331648) {
    			 $$invalidate(66, columnItems = splitImages.map(i => {
    				let index = splitImages.indexOf(i);
    				return { image: i, url: splitUrls[index] };
    			}));
    		}

    		if ($$self.$$.dirty[0] & /*imagesPerRow*/ 16 | $$self.$$.dirty[2] & /*columnItems*/ 16) {
    			 $$invalidate(67, columnItemsChunked = new Array(Math.ceil(columnItems.length / imagesPerRow)).fill().map((_, i) => columnItems.slice(i * imagesPerRow, i * imagesPerRow + imagesPerRow)));
    		}

    		if ($$self.$$.dirty[0] & /*aStyle*/ 131072 | $$self.$$.dirty[2] & /*parsedImageStyle*/ 8) {
    			 $$invalidate(68, getColChildItems = source => source.map(item => `\t<a href="${item.url}" style="${aStyle}">\n\t\t<img src="${item.image}" style="${parsedImageStyle}" />
      </a>`).join("\n"));
    		}

    		if ($$self.$$.dirty[0] & /*columnBetweenBorderPaddingTop, columnBetweenBorderPaddingBottom, columnBetweenBorderThickness, columnBetweenBorderStyle, columnBetweenBorderColor*/ 7936) {
    			 $$invalidate(69, columnBetweenBorder = `\n<div style="height: 1px; display: block; margin-top: ${columnBetweenBorderPaddingTop}px; margin-bottom: ${columnBetweenBorderPaddingBottom}px; ${columnBetweenBorderThickness > 0
			? `border-bottom: ${columnBetweenBorderThickness}px ${columnBetweenBorderStyle} ${columnBetweenBorderColor};`
			: ""}"></div>`);
    		}

    		if ($$self.$$.dirty[2] & /*columnItemsChunked, getColChildItems, columnBetweenBorder*/ 224) {
    			 $$invalidate(26, columnOutputCode = columnItemsChunked.map(item => `<div class="mcnTextContent" style="text-align: center; margin: 0; padding: 0; line-height: 1;">\n${getColChildItems(item)}\n</div>`).join(`${columnBetweenBorder}\n`));
    		}
    	};

    	return [
    		columnImages,
    		advancedMode,
    		columnUrls,
    		apiKeyDialog,
    		imagesPerRow,
    		columnsHGap,
    		columnsVGap,
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
    		click_handler,
    		click_handler_1,
    		input0_binding,
    		input1_input_handler,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		textarea0_input_handler,
    		textarea1_input_handler,
    		input0_change_input_handler,
    		input1_change_input_handler,
    		input2_change_input_handler,
    		input3_change_input_handler,
    		input4_change_input_handler,
    		input0_input_handler,
    		input1_input_handler_1,
    		select_change_handler,
    		input5_change_input_handler,
    		input6_change_input_handler,
    		click_handler_8,
    		input0_input_handler_1,
    		input1_input_handler_2,
    		textarea_binding,
    		textarea_input_handler,
    		input7_input_handler,
    		click_handler_9,
    		click_handler_10,
    		dialog_binding
    	];
    }

    class MultiColumn extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {}, [-1, -1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MultiColumn",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.24.1 */
    const file$2 = "src\\App.svelte";

    // (114:4) {#if process.platform === 'darwin'}
    function create_if_block_3$1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "✗";
    			set_style(button, "margin-right", "0.25rem");
    			attr_dev(button, "class", "macCloseBtn svelte-1j4qho1");
    			add_location(button, file$2, 114, 6, 2257);
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
    		source: "(114:4) {#if process.platform === 'darwin'}",
    		ctx
    	});

    	return block;
    }

    // (128:4) {#if process.platform !== 'darwin'}
    function create_if_block_2$1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "✗";
    			set_style(button, "margin-left", "auto");
    			set_style(button, "font-size", "1.5rem");
    			set_style(button, "padding-top", "0");
    			set_style(button, "padding-bottom", "0");
    			attr_dev(button, "class", "svelte-1j4qho1");
    			add_location(button, file$2, 128, 6, 2678);
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
    		source: "(128:4) {#if process.platform !== 'darwin'}",
    		ctx
    	});

    	return block;
    }

    // (144:4) {:else}
    function create_else_block$1(ctx) {
    	let h2;
    	let t1;
    	let br;
    	let t2;
    	let p0;
    	let t4;
    	let p1;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "About";
    			t1 = space();
    			br = element("br");
    			t2 = space();
    			p0 = element("p");
    			p0.textContent = "Mailchimp content generator 1.0";
    			t4 = space();
    			p1 = element("p");
    			p1.textContent = "(C) Goran Alković, 2020";
    			add_location(h2, file$2, 144, 6, 3083);
    			add_location(br, file$2, 145, 6, 3104);
    			attr_dev(p0, "class", "svelte-1j4qho1");
    			add_location(p0, file$2, 146, 6, 3117);
    			attr_dev(p1, "class", "svelte-1j4qho1");
    			add_location(p1, file$2, 147, 6, 3162);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, p1, anchor);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(p1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(144:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (140:31) 
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
    			add_location(div, file$2, 140, 6, 3001);
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
    				if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(buttongenerator.$$.fragment, local);
    			if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, false);
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
    		source: "(140:31) ",
    		ctx
    	});

    	return block;
    }

    // (136:4) {#if currentPage == 1}
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
    			add_location(div, file$2, 136, 6, 2903);
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
    				if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(multicolumn.$$.fragment, local);
    			if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, false);
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
    		source: "(136:4) {#if currentPage == 1}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
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
    	const if_block_creators = [create_if_block$2, create_if_block_1$1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*currentPage*/ ctx[0] == 1) return 0;
    		if (/*currentPage*/ ctx[0] == 2) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block2 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

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
    			if_block2.c();
    			attr_dev(button0, "class", "svelte-1j4qho1");
    			toggle_class(button0, "active", /*currentPage*/ ctx[0] == 1);
    			add_location(button0, file$2, 120, 4, 2398);
    			attr_dev(button1, "class", "svelte-1j4qho1");
    			toggle_class(button1, "active", /*currentPage*/ ctx[0] == 2);
    			add_location(button1, file$2, 123, 4, 2518);
    			attr_dev(div0, "class", "sidebar svelte-1j4qho1");
    			add_location(div0, file$2, 112, 2, 2189);
    			attr_dev(div1, "class", "content svelte-1j4qho1");
    			add_location(div1, file$2, 134, 2, 2848);
    			attr_dev(div2, "class", "grid svelte-1j4qho1");
    			add_location(div2, file$2, 111, 0, 2168);
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
    			if_blocks[current_block_type_index].m(div1, null);
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
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block2 = if_blocks[current_block_type_index];

    				if (!if_block2) {
    					if_block2 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block2.c();
    				}

    				transition_in(if_block2, 1);
    				if_block2.m(div1, null);
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
    			if_blocks[current_block_type_index].d();
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
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
