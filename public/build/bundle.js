
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
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
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
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
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

    function create_animation(node, from, fn, params) {
        if (!from)
            return noop;
        const to = node.getBoundingClientRect();
        if (from.left === to.left && from.right === to.right && from.top === to.top && from.bottom === to.bottom)
            return noop;
        const { delay = 0, duration = 300, easing = identity, 
        // @ts-ignore todo: should this be separated from destructuring? Or start/end added to public api and documentation?
        start: start_time = now() + delay, 
        // @ts-ignore todo:
        end = start_time + duration, tick = noop, css } = fn(node, { from, to }, params);
        let running = true;
        let started = false;
        let name;
        function start() {
            if (css) {
                name = create_rule(node, 0, 1, duration, delay, easing, css);
            }
            if (!delay) {
                started = true;
            }
        }
        function stop() {
            if (css)
                delete_rule(node, name);
            running = false;
        }
        loop(now => {
            if (!started && now >= start_time) {
                started = true;
            }
            if (started && now >= end) {
                tick(1, 0);
                stop();
            }
            if (!running) {
                return false;
            }
            if (started) {
                const p = now - start_time;
                const t = 0 + 1 * easing(p / duration);
                tick(t, 1 - t);
            }
            return true;
        });
        start();
        tick(0, 1);
        return stop;
    }
    function fix_position(node) {
        const style = getComputedStyle(node);
        if (style.position !== 'absolute' && style.position !== 'fixed') {
            const { width, height } = style;
            const a = node.getBoundingClientRect();
            node.style.position = 'absolute';
            node.style.width = width;
            node.style.height = height;
            add_transform(node, a);
        }
    }
    function add_transform(node, a) {
        const b = node.getBoundingClientRect();
        if (a.left !== b.left || a.top !== b.top) {
            const style = getComputedStyle(node);
            const transform = style.transform === 'none' ? '' : style.transform;
            node.style.transform = `${transform} translate(${a.left - b.left}px, ${a.top - b.top}px)`;
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
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

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                info.blocks[i] = null;
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function fix_and_destroy_block(block, lookup) {
        block.f();
        destroy_block(block, lookup);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error(`Cannot have duplicate keys in a keyed each`);
            }
            keys.add(key);
        }
    }
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

    function flip(node, animation, params) {
        const style = getComputedStyle(node);
        const transform = style.transform === 'none' ? '' : style.transform;
        const scaleX = animation.from.width / node.clientWidth;
        const scaleY = animation.from.height / node.clientHeight;
        const dx = (animation.from.left - animation.to.left) / scaleX;
        const dy = (animation.from.top - animation.to.top) / scaleY;
        const d = Math.sqrt(dx * dx + dy * dy);
        const { delay = 0, duration = (d) => Math.sqrt(d) * 120, easing = cubicOut } = params;
        return {
            delay,
            duration: is_function(duration) ? duration(d) : duration,
            easing,
            css: (_t, u) => `transform: ${transform} translate(${u * dx}px, ${u * dy}px);`
        };
    }

    /* src/Icon.svelte generated by Svelte v3.24.1 */

    const file$2 = "src/Icon.svelte";

    // (455:29) 
    function create_if_block_7(ctx) {
    	let svg;
    	let defs;
    	let clipPath;
    	let rect0;
    	let g1;
    	let path;
    	let g0;
    	let rect1;
    	let rect2;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			defs = svg_element("defs");
    			clipPath = svg_element("clipPath");
    			rect0 = svg_element("rect");
    			g1 = svg_element("g");
    			path = svg_element("path");
    			g0 = svg_element("g");
    			rect1 = svg_element("rect");
    			rect2 = svg_element("rect");
    			attr_dev(rect0, "width", "16");
    			attr_dev(rect0, "height", "16");
    			add_location(rect0, file$2, 463, 8, 13559);
    			attr_dev(clipPath, "id", "clip-imgStyle");
    			add_location(clipPath, file$2, 462, 6, 13521);
    			add_location(defs, file$2, 461, 4, 13508);
    			attr_dev(path, "id", "Path_1");
    			attr_dev(path, "data-name", "Path 1");
    			attr_dev(path, "d", "M-5.2,0V-.713h1.035V-3.458h-.99v-.711h1.89V-.713h.945V0Zm1.431-4.914a.557.557,0,0,1-.409-.166.536.536,0,0,1-.167-.391.549.549,0,0,1,.162-.405.561.561,0,0,1,.414-.162.568.568,0,0,1,.41.171.537.537,0,0,1,.176.4.523.523,0,0,1-.176.391A.576.576,0,0,1-3.771-4.916ZM-1.953,0V-4.167h.765v.342a1.058,1.058,0,0,1,.22-.238,1.028,1.028,0,0,1,.261-.148.779.779,0,0,1,.283-.054A.755.755,0,0,1-.117-4.2a.747.747,0,0,1,.252.18A.744.744,0,0,1,.3-3.717a.984.984,0,0,1,.22-.3A.981.981,0,0,1,.824-4.2,1.031,1.031,0,0,1,1.2-4.266a.772.772,0,0,1,.374.086.751.751,0,0,1,.261.234,1.036,1.036,0,0,1,.153.36,1.8,1.8,0,0,1,.041.473V0H1.242V-2.88a2.221,2.221,0,0,0-.036-.468.37.37,0,0,0-.1-.207.245.245,0,0,0-.158-.054.361.361,0,0,0-.257.122.9.9,0,0,0-.2.328A1.316,1.316,0,0,0,.414-2.7V0H-.342V-2.844a1.626,1.626,0,0,0-.076-.621.272.272,0,0,0-.266-.153.307.307,0,0,0-.176.059.584.584,0,0,0-.158.171.921.921,0,0,0-.112.275,1.569,1.569,0,0,0-.041.378V0ZM4.239,1.584a3.909,3.909,0,0,1-.783-.072,2.058,2.058,0,0,1-.6-.211A1.012,1.012,0,0,1,2.484.959.843.843,0,0,1,2.358.5.837.837,0,0,1,2.466.081a1.11,1.11,0,0,1,.288-.329,1.327,1.327,0,0,1,.4-.211l.4.18a2.289,2.289,0,0,0-.252.18.66.66,0,0,0-.167.2.568.568,0,0,0-.058.266A.336.336,0,0,0,3.159.6a.654.654,0,0,0,.252.162,1.906,1.906,0,0,0,.387.1A3.208,3.208,0,0,0,4.3.9,2.332,2.332,0,0,0,4.914.832.79.79,0,0,0,5.279.639.4.4,0,0,0,5.4.351.413.413,0,0,0,5.328.094a.476.476,0,0,0-.27-.144A2.531,2.531,0,0,0,4.482-.1Q4.176-.1,3.9-.122a2.756,2.756,0,0,1-.5-.086A1.69,1.69,0,0,1,3-.369a.756.756,0,0,1-.266-.247.648.648,0,0,1-.095-.356.809.809,0,0,1,.162-.49,1.9,1.9,0,0,1,.4-.4l.4.252q-.081.09-.144.153a.678.678,0,0,0-.1.122A.261.261,0,0,0,3.33-1.2a.233.233,0,0,0,.135.2A1.159,1.159,0,0,0,3.9-.882a7.117,7.117,0,0,0,.806.036,2.484,2.484,0,0,1,.706.085,1.1,1.1,0,0,1,.446.239.866.866,0,0,1,.229.346,1.291,1.291,0,0,1,.068.428,1.177,1.177,0,0,1-.108.491,1.191,1.191,0,0,1-.338.427,1.725,1.725,0,0,1-.594.3A3,3,0,0,1,4.239,1.584ZM4.122-1.4A1.562,1.562,0,0,1,3.339-1.6,1.432,1.432,0,0,1,2.8-2.115a1.394,1.394,0,0,1-.194-.729A1.418,1.418,0,0,1,2.8-3.578,1.421,1.421,0,0,1,3.339-4.1a1.562,1.562,0,0,1,.783-.194,1.581,1.581,0,0,1,.792.194,1.421,1.421,0,0,1,.535.522,1.418,1.418,0,0,1,.194.734,1.394,1.394,0,0,1-.194.729,1.432,1.432,0,0,1-.535.518A1.581,1.581,0,0,1,4.122-1.4Zm0-.675a.776.776,0,0,0,.4-.1.719.719,0,0,0,.27-.275.783.783,0,0,0,.1-.391.752.752,0,0,0-.1-.391A.73.73,0,0,0,4.514-3.5a.783.783,0,0,0-.391-.1.741.741,0,0,0-.378.1.764.764,0,0,0-.275.27.733.733,0,0,0-.1.387.765.765,0,0,0,.1.383.753.753,0,0,0,.27.279A.733.733,0,0,0,4.122-2.079Zm1.269-1.35-.342-.423a1.913,1.913,0,0,1,.571-.329,1.656,1.656,0,0,1,.688-.086l.09.639a1.911,1.911,0,0,0-.54,0A1.045,1.045,0,0,0,5.391-3.429Z");
    			attr_dev(path, "transform", "translate(7.452 10.291)");
    			attr_dev(path, "fill", "#176efc");
    			add_location(path, file$2, 467, 6, 13681);
    			attr_dev(rect1, "width", "14");
    			attr_dev(rect1, "height", "14");
    			attr_dev(rect1, "rx", "0.5");
    			attr_dev(rect1, "stroke", "none");
    			add_location(rect1, file$2, 482, 8, 16752);
    			attr_dev(rect2, "x", "-0.5");
    			attr_dev(rect2, "y", "-0.5");
    			attr_dev(rect2, "width", "15");
    			attr_dev(rect2, "height", "15");
    			attr_dev(rect2, "rx", "1");
    			attr_dev(rect2, "fill", "none");
    			add_location(rect2, file$2, 483, 8, 16815);
    			attr_dev(g0, "id", "Rectangle_5");
    			attr_dev(g0, "data-name", "Rectangle 5");
    			attr_dev(g0, "transform", "translate(1 1)");
    			attr_dev(g0, "fill", "none");
    			attr_dev(g0, "stroke", "gray");
    			attr_dev(g0, "stroke-linecap", "round");
    			attr_dev(g0, "stroke-linejoin", "round");
    			attr_dev(g0, "stroke-width", "1");
    			add_location(g0, file$2, 473, 6, 16518);
    			attr_dev(g1, "id", "imgStyle");
    			attr_dev(g1, "clip-path", "url(#clip-imgStyle)");
    			add_location(g1, file$2, 466, 4, 13625);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr_dev(svg, "width", "16");
    			attr_dev(svg, "height", "16");
    			attr_dev(svg, "viewBox", "0 0 16 16");
    			add_location(svg, file$2, 455, 2, 13357);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, defs);
    			append_dev(defs, clipPath);
    			append_dev(clipPath, rect0);
    			append_dev(svg, g1);
    			append_dev(g1, path);
    			append_dev(g1, g0);
    			append_dev(g0, rect1);
    			append_dev(g0, rect2);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(455:29) ",
    		ctx
    	});

    	return block;
    }

    // (422:27) 
    function create_if_block_6(ctx) {
    	let svg;
    	let defs;
    	let clipPath;
    	let rect0;
    	let g1;
    	let path;
    	let g0;
    	let rect1;
    	let rect2;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			defs = svg_element("defs");
    			clipPath = svg_element("clipPath");
    			rect0 = svg_element("rect");
    			g1 = svg_element("g");
    			path = svg_element("path");
    			g0 = svg_element("g");
    			rect1 = svg_element("rect");
    			rect2 = svg_element("rect");
    			attr_dev(rect0, "width", "16");
    			attr_dev(rect0, "height", "16");
    			add_location(rect0, file$2, 430, 8, 11704);
    			attr_dev(clipPath, "id", "clip-aStyle");
    			add_location(clipPath, file$2, 429, 6, 11668);
    			add_location(defs, file$2, 428, 4, 11655);
    			attr_dev(path, "id", "Path_2");
    			attr_dev(path, "data-name", "Path 2");
    			attr_dev(path, "d", "M-.528.121a1.994,1.994,0,0,1-1.315-.39A1.263,1.263,0,0,1-2.31-1.287a1.487,1.487,0,0,1,.192-.753,1.75,1.75,0,0,1,.55-.578A2.875,2.875,0,0,1-.7-3,4.368,4.368,0,0,1,.44-3.135q.132,0,.281.006t.319.016l.346.022.033.781q-.154-.022-.325-.033T.759-2.354H.451a3.969,3.969,0,0,0-.743.061,1.608,1.608,0,0,0-.517.181.812.812,0,0,0-.3.3.816.816,0,0,0-.1.407.743.743,0,0,0,.066.325.523.523,0,0,0,.181.215.852.852,0,0,0,.275.116,1.475,1.475,0,0,0,.346.039A1.572,1.572,0,0,0,.3-.836a1.238,1.238,0,0,0,.467-.357,1.608,1.608,0,0,0,.291-.594,3.174,3.174,0,0,0,.1-.842,2.925,2.925,0,0,0-.148-1.045.926.926,0,0,0-.435-.517,1.592,1.592,0,0,0-.715-.143,2,2,0,0,0-.677.115,1.728,1.728,0,0,0-.633.424l-.583-.66a2.569,2.569,0,0,1,.919-.572A3.079,3.079,0,0,1-.088-5.2a3.315,3.315,0,0,1,.9.115,1.913,1.913,0,0,1,.726.379,1.7,1.7,0,0,1,.484.715,3.272,3.272,0,0,1,.171,1.144V0H1.045V-.627a1.663,1.663,0,0,1-.319.368,1.405,1.405,0,0,1-.379.231A1.856,1.856,0,0,1-.077.088,3.037,3.037,0,0,1-.528.121Z");
    			attr_dev(path, "transform", "translate(7.91 10.703)");
    			attr_dev(path, "fill", "#176efc");
    			add_location(path, file$2, 434, 6, 11822);
    			attr_dev(rect1, "width", "14");
    			attr_dev(rect1, "height", "14");
    			attr_dev(rect1, "rx", "0.5");
    			attr_dev(rect1, "stroke", "none");
    			add_location(rect1, file$2, 449, 8, 13164);
    			attr_dev(rect2, "x", "-0.5");
    			attr_dev(rect2, "y", "-0.5");
    			attr_dev(rect2, "width", "15");
    			attr_dev(rect2, "height", "15");
    			attr_dev(rect2, "rx", "1");
    			attr_dev(rect2, "fill", "none");
    			add_location(rect2, file$2, 450, 8, 13227);
    			attr_dev(g0, "id", "Rectangle_5");
    			attr_dev(g0, "data-name", "Rectangle 5");
    			attr_dev(g0, "transform", "translate(1 1)");
    			attr_dev(g0, "fill", "none");
    			attr_dev(g0, "stroke", "gray");
    			attr_dev(g0, "stroke-linecap", "round");
    			attr_dev(g0, "stroke-linejoin", "round");
    			attr_dev(g0, "stroke-width", "1");
    			add_location(g0, file$2, 440, 6, 12930);
    			attr_dev(g1, "id", "aStyle");
    			attr_dev(g1, "clip-path", "url(#clip-aStyle)");
    			add_location(g1, file$2, 433, 4, 11770);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr_dev(svg, "width", "16");
    			attr_dev(svg, "height", "16");
    			attr_dev(svg, "viewBox", "0 0 16 16");
    			add_location(svg, file$2, 422, 2, 11504);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, defs);
    			append_dev(defs, clipPath);
    			append_dev(clipPath, rect0);
    			append_dev(svg, g1);
    			append_dev(g1, path);
    			append_dev(g1, g0);
    			append_dev(g0, rect1);
    			append_dev(g0, rect2);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(422:27) ",
    		ctx
    	});

    	return block;
    }

    // (375:27) 
    function create_if_block_5(ctx) {
    	let svg;
    	let defs;
    	let clipPath;
    	let rect0;
    	let g2;
    	let rect1;
    	let g0;
    	let rect2;
    	let rect3;
    	let g1;
    	let rect4;
    	let rect5;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			defs = svg_element("defs");
    			clipPath = svg_element("clipPath");
    			rect0 = svg_element("rect");
    			g2 = svg_element("g");
    			rect1 = svg_element("rect");
    			g0 = svg_element("g");
    			rect2 = svg_element("rect");
    			rect3 = svg_element("rect");
    			g1 = svg_element("g");
    			rect4 = svg_element("rect");
    			rect5 = svg_element("rect");
    			attr_dev(rect0, "width", "16");
    			attr_dev(rect0, "height", "16");
    			add_location(rect0, file$2, 383, 8, 10387);
    			attr_dev(clipPath, "id", "clip-border");
    			add_location(clipPath, file$2, 382, 6, 10351);
    			add_location(defs, file$2, 381, 4, 10338);
    			attr_dev(rect1, "id", "Rectangle_2");
    			attr_dev(rect1, "data-name", "Rectangle 2");
    			attr_dev(rect1, "width", "14.5");
    			attr_dev(rect1, "height", "1");
    			attr_dev(rect1, "rx", "0.5");
    			attr_dev(rect1, "transform", "translate(1 7.5)");
    			attr_dev(rect1, "fill", "#176efc");
    			add_location(rect1, file$2, 387, 6, 10505);
    			attr_dev(rect2, "width", "14");
    			attr_dev(rect2, "height", "12");
    			attr_dev(rect2, "rx", "0.5");
    			attr_dev(rect2, "stroke", "none");
    			add_location(rect2, file$2, 404, 8, 10929);
    			attr_dev(rect3, "x", "-0.5");
    			attr_dev(rect3, "y", "-0.5");
    			attr_dev(rect3, "width", "15");
    			attr_dev(rect3, "height", "13");
    			attr_dev(rect3, "rx", "1");
    			attr_dev(rect3, "fill", "none");
    			add_location(rect3, file$2, 405, 8, 10992);
    			attr_dev(g0, "id", "Rectangle_1");
    			attr_dev(g0, "data-name", "Rectangle 1");
    			attr_dev(g0, "transform", "translate(1 -9)");
    			attr_dev(g0, "fill", "none");
    			attr_dev(g0, "stroke", "gray");
    			attr_dev(g0, "stroke-linecap", "round");
    			attr_dev(g0, "stroke-linejoin", "round");
    			attr_dev(g0, "stroke-width", "1");
    			add_location(g0, file$2, 395, 6, 10694);
    			attr_dev(rect4, "width", "14");
    			attr_dev(rect4, "height", "12");
    			attr_dev(rect4, "rx", "0.5");
    			attr_dev(rect4, "stroke", "none");
    			add_location(rect4, file$2, 416, 8, 11313);
    			attr_dev(rect5, "x", "-0.5");
    			attr_dev(rect5, "y", "-0.5");
    			attr_dev(rect5, "width", "15");
    			attr_dev(rect5, "height", "13");
    			attr_dev(rect5, "rx", "1");
    			attr_dev(rect5, "fill", "none");
    			add_location(rect5, file$2, 417, 8, 11376);
    			attr_dev(g1, "id", "Rectangle_4");
    			attr_dev(g1, "data-name", "Rectangle 4");
    			attr_dev(g1, "transform", "translate(1 13)");
    			attr_dev(g1, "fill", "none");
    			attr_dev(g1, "stroke", "gray");
    			attr_dev(g1, "stroke-linecap", "round");
    			attr_dev(g1, "stroke-linejoin", "round");
    			attr_dev(g1, "stroke-width", "1");
    			add_location(g1, file$2, 407, 6, 11078);
    			attr_dev(g2, "id", "border");
    			attr_dev(g2, "clip-path", "url(#clip-border)");
    			add_location(g2, file$2, 386, 4, 10453);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr_dev(svg, "width", "16");
    			attr_dev(svg, "height", "16");
    			attr_dev(svg, "viewBox", "0 0 16 16");
    			add_location(svg, file$2, 375, 2, 10187);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, defs);
    			append_dev(defs, clipPath);
    			append_dev(clipPath, rect0);
    			append_dev(svg, g2);
    			append_dev(g2, rect1);
    			append_dev(g2, g0);
    			append_dev(g0, rect2);
    			append_dev(g0, rect3);
    			append_dev(g2, g1);
    			append_dev(g1, rect4);
    			append_dev(g1, rect5);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(375:27) ",
    		ctx
    	});

    	return block;
    }

    // (273:27) 
    function create_if_block_4(ctx) {
    	let svg;
    	let defs;
    	let clipPath;
    	let rect0;
    	let g5;
    	let g0;
    	let rect1;
    	let rect2;
    	let g1;
    	let rect3;
    	let rect4;
    	let rect5;
    	let g4;
    	let line0;
    	let g2;
    	let line1;
    	let line2;
    	let g3;
    	let line3;
    	let line4;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			defs = svg_element("defs");
    			clipPath = svg_element("clipPath");
    			rect0 = svg_element("rect");
    			g5 = svg_element("g");
    			g0 = svg_element("g");
    			rect1 = svg_element("rect");
    			rect2 = svg_element("rect");
    			g1 = svg_element("g");
    			rect3 = svg_element("rect");
    			rect4 = svg_element("rect");
    			rect5 = svg_element("rect");
    			g4 = svg_element("g");
    			line0 = svg_element("line");
    			g2 = svg_element("g");
    			line1 = svg_element("line");
    			line2 = svg_element("line");
    			g3 = svg_element("g");
    			line3 = svg_element("line");
    			line4 = svg_element("line");
    			attr_dev(rect0, "width", "16");
    			attr_dev(rect0, "height", "16");
    			add_location(rect0, file$2, 281, 8, 7529);
    			attr_dev(clipPath, "id", "clip-horGap");
    			add_location(clipPath, file$2, 280, 6, 7493);
    			add_location(defs, file$2, 279, 4, 7480);
    			attr_dev(rect1, "width", "12");
    			attr_dev(rect1, "height", "14");
    			attr_dev(rect1, "rx", "0.5");
    			attr_dev(rect1, "stroke", "none");
    			add_location(rect1, file$2, 294, 8, 7882);
    			attr_dev(rect2, "x", "-0.5");
    			attr_dev(rect2, "y", "-0.5");
    			attr_dev(rect2, "width", "13");
    			attr_dev(rect2, "height", "15");
    			attr_dev(rect2, "rx", "1");
    			attr_dev(rect2, "fill", "none");
    			add_location(rect2, file$2, 295, 8, 7945);
    			attr_dev(g0, "id", "Rectangle_4");
    			attr_dev(g0, "data-name", "Rectangle 4");
    			attr_dev(g0, "transform", "translate(15 1)");
    			attr_dev(g0, "fill", "none");
    			attr_dev(g0, "stroke", "gray");
    			attr_dev(g0, "stroke-linecap", "round");
    			attr_dev(g0, "stroke-linejoin", "round");
    			attr_dev(g0, "stroke-width", "1");
    			add_location(g0, file$2, 285, 6, 7647);
    			attr_dev(rect3, "width", "12");
    			attr_dev(rect3, "height", "14");
    			attr_dev(rect3, "rx", "0.5");
    			attr_dev(rect3, "stroke", "none");
    			add_location(rect3, file$2, 306, 8, 8267);
    			attr_dev(rect4, "x", "-0.5");
    			attr_dev(rect4, "y", "-0.5");
    			attr_dev(rect4, "width", "13");
    			attr_dev(rect4, "height", "15");
    			attr_dev(rect4, "rx", "1");
    			attr_dev(rect4, "fill", "none");
    			add_location(rect4, file$2, 307, 8, 8330);
    			attr_dev(g1, "id", "Rectangle_1");
    			attr_dev(g1, "data-name", "Rectangle 1");
    			attr_dev(g1, "transform", "translate(-11 1)");
    			attr_dev(g1, "fill", "none");
    			attr_dev(g1, "stroke", "gray");
    			attr_dev(g1, "stroke-linecap", "round");
    			attr_dev(g1, "stroke-linejoin", "round");
    			attr_dev(g1, "stroke-width", "1");
    			add_location(g1, file$2, 297, 6, 8031);
    			attr_dev(rect5, "id", "Rectangle_2");
    			attr_dev(rect5, "data-name", "Rectangle 2");
    			attr_dev(rect5, "width", "10");
    			attr_dev(rect5, "height", "7");
    			attr_dev(rect5, "rx", "0.5");
    			attr_dev(rect5, "transform", "translate(3 2)");
    			attr_dev(rect5, "fill", "#176efc");
    			attr_dev(rect5, "opacity", "0.4");
    			add_location(rect5, file$2, 309, 6, 8416);
    			attr_dev(line0, "id", "Line_4");
    			attr_dev(line0, "data-name", "Line 4");
    			attr_dev(line0, "x2", "6");
    			attr_dev(line0, "transform", "translate(2.5 8)");
    			attr_dev(line0, "fill", "none");
    			attr_dev(line0, "stroke", "#176efc");
    			attr_dev(line0, "stroke-linecap", "round");
    			attr_dev(line0, "stroke-width", "1.5");
    			add_location(line0, file$2, 319, 8, 8697);
    			attr_dev(line1, "id", "Line_5");
    			attr_dev(line1, "data-name", "Line 5");
    			attr_dev(line1, "x2", "2");
    			attr_dev(line1, "y2", "1.5");
    			attr_dev(line1, "transform", "translate(1 8)");
    			attr_dev(line1, "fill", "none");
    			attr_dev(line1, "stroke", "#176efc");
    			attr_dev(line1, "stroke-linecap", "round");
    			attr_dev(line1, "stroke-width", "1.5");
    			add_location(line1, file$2, 329, 10, 8979);
    			attr_dev(line2, "id", "Line_6");
    			attr_dev(line2, "data-name", "Line 6");
    			attr_dev(line2, "y1", "1.5");
    			attr_dev(line2, "x2", "2");
    			attr_dev(line2, "transform", "translate(1 6.5)");
    			attr_dev(line2, "fill", "none");
    			attr_dev(line2, "stroke", "#176efc");
    			attr_dev(line2, "stroke-linecap", "round");
    			attr_dev(line2, "stroke-width", "1.5");
    			add_location(line2, file$2, 339, 10, 9251);
    			attr_dev(g2, "id", "Group_1");
    			attr_dev(g2, "data-name", "Group 1");
    			add_location(g2, file$2, 328, 8, 8932);
    			attr_dev(line3, "id", "Line_5-2");
    			attr_dev(line3, "data-name", "Line 5");
    			attr_dev(line3, "x1", "2");
    			attr_dev(line3, "y2", "1.5");
    			attr_dev(line3, "transform", "translate(0 1.5)");
    			attr_dev(line3, "fill", "none");
    			attr_dev(line3, "stroke", "#176efc");
    			attr_dev(line3, "stroke-linecap", "round");
    			attr_dev(line3, "stroke-width", "1.5");
    			add_location(line3, file$2, 351, 10, 9614);
    			attr_dev(line4, "id", "Line_6-2");
    			attr_dev(line4, "data-name", "Line 6");
    			attr_dev(line4, "x1", "2");
    			attr_dev(line4, "y1", "1.5");
    			attr_dev(line4, "fill", "none");
    			attr_dev(line4, "stroke", "#176efc");
    			attr_dev(line4, "stroke-linecap", "round");
    			attr_dev(line4, "stroke-width", "1.5");
    			add_location(line4, file$2, 361, 10, 9890);
    			attr_dev(g3, "id", "Group_2");
    			attr_dev(g3, "data-name", "Group 2");
    			attr_dev(g3, "transform", "translate(7.5 6.5)");
    			add_location(g3, file$2, 350, 8, 9536);
    			attr_dev(g4, "id", "Group_5");
    			attr_dev(g4, "data-name", "Group 5");
    			attr_dev(g4, "transform", "translate(3 4.5)");
    			add_location(g4, file$2, 318, 6, 8623);
    			attr_dev(g5, "id", "horGap");
    			attr_dev(g5, "clip-path", "url(#clip-horGap)");
    			add_location(g5, file$2, 284, 4, 7595);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr_dev(svg, "width", "16");
    			attr_dev(svg, "height", "16");
    			attr_dev(svg, "viewBox", "0 0 16 16");
    			add_location(svg, file$2, 273, 2, 7329);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, defs);
    			append_dev(defs, clipPath);
    			append_dev(clipPath, rect0);
    			append_dev(svg, g5);
    			append_dev(g5, g0);
    			append_dev(g0, rect1);
    			append_dev(g0, rect2);
    			append_dev(g5, g1);
    			append_dev(g1, rect3);
    			append_dev(g1, rect4);
    			append_dev(g5, rect5);
    			append_dev(g5, g4);
    			append_dev(g4, line0);
    			append_dev(g4, g2);
    			append_dev(g2, line1);
    			append_dev(g2, line2);
    			append_dev(g4, g3);
    			append_dev(g3, line3);
    			append_dev(g3, line4);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(273:27) ",
    		ctx
    	});

    	return block;
    }

    // (201:32) 
    function create_if_block_3(ctx) {
    	let svg;
    	let defs;
    	let clipPath;
    	let rect0;
    	let g3;
    	let rect1;
    	let g0;
    	let rect2;
    	let rect3;
    	let g1;
    	let rect4;
    	let rect5;
    	let g2;
    	let line0;
    	let line1;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			defs = svg_element("defs");
    			clipPath = svg_element("clipPath");
    			rect0 = svg_element("rect");
    			g3 = svg_element("g");
    			rect1 = svg_element("rect");
    			g0 = svg_element("g");
    			rect2 = svg_element("rect");
    			rect3 = svg_element("rect");
    			g1 = svg_element("g");
    			rect4 = svg_element("rect");
    			rect5 = svg_element("rect");
    			g2 = svg_element("g");
    			line0 = svg_element("line");
    			line1 = svg_element("line");
    			attr_dev(rect0, "width", "16");
    			attr_dev(rect0, "height", "16");
    			add_location(rect0, file$2, 209, 8, 5602);
    			attr_dev(clipPath, "id", "clip-btmSpc");
    			add_location(clipPath, file$2, 208, 6, 5566);
    			add_location(defs, file$2, 207, 4, 5553);
    			attr_dev(rect1, "id", "Rectangle_2");
    			attr_dev(rect1, "data-name", "Rectangle 2");
    			attr_dev(rect1, "width", "12.5");
    			attr_dev(rect1, "height", "7");
    			attr_dev(rect1, "rx", "0.5");
    			attr_dev(rect1, "transform", "translate(2 1)");
    			attr_dev(rect1, "fill", "#176efc");
    			attr_dev(rect1, "opacity", "0.4");
    			add_location(rect1, file$2, 213, 6, 5720);
    			attr_dev(rect2, "width", "14");
    			attr_dev(rect2, "height", "12");
    			attr_dev(rect2, "rx", "0.5");
    			attr_dev(rect2, "stroke", "none");
    			add_location(rect2, file$2, 231, 8, 6165);
    			attr_dev(rect3, "x", "-0.5");
    			attr_dev(rect3, "y", "-0.5");
    			attr_dev(rect3, "width", "15");
    			attr_dev(rect3, "height", "13");
    			attr_dev(rect3, "rx", "1");
    			attr_dev(rect3, "fill", "none");
    			add_location(rect3, file$2, 232, 8, 6228);
    			attr_dev(g0, "id", "Rectangle_1");
    			attr_dev(g0, "data-name", "Rectangle 1");
    			attr_dev(g0, "transform", "translate(1 -11)");
    			attr_dev(g0, "fill", "none");
    			attr_dev(g0, "stroke", "gray");
    			attr_dev(g0, "stroke-linecap", "round");
    			attr_dev(g0, "stroke-linejoin", "round");
    			attr_dev(g0, "stroke-width", "1");
    			add_location(g0, file$2, 222, 6, 5929);
    			attr_dev(rect4, "width", "14");
    			attr_dev(rect4, "height", "12");
    			attr_dev(rect4, "rx", "0.5");
    			attr_dev(rect4, "stroke", "none");
    			add_location(rect4, file$2, 243, 8, 6549);
    			attr_dev(rect5, "x", "-0.5");
    			attr_dev(rect5, "y", "-0.5");
    			attr_dev(rect5, "width", "15");
    			attr_dev(rect5, "height", "13");
    			attr_dev(rect5, "rx", "1");
    			attr_dev(rect5, "fill", "none");
    			add_location(rect5, file$2, 244, 8, 6612);
    			attr_dev(g1, "id", "Rectangle_4");
    			attr_dev(g1, "data-name", "Rectangle 4");
    			attr_dev(g1, "transform", "translate(1 15)");
    			attr_dev(g1, "fill", "none");
    			attr_dev(g1, "stroke", "gray");
    			attr_dev(g1, "stroke-linecap", "round");
    			attr_dev(g1, "stroke-linejoin", "round");
    			attr_dev(g1, "stroke-width", "1");
    			add_location(g1, file$2, 234, 6, 6314);
    			attr_dev(line0, "id", "Line_5");
    			attr_dev(line0, "data-name", "Line 5");
    			attr_dev(line0, "x1", "2");
    			attr_dev(line0, "y1", "1.5");
    			attr_dev(line0, "fill", "none");
    			attr_dev(line0, "stroke", "#176efc");
    			attr_dev(line0, "stroke-linecap", "round");
    			attr_dev(line0, "stroke-width", "1.5");
    			add_location(line0, file$2, 250, 8, 6809);
    			attr_dev(line1, "id", "Line_6");
    			attr_dev(line1, "data-name", "Line 6");
    			attr_dev(line1, "x1", "2");
    			attr_dev(line1, "y2", "1.5");
    			attr_dev(line1, "transform", "translate(0 1.5)");
    			attr_dev(line1, "fill", "none");
    			attr_dev(line1, "stroke", "#176efc");
    			attr_dev(line1, "stroke-linecap", "round");
    			attr_dev(line1, "stroke-width", "1.5");
    			add_location(line1, file$2, 259, 8, 7024);
    			attr_dev(g2, "id", "Group_4");
    			attr_dev(g2, "data-name", "Group 4");
    			attr_dev(g2, "transform", "translate(9.5 9.5) rotate(90)");
    			add_location(g2, file$2, 246, 6, 6698);
    			attr_dev(g3, "id", "btmSpc");
    			attr_dev(g3, "clip-path", "url(#clip-btmSpc)");
    			add_location(g3, file$2, 212, 4, 5668);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr_dev(svg, "width", "16");
    			attr_dev(svg, "height", "16");
    			attr_dev(svg, "viewBox", "0 0 16 16");
    			add_location(svg, file$2, 201, 2, 5402);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, defs);
    			append_dev(defs, clipPath);
    			append_dev(clipPath, rect0);
    			append_dev(svg, g3);
    			append_dev(g3, rect1);
    			append_dev(g3, g0);
    			append_dev(g0, rect2);
    			append_dev(g0, rect3);
    			append_dev(g3, g1);
    			append_dev(g1, rect4);
    			append_dev(g1, rect5);
    			append_dev(g3, g2);
    			append_dev(g2, line0);
    			append_dev(g2, line1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(201:32) ",
    		ctx
    	});

    	return block;
    }

    // (129:29) 
    function create_if_block_2(ctx) {
    	let svg;
    	let defs;
    	let clipPath;
    	let rect0;
    	let g3;
    	let g0;
    	let rect1;
    	let rect2;
    	let rect3;
    	let g1;
    	let rect4;
    	let rect5;
    	let g2;
    	let line0;
    	let line1;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			defs = svg_element("defs");
    			clipPath = svg_element("clipPath");
    			rect0 = svg_element("rect");
    			g3 = svg_element("g");
    			g0 = svg_element("g");
    			rect1 = svg_element("rect");
    			rect2 = svg_element("rect");
    			rect3 = svg_element("rect");
    			g1 = svg_element("g");
    			rect4 = svg_element("rect");
    			rect5 = svg_element("rect");
    			g2 = svg_element("g");
    			line0 = svg_element("line");
    			line1 = svg_element("line");
    			attr_dev(rect0, "width", "16");
    			attr_dev(rect0, "height", "16");
    			add_location(rect0, file$2, 137, 8, 3669);
    			attr_dev(clipPath, "id", "clip-topSpc");
    			add_location(clipPath, file$2, 136, 6, 3633);
    			add_location(defs, file$2, 135, 4, 3620);
    			attr_dev(rect1, "width", "14");
    			attr_dev(rect1, "height", "12");
    			attr_dev(rect1, "rx", "0.5");
    			attr_dev(rect1, "stroke", "none");
    			add_location(rect1, file$2, 150, 8, 4023);
    			attr_dev(rect2, "x", "-0.5");
    			attr_dev(rect2, "y", "-0.5");
    			attr_dev(rect2, "width", "15");
    			attr_dev(rect2, "height", "13");
    			attr_dev(rect2, "rx", "1");
    			attr_dev(rect2, "fill", "none");
    			add_location(rect2, file$2, 151, 8, 4086);
    			attr_dev(g0, "id", "Rectangle_1");
    			attr_dev(g0, "data-name", "Rectangle 1");
    			attr_dev(g0, "transform", "translate(1 -11)");
    			attr_dev(g0, "fill", "none");
    			attr_dev(g0, "stroke", "gray");
    			attr_dev(g0, "stroke-linecap", "round");
    			attr_dev(g0, "stroke-linejoin", "round");
    			attr_dev(g0, "stroke-width", "1");
    			add_location(g0, file$2, 141, 6, 3787);
    			attr_dev(rect3, "id", "Rectangle_2");
    			attr_dev(rect3, "data-name", "Rectangle 2");
    			attr_dev(rect3, "width", "12.5");
    			attr_dev(rect3, "height", "7");
    			attr_dev(rect3, "rx", "0.5");
    			attr_dev(rect3, "transform", "translate(2 8)");
    			attr_dev(rect3, "fill", "#176efc");
    			attr_dev(rect3, "opacity", "0.4");
    			add_location(rect3, file$2, 153, 6, 4172);
    			attr_dev(rect4, "width", "14");
    			attr_dev(rect4, "height", "12");
    			attr_dev(rect4, "rx", "0.5");
    			attr_dev(rect4, "stroke", "none");
    			add_location(rect4, file$2, 171, 8, 4616);
    			attr_dev(rect5, "x", "-0.5");
    			attr_dev(rect5, "y", "-0.5");
    			attr_dev(rect5, "width", "15");
    			attr_dev(rect5, "height", "13");
    			attr_dev(rect5, "rx", "1");
    			attr_dev(rect5, "fill", "none");
    			add_location(rect5, file$2, 172, 8, 4679);
    			attr_dev(g1, "id", "Rectangle_4");
    			attr_dev(g1, "data-name", "Rectangle 4");
    			attr_dev(g1, "transform", "translate(1 15)");
    			attr_dev(g1, "fill", "none");
    			attr_dev(g1, "stroke", "gray");
    			attr_dev(g1, "stroke-linecap", "round");
    			attr_dev(g1, "stroke-linejoin", "round");
    			attr_dev(g1, "stroke-width", "1");
    			add_location(g1, file$2, 162, 6, 4381);
    			attr_dev(line0, "id", "Line_5");
    			attr_dev(line0, "data-name", "Line 5");
    			attr_dev(line0, "x1", "2");
    			attr_dev(line0, "y2", "1.5");
    			attr_dev(line0, "transform", "translate(0 1.5)");
    			attr_dev(line0, "fill", "none");
    			attr_dev(line0, "stroke", "#176efc");
    			attr_dev(line0, "stroke-linecap", "round");
    			attr_dev(line0, "stroke-width", "1.5");
    			add_location(line0, file$2, 178, 8, 4877);
    			attr_dev(line1, "id", "Line_6");
    			attr_dev(line1, "data-name", "Line 6");
    			attr_dev(line1, "x1", "2");
    			attr_dev(line1, "y1", "1.5");
    			attr_dev(line1, "fill", "none");
    			attr_dev(line1, "stroke", "#176efc");
    			attr_dev(line1, "stroke-linecap", "round");
    			attr_dev(line1, "stroke-width", "1.5");
    			add_location(line1, file$2, 188, 8, 5131);
    			attr_dev(g2, "id", "Group_4");
    			attr_dev(g2, "data-name", "Group 4");
    			attr_dev(g2, "transform", "translate(6.5 6.5) rotate(-90)");
    			add_location(g2, file$2, 174, 6, 4765);
    			attr_dev(g3, "id", "topSpc");
    			attr_dev(g3, "clip-path", "url(#clip-topSpc)");
    			add_location(g3, file$2, 140, 4, 3735);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr_dev(svg, "width", "16");
    			attr_dev(svg, "height", "16");
    			attr_dev(svg, "viewBox", "0 0 16 16");
    			add_location(svg, file$2, 129, 2, 3469);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, defs);
    			append_dev(defs, clipPath);
    			append_dev(clipPath, rect0);
    			append_dev(svg, g3);
    			append_dev(g3, g0);
    			append_dev(g0, rect1);
    			append_dev(g0, rect2);
    			append_dev(g3, rect3);
    			append_dev(g3, g1);
    			append_dev(g1, rect4);
    			append_dev(g1, rect5);
    			append_dev(g3, g2);
    			append_dev(g2, line0);
    			append_dev(g2, line1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(129:29) ",
    		ctx
    	});

    	return block;
    }

    // (86:31) 
    function create_if_block_1(ctx) {
    	let svg;
    	let defs;
    	let clipPath;
    	let rect0;
    	let g1;
    	let g0;
    	let rect1;
    	let rect2;
    	let rect3;
    	let rect4;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			defs = svg_element("defs");
    			clipPath = svg_element("clipPath");
    			rect0 = svg_element("rect");
    			g1 = svg_element("g");
    			g0 = svg_element("g");
    			rect1 = svg_element("rect");
    			rect2 = svg_element("rect");
    			rect3 = svg_element("rect");
    			rect4 = svg_element("rect");
    			attr_dev(rect0, "width", "16");
    			attr_dev(rect0, "height", "16");
    			add_location(rect0, file$2, 94, 8, 2542);
    			attr_dev(clipPath, "id", "clip-imgPerRow");
    			add_location(clipPath, file$2, 93, 6, 2503);
    			add_location(defs, file$2, 92, 4, 2490);
    			attr_dev(rect1, "width", "14");
    			attr_dev(rect1, "height", "12");
    			attr_dev(rect1, "rx", "0.5");
    			attr_dev(rect1, "stroke", "none");
    			add_location(rect1, file$2, 107, 8, 2900);
    			attr_dev(rect2, "x", "-0.5");
    			attr_dev(rect2, "y", "-0.5");
    			attr_dev(rect2, "width", "15");
    			attr_dev(rect2, "height", "13");
    			attr_dev(rect2, "rx", "1");
    			attr_dev(rect2, "fill", "none");
    			add_location(rect2, file$2, 108, 8, 2963);
    			attr_dev(g0, "id", "Rectangle_1");
    			attr_dev(g0, "data-name", "Rectangle 1");
    			attr_dev(g0, "transform", "translate(1 2)");
    			attr_dev(g0, "fill", "none");
    			attr_dev(g0, "stroke", "gray");
    			attr_dev(g0, "stroke-linecap", "round");
    			attr_dev(g0, "stroke-linejoin", "round");
    			attr_dev(g0, "stroke-width", "1");
    			add_location(g0, file$2, 98, 6, 2666);
    			attr_dev(rect3, "id", "Rectangle_2");
    			attr_dev(rect3, "data-name", "Rectangle 2");
    			attr_dev(rect3, "width", "5.5");
    			attr_dev(rect3, "height", "10");
    			attr_dev(rect3, "rx", "0.5");
    			attr_dev(rect3, "transform", "translate(2 3)");
    			attr_dev(rect3, "fill", "#176efc");
    			add_location(rect3, file$2, 110, 6, 3049);
    			attr_dev(rect4, "id", "Rectangle_3");
    			attr_dev(rect4, "data-name", "Rectangle 3");
    			attr_dev(rect4, "width", "5.5");
    			attr_dev(rect4, "height", "10");
    			attr_dev(rect4, "rx", "0.5");
    			attr_dev(rect4, "transform", "translate(8.5 3)");
    			attr_dev(rect4, "fill", "#176efc");
    			add_location(rect4, file$2, 118, 6, 3236);
    			attr_dev(g1, "id", "imgPerRow");
    			attr_dev(g1, "clip-path", "url(#clip-imgPerRow)");
    			add_location(g1, file$2, 97, 4, 2608);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr_dev(svg, "width", "16");
    			attr_dev(svg, "height", "16");
    			attr_dev(svg, "viewBox", "0 0 16 16");
    			add_location(svg, file$2, 86, 2, 2339);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, defs);
    			append_dev(defs, clipPath);
    			append_dev(clipPath, rect0);
    			append_dev(svg, g1);
    			append_dev(g1, g0);
    			append_dev(g0, rect1);
    			append_dev(g0, rect2);
    			append_dev(g1, rect3);
    			append_dev(g1, rect4);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(86:31) ",
    		ctx
    	});

    	return block;
    }

    // (5:0) {#if name == 'maxWidth'}
    function create_if_block$1(ctx) {
    	let svg;
    	let defs;
    	let clipPath;
    	let rect0;
    	let g4;
    	let g2;
    	let line0;
    	let g0;
    	let line1;
    	let line2;
    	let g1;
    	let line3;
    	let line4;
    	let g3;
    	let rect1;
    	let rect2;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			defs = svg_element("defs");
    			clipPath = svg_element("clipPath");
    			rect0 = svg_element("rect");
    			g4 = svg_element("g");
    			g2 = svg_element("g");
    			line0 = svg_element("line");
    			g0 = svg_element("g");
    			line1 = svg_element("line");
    			line2 = svg_element("line");
    			g1 = svg_element("g");
    			line3 = svg_element("line");
    			line4 = svg_element("line");
    			g3 = svg_element("g");
    			rect1 = svg_element("rect");
    			rect2 = svg_element("rect");
    			attr_dev(rect0, "width", "16");
    			attr_dev(rect0, "height", "16");
    			add_location(rect0, file$2, 13, 8, 268);
    			attr_dev(clipPath, "id", "clip-maxWidth");
    			add_location(clipPath, file$2, 12, 6, 230);
    			add_location(defs, file$2, 11, 4, 217);
    			attr_dev(line0, "id", "Line_4");
    			attr_dev(line0, "data-name", "Line 4");
    			attr_dev(line0, "x2", "12");
    			attr_dev(line0, "transform", "translate(2.5 8)");
    			attr_dev(line0, "fill", "none");
    			attr_dev(line0, "stroke", "#176efc");
    			attr_dev(line0, "stroke-linecap", "round");
    			attr_dev(line0, "stroke-width", "1.5");
    			add_location(line0, file$2, 18, 8, 464);
    			attr_dev(line1, "id", "Line_5");
    			attr_dev(line1, "data-name", "Line 5");
    			attr_dev(line1, "x2", "2");
    			attr_dev(line1, "y2", "1.5");
    			attr_dev(line1, "transform", "translate(1 8)");
    			attr_dev(line1, "fill", "none");
    			attr_dev(line1, "stroke", "#176efc");
    			attr_dev(line1, "stroke-linecap", "round");
    			attr_dev(line1, "stroke-width", "1.5");
    			add_location(line1, file$2, 28, 10, 747);
    			attr_dev(line2, "id", "Line_6");
    			attr_dev(line2, "data-name", "Line 6");
    			attr_dev(line2, "y1", "1.5");
    			attr_dev(line2, "x2", "2");
    			attr_dev(line2, "transform", "translate(1 6.5)");
    			attr_dev(line2, "fill", "none");
    			attr_dev(line2, "stroke", "#176efc");
    			attr_dev(line2, "stroke-linecap", "round");
    			attr_dev(line2, "stroke-width", "1.5");
    			add_location(line2, file$2, 38, 10, 1019);
    			attr_dev(g0, "id", "Group_1");
    			attr_dev(g0, "data-name", "Group 1");
    			add_location(g0, file$2, 27, 8, 700);
    			attr_dev(line3, "id", "Line_5-2");
    			attr_dev(line3, "data-name", "Line 5");
    			attr_dev(line3, "x1", "2");
    			attr_dev(line3, "y2", "1.5");
    			attr_dev(line3, "transform", "translate(0 1.5)");
    			attr_dev(line3, "fill", "none");
    			attr_dev(line3, "stroke", "#176efc");
    			attr_dev(line3, "stroke-linecap", "round");
    			attr_dev(line3, "stroke-width", "1.5");
    			add_location(line3, file$2, 50, 10, 1381);
    			attr_dev(line4, "id", "Line_6-2");
    			attr_dev(line4, "data-name", "Line 6");
    			attr_dev(line4, "x1", "2");
    			attr_dev(line4, "y1", "1.5");
    			attr_dev(line4, "fill", "none");
    			attr_dev(line4, "stroke", "#176efc");
    			attr_dev(line4, "stroke-linecap", "round");
    			attr_dev(line4, "stroke-width", "1.5");
    			add_location(line4, file$2, 60, 10, 1657);
    			attr_dev(g1, "id", "Group_2");
    			attr_dev(g1, "data-name", "Group 2");
    			attr_dev(g1, "transform", "translate(13 6.5)");
    			add_location(g1, file$2, 49, 8, 1304);
    			attr_dev(g2, "id", "Group_3");
    			attr_dev(g2, "data-name", "Group 3");
    			attr_dev(g2, "transform", "translate(0 5.5)");
    			add_location(g2, file$2, 17, 6, 390);
    			attr_dev(rect1, "width", "12");
    			attr_dev(rect1, "height", "8");
    			attr_dev(rect1, "rx", "0.5");
    			attr_dev(rect1, "stroke", "none");
    			add_location(rect1, file$2, 80, 8, 2146);
    			attr_dev(rect2, "x", "-0.5");
    			attr_dev(rect2, "y", "-0.5");
    			attr_dev(rect2, "width", "13");
    			attr_dev(rect2, "height", "9");
    			attr_dev(rect2, "rx", "1");
    			attr_dev(rect2, "fill", "none");
    			add_location(rect2, file$2, 81, 8, 2208);
    			attr_dev(g3, "id", "Rectangle_1");
    			attr_dev(g3, "data-name", "Rectangle 1");
    			attr_dev(g3, "transform", "translate(2 1)");
    			attr_dev(g3, "fill", "none");
    			attr_dev(g3, "stroke", "gray");
    			attr_dev(g3, "stroke-linecap", "round");
    			attr_dev(g3, "stroke-linejoin", "round");
    			attr_dev(g3, "stroke-width", "1");
    			add_location(g3, file$2, 71, 6, 1912);
    			attr_dev(g4, "id", "maxWidth");
    			attr_dev(g4, "clip-path", "url(#clip-maxWidth)");
    			add_location(g4, file$2, 16, 4, 334);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr_dev(svg, "width", "16");
    			attr_dev(svg, "height", "16");
    			attr_dev(svg, "viewBox", "0 0 16 16");
    			add_location(svg, file$2, 5, 2, 66);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, defs);
    			append_dev(defs, clipPath);
    			append_dev(clipPath, rect0);
    			append_dev(svg, g4);
    			append_dev(g4, g2);
    			append_dev(g2, line0);
    			append_dev(g2, g0);
    			append_dev(g0, line1);
    			append_dev(g0, line2);
    			append_dev(g2, g1);
    			append_dev(g1, line3);
    			append_dev(g1, line4);
    			append_dev(g4, g3);
    			append_dev(g3, rect1);
    			append_dev(g3, rect2);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(5:0) {#if name == 'maxWidth'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*name*/ ctx[0] == "maxWidth") return create_if_block$1;
    		if (/*name*/ ctx[0] == "imgsPerRow") return create_if_block_1;
    		if (/*name*/ ctx[0] == "topSpace") return create_if_block_2;
    		if (/*name*/ ctx[0] == "bottomSpace") return create_if_block_3;
    		if (/*name*/ ctx[0] == "horGap") return create_if_block_4;
    		if (/*name*/ ctx[0] == "border") return create_if_block_5;
    		if (/*name*/ ctx[0] == "aStyle") return create_if_block_6;
    		if (/*name*/ ctx[0] == "imgStyle") return create_if_block_7;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) {
    				if_block.d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
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
    	let { name } = $$props;
    	const writable_props = ["name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Icon> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Icon", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({ name });

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name];
    }

    class Icon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Icon",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<Icon> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/MultiColumn.svelte generated by Svelte v3.24.1 */

    const { console: console_1 } = globals;
    const file$3 = "src/MultiColumn.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[105] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[108] = list[i];
    	child_ctx[110] = i;
    	return child_ctx;
    }

    // (448:4) {#if uploading}
    function create_if_block_7$1(ctx) {
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
    			add_location(div0, file$3, 449, 8, 11961);
    			attr_dev(div1, "class", "sk-circle2 sk-circle");
    			add_location(div1, file$3, 450, 8, 12006);
    			attr_dev(div2, "class", "sk-circle3 sk-circle");
    			add_location(div2, file$3, 451, 8, 12051);
    			attr_dev(div3, "class", "sk-circle4 sk-circle");
    			add_location(div3, file$3, 452, 8, 12096);
    			attr_dev(div4, "class", "sk-circle5 sk-circle");
    			add_location(div4, file$3, 453, 8, 12141);
    			attr_dev(div5, "class", "sk-circle6 sk-circle");
    			add_location(div5, file$3, 454, 8, 12186);
    			attr_dev(div6, "class", "sk-circle7 sk-circle");
    			add_location(div6, file$3, 455, 8, 12231);
    			attr_dev(div7, "class", "sk-circle8 sk-circle");
    			add_location(div7, file$3, 456, 8, 12276);
    			attr_dev(div8, "class", "sk-circle9 sk-circle");
    			add_location(div8, file$3, 457, 8, 12321);
    			attr_dev(div9, "class", "sk-circle10 sk-circle");
    			add_location(div9, file$3, 458, 8, 12366);
    			attr_dev(div10, "class", "sk-circle11 sk-circle");
    			add_location(div10, file$3, 459, 8, 12412);
    			attr_dev(div11, "class", "sk-circle12 sk-circle");
    			add_location(div11, file$3, 460, 8, 12458);
    			attr_dev(div12, "class", "sk-fading-circle");
    			add_location(div12, file$3, 448, 6, 11905);
    			add_location(span, file$3, 462, 6, 12515);
    			add_location(br, file$3, 463, 6, 12544);
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
    		id: create_if_block_7$1.name,
    		type: "if",
    		source: "(448:4) {#if uploading}",
    		ctx
    	});

    	return block;
    }

    // (476:6) {#each columnImgData as n, index (n.id)}
    function create_each_block_1(key_1, ctx) {
    	let a;
    	let img;
    	let img_src_value;
    	let a_href_value;
    	let a_data_tooltip_value;
    	let a_draggable_value;
    	let rect;
    	let stop_animation = noop;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[41](/*index*/ ctx[110], ...args);
    	}

    	function dragstart_handler(...args) {
    		return /*dragstart_handler*/ ctx[42](/*index*/ ctx[110], ...args);
    	}

    	function drop_handler(...args) {
    		return /*drop_handler*/ ctx[43](/*index*/ ctx[110], ...args);
    	}

    	function dragenter_handler(...args) {
    		return /*dragenter_handler*/ ctx[44](/*index*/ ctx[110], ...args);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			a = element("a");
    			img = element("img");
    			if (img.src !== (img_src_value = /*n*/ ctx[108].img)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Test");
    			attr_dev(img, "class", "svelte-1f344py");
    			add_location(img, file$3, 488, 10, 13416);
    			attr_dev(a, "href", a_href_value = /*n*/ ctx[108].url);
    			attr_dev(a, "data-tooltip", a_data_tooltip_value = "URL " + /*n*/ ctx[108].url);
    			attr_dev(a, "class", "list-item with-tooltip svelte-1f344py");
    			attr_dev(a, "draggable", a_draggable_value = true);
    			attr_dev(a, "ondragover", "return false");
    			toggle_class(a, "is-active", /*hovering*/ ctx[5] === /*index*/ ctx[110]);
    			add_location(a, file$3, 476, 8, 12913);
    			this.first = a;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, img);

    			if (!mounted) {
    				dispose = [
    					listen_dev(a, "click", prevent_default(click_handler), false, true, false),
    					listen_dev(a, "dragstart", dragstart_handler, false, false, false),
    					listen_dev(a, "drop", prevent_default(drop_handler), false, true, false),
    					listen_dev(a, "dragenter", dragenter_handler, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*columnImgData*/ 64 && img.src !== (img_src_value = /*n*/ ctx[108].img)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty[0] & /*columnImgData*/ 64 && a_href_value !== (a_href_value = /*n*/ ctx[108].url)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty[0] & /*columnImgData*/ 64 && a_data_tooltip_value !== (a_data_tooltip_value = "URL " + /*n*/ ctx[108].url)) {
    				attr_dev(a, "data-tooltip", a_data_tooltip_value);
    			}

    			if (dirty[0] & /*hovering, columnImgData*/ 96) {
    				toggle_class(a, "is-active", /*hovering*/ ctx[5] === /*index*/ ctx[110]);
    			}
    		},
    		r: function measure() {
    			rect = a.getBoundingClientRect();
    		},
    		f: function fix() {
    			fix_position(a);
    			stop_animation();
    		},
    		a: function animate() {
    			stop_animation();
    			stop_animation = create_animation(a, rect, flip, { duration: 250 });
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(476:6) {#each columnImgData as n, index (n.id)}",
    		ctx
    	});

    	return block;
    }

    // (492:6) {#if connState != null}
    function create_if_block_6$1(ctx) {
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
    			input.disabled = /*uploading*/ ctx[13];
    			attr_dev(input, "class", "svelte-1f344py");
    			add_location(input, file$3, 493, 10, 13565);
    			attr_dev(div, "class", "list-upload svelte-1f344py");
    			add_location(div, file$3, 492, 8, 13512);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			/*input_binding*/ ctx[45](input);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*toBase64*/ ctx[32], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*uploading*/ 8192) {
    				prop_dev(input, "disabled", /*uploading*/ ctx[13]);
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
    			/*input_binding*/ ctx[45](null);
    			if (detaching && div_transition) div_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6$1.name,
    		type: "if",
    		source: "(492:6) {#if connState != null}",
    		ctx
    	});

    	return block;
    }

    // (504:4) {#if columnImgData.length > 0 && !uploading}
    function create_if_block_5$1(ctx) {
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
    			attr_dev(h3, "class", "svelte-1f344py");
    			add_location(h3, file$3, 504, 6, 13818);
    			attr_dev(div, "class", "preview");
    			set_style(div, "width", /*maxWidth*/ ctx[17] + "px");
    			add_location(div, file$3, 505, 6, 13881);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			div.innerHTML = /*columnOutputCode*/ ctx[27];
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*columnOutputCode*/ 134217728) div.innerHTML = /*columnOutputCode*/ ctx[27];
    			if (!current || dirty[0] & /*maxWidth*/ 131072) {
    				set_style(div, "width", /*maxWidth*/ ctx[17] + "px");
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
    		id: create_if_block_5$1.name,
    		type: "if",
    		source: "(504:4) {#if columnImgData.length > 0 && !uploading}",
    		ctx
    	});

    	return block;
    }

    // (520:6) {:else}
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
    			add_location(br, file$3, 525, 39, 14493);
    			set_style(small, "opacity", "0.6");
    			add_location(small, file$3, 526, 10, 14510);
    			attr_dev(button, "class", "connectedBtn svelte-1f344py");
    			add_location(button, file$3, 520, 8, 14332);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, br);
    			append_dev(button, t1);
    			append_dev(button, small);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_2*/ ctx[47], false, false, false);
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
    		source: "(520:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (514:6) {#if connState == null}
    function create_if_block_4$1(ctx) {
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
    			add_location(br, file$3, 516, 77, 14222);
    			set_style(small, "opacity", "0.6");
    			add_location(small, file$3, 517, 10, 14239);
    			set_style(button, "text-align", "left");
    			add_location(button, file$3, 514, 8, 14102);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, br);
    			append_dev(button, t1);
    			append_dev(button, small);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[46], false, false, false);
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
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(514:6) {#if connState == null}",
    		ctx
    	});

    	return block;
    }

    // (531:4) {#if connState != null}
    function create_if_block_3$1(ctx) {
    	let expandableitem;
    	let current;

    	expandableitem = new ExpandableItem({
    			props: {
    				title: "Upload options",
    				$$slots: { default: [create_default_slot_2] },
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

    			if (dirty[0] & /*newFolderName, folders*/ 16392 | dirty[3] & /*$$scope*/ 262144) {
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
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(531:4) {#if connState != null}",
    		ctx
    	});

    	return block;
    }

    // (536:12) {#each folders as folder}
    function create_each_block$1(ctx) {
    	let option;
    	let t0_value = /*folder*/ ctx[105].name + "";
    	let t0;
    	let t1;
    	let small;
    	let t2;
    	let t3_value = /*folder*/ ctx[105].id + "";
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
    			add_location(small, file$3, 538, 16, 14918);
    			option.__value = option_value_value = /*folder*/ ctx[105].id;
    			option.value = option.__value;
    			add_location(option, file$3, 536, 14, 14845);
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
    			if (dirty[0] & /*folders*/ 16384 && t0_value !== (t0_value = /*folder*/ ctx[105].name + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*folders*/ 16384 && t3_value !== (t3_value = /*folder*/ ctx[105].id + "")) set_data_dev(t3, t3_value);

    			if (dirty[0] & /*folders*/ 16384 && option_value_value !== (option_value_value = /*folder*/ ctx[105].id)) {
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
    		source: "(536:12) {#each folders as folder}",
    		ctx
    	});

    	return block;
    }

    // (532:6) <ExpandableItem title="Upload options">
    function create_default_slot_2(ctx) {
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
    	let each_value = /*folders*/ ctx[14];
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
    			add_location(label0, file$3, 533, 10, 14715);
    			attr_dev(select, "id", "folderPicker");
    			add_location(select, file$3, 534, 10, 14766);
    			attr_dev(div0, "class", "ctrl-flex");
    			add_location(div0, file$3, 532, 8, 14681);
    			attr_dev(label1, "for", "newFolderName");
    			add_location(label1, file$3, 545, 10, 15072);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "id", "newFolderName");
    			add_location(input, file$3, 546, 10, 15130);
    			button.disabled = button_disabled_value = /*newFolderName*/ ctx[3].length < 1;
    			add_location(button, file$3, 548, 10, 15209);
    			attr_dev(div1, "class", "ctrl-flex");
    			add_location(div1, file$3, 544, 8, 15038);
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
    			set_input_value(input, /*newFolderName*/ ctx[3]);
    			append_dev(div1, t5);
    			append_dev(div1, button);
    			append_dev(button, t6);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[48]),
    					listen_dev(button, "click", /*click_handler_3*/ ctx[49], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*folders*/ 16384) {
    				each_value = /*folders*/ ctx[14];
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

    			if (dirty[0] & /*newFolderName*/ 8 && input.value !== /*newFolderName*/ ctx[3]) {
    				set_input_value(input, /*newFolderName*/ ctx[3]);
    			}

    			if (dirty[0] & /*newFolderName*/ 8 && button_disabled_value !== (button_disabled_value = /*newFolderName*/ ctx[3].length < 1)) {
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
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(532:6) <ExpandableItem title=\\\"Upload options\\\">",
    		ctx
    	});

    	return block;
    }

    // (640:8) {#if columnBetweenBorderThickness > 0}
    function create_if_block_2$1(ctx) {
    	let div0;
    	let input0;
    	let t0;
    	let input1;
    	let div0_transition;
    	let t1;
    	let div2;
    	let div1;
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
    			add_location(input0, file$3, 641, 12, 17961);
    			set_style(input1, "width", "5rem");
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "maxlength", "7");
    			attr_dev(input1, "minlength", "7");
    			add_location(input1, file$3, 645, 12, 18089);
    			attr_dev(div0, "class", "side-by-side");
    			add_location(div0, file$3, 640, 10, 17905);
    			set_style(div1, "height", "1px");
    			set_style(div1, "width", "24px");
    			set_style(div1, "border-bottom", /*columnBetweenBorderThickness*/ ctx[7] + "px " + /*columnBetweenBorderStyle*/ ctx[8] + " grey");
    			set_style(div1, "transform", "translateY(-2px)");
    			add_location(div1, file$3, 654, 12, 18351);
    			option0.__value = "solid";
    			option0.value = option0.__value;
    			add_location(option0, file$3, 657, 14, 18609);
    			option1.__value = "dotted";
    			option1.value = option1.__value;
    			add_location(option1, file$3, 658, 14, 18660);
    			option2.__value = "dashed";
    			option2.value = option2.__value;
    			add_location(option2, file$3, 659, 14, 18713);
    			option3.__value = "double";
    			option3.value = option3.__value;
    			add_location(option3, file$3, 660, 14, 18766);
    			option4.__value = "groove";
    			option4.value = option4.__value;
    			add_location(option4, file$3, 661, 14, 18819);
    			option5.__value = "ridge";
    			option5.value = option5.__value;
    			add_location(option5, file$3, 662, 14, 18872);
    			attr_dev(select, "id", "containerAlign");
    			if (/*columnBetweenBorderStyle*/ ctx[8] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[58].call(select));
    			add_location(select, file$3, 656, 12, 18528);
    			attr_dev(div2, "class", "side-by-side");
    			add_location(div2, file$3, 653, 10, 18295);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, input0);
    			set_input_value(input0, /*columnBetweenBorderColor*/ ctx[9]);
    			append_dev(div0, t0);
    			append_dev(div0, input1);
    			set_input_value(input1, /*columnBetweenBorderColor*/ ctx[9]);
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
    			select_option(select, /*columnBetweenBorderStyle*/ ctx[8]);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[56]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[57]),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[58])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*columnBetweenBorderColor*/ 512) {
    				set_input_value(input0, /*columnBetweenBorderColor*/ ctx[9]);
    			}

    			if (dirty[0] & /*columnBetweenBorderColor*/ 512 && input1.value !== /*columnBetweenBorderColor*/ ctx[9]) {
    				set_input_value(input1, /*columnBetweenBorderColor*/ ctx[9]);
    			}

    			if (!current || dirty[0] & /*columnBetweenBorderThickness, columnBetweenBorderStyle*/ 384) {
    				set_style(div1, "border-bottom", /*columnBetweenBorderThickness*/ ctx[7] + "px " + /*columnBetweenBorderStyle*/ ctx[8] + " grey");
    			}

    			if (dirty[0] & /*columnBetweenBorderStyle*/ 256) {
    				select_option(select, /*columnBetweenBorderStyle*/ ctx[8]);
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
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(640:8) {#if columnBetweenBorderThickness > 0}",
    		ctx
    	});

    	return block;
    }

    // (669:6) <ExpandableItem title="Advanced">
    function create_default_slot_1$1(ctx) {
    	let div0;
    	let label0;
    	let icon0;
    	let t0;
    	let code0;
    	let t2;
    	let t3;
    	let textarea0;
    	let t4;
    	let div1;
    	let label1;
    	let icon1;
    	let t5;
    	let code1;
    	let t7;
    	let t8;
    	let textarea1;
    	let t9;
    	let small0;
    	let code2;
    	let t11;
    	let t12;
    	let br;
    	let t13;
    	let small1;
    	let code3;
    	let t15;
    	let current;
    	let mounted;
    	let dispose;

    	icon0 = new Icon({
    			props: { name: "aStyle" },
    			$$inline: true
    		});

    	icon1 = new Icon({
    			props: { name: "imgStyle" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			label0 = element("label");
    			create_component(icon0.$$.fragment);
    			t0 = text("\n            Style for ");
    			code0 = element("code");
    			code0.textContent = "a";
    			t2 = text(" tags");
    			t3 = space();
    			textarea0 = element("textarea");
    			t4 = space();
    			div1 = element("div");
    			label1 = element("label");
    			create_component(icon1.$$.fragment);
    			t5 = text("\n            Style for ");
    			code1 = element("code");
    			code1.textContent = "img";
    			t7 = text(" tags");
    			t8 = space();
    			textarea1 = element("textarea");
    			t9 = space();
    			small0 = element("small");
    			code2 = element("code");
    			code2.textContent = `${"{columnWidth}"}`;
    			t11 = text(" instead of the actual image\n          width.");
    			t12 = space();
    			br = element("br");
    			t13 = space();
    			small1 = element("small");
    			code3 = element("code");
    			code3.textContent = `${"{setGap}"}`;
    			t15 = text(" to use spacing set above.");
    			add_location(code0, file$3, 671, 22, 19123);
    			attr_dev(label0, "for", "astyle");
    			add_location(label0, file$3, 670, 10, 19058);
    			set_style(textarea0, "font-family", "'Inconsolata', monospace");
    			set_style(textarea0, "width", "30rem");
    			attr_dev(textarea0, "id", "astyle");
    			add_location(textarea0, file$3, 672, 10, 19161);
    			attr_dev(div0, "class", "ctrl-flex");
    			add_location(div0, file$3, 669, 8, 19024);
    			add_location(code1, file$3, 680, 22, 19430);
    			attr_dev(label1, "for", "imgstyle");
    			add_location(label1, file$3, 679, 10, 19361);
    			set_style(textarea1, "font-family", "'Inconsolata', monospace");
    			set_style(textarea1, "width", "30rem");
    			attr_dev(textarea1, "id", "imgstyle");
    			add_location(textarea1, file$3, 681, 10, 19470);
    			attr_dev(div1, "class", "ctrl-flex");
    			add_location(div1, file$3, 678, 8, 19327);
    			attr_dev(code2, "class", "copyable svelte-1f344py");
    			add_location(code2, file$3, 688, 10, 19660);
    			add_location(small0, file$3, 687, 8, 19642);
    			add_location(br, file$3, 693, 8, 19845);
    			attr_dev(code3, "class", "copyable svelte-1f344py");
    			add_location(code3, file$3, 695, 10, 19878);
    			add_location(small1, file$3, 694, 8, 19860);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, label0);
    			mount_component(icon0, label0, null);
    			append_dev(label0, t0);
    			append_dev(label0, code0);
    			append_dev(label0, t2);
    			append_dev(div0, t3);
    			append_dev(div0, textarea0);
    			set_input_value(textarea0, /*aStyle*/ ctx[16]);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, label1);
    			mount_component(icon1, label1, null);
    			append_dev(label1, t5);
    			append_dev(label1, code1);
    			append_dev(label1, t7);
    			append_dev(div1, t8);
    			append_dev(div1, textarea1);
    			set_input_value(textarea1, /*imageStyle*/ ctx[15]);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, small0, anchor);
    			append_dev(small0, code2);
    			append_dev(small0, t11);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, small1, anchor);
    			append_dev(small1, code3);
    			append_dev(small1, t15);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(textarea0, "input", /*textarea0_input_handler*/ ctx[59]),
    					listen_dev(textarea1, "input", /*textarea1_input_handler*/ ctx[60]),
    					listen_dev(code2, "click", /*click_handler_4*/ ctx[61], false, false, false),
    					listen_dev(code3, "click", /*click_handler_5*/ ctx[62], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*aStyle*/ 65536) {
    				set_input_value(textarea0, /*aStyle*/ ctx[16]);
    			}

    			if (dirty[0] & /*imageStyle*/ 32768) {
    				set_input_value(textarea1, /*imageStyle*/ ctx[15]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon0.$$.fragment, local);
    			transition_in(icon1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon0.$$.fragment, local);
    			transition_out(icon1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(icon0);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div1);
    			destroy_component(icon1);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(small0);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(small1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(669:6) <ExpandableItem title=\\\"Advanced\\\">",
    		ctx
    	});

    	return block;
    }

    // (556:4) <ExpandableItem title="Options">
    function create_default_slot$1(ctx) {
    	let div1;
    	let label0;
    	let icon0;
    	let t0;
    	let t1;
    	let div0;
    	let input0;
    	let t2;
    	let code0;
    	let t3;
    	let t4;
    	let t5;
    	let small;
    	let code1;
    	let t6;
    	let t7;
    	let t8;
    	let t9;
    	let div3;
    	let label1;
    	let icon1;
    	let t10;
    	let t11;
    	let div2;
    	let input1;
    	let t12;
    	let code2;
    	let t13;
    	let t14;
    	let div5;
    	let label2;
    	let icon2;
    	let t15;
    	let t16;
    	let div4;
    	let input2;
    	let t17;
    	let code3;
    	let t18;
    	let t19;
    	let t20;
    	let div7;
    	let label3;
    	let icon3;
    	let t21;
    	let t22;
    	let div6;
    	let input3;
    	let t23;
    	let code4;
    	let t24;
    	let t25;
    	let t26;
    	let div9;
    	let label4;
    	let icon4;
    	let t27;
    	let t28;
    	let div8;
    	let input4;
    	let t29;
    	let code5;
    	let t30;
    	let t31;
    	let t32;
    	let div11;
    	let label5;
    	let icon5;
    	let t33;
    	let t34;
    	let div10;
    	let input5;
    	let t35;
    	let code6;
    	let t36;
    	let t37;
    	let t38;
    	let t39;
    	let expandableitem;
    	let current;
    	let mounted;
    	let dispose;

    	icon0 = new Icon({
    			props: { name: "maxWidth" },
    			$$inline: true
    		});

    	icon1 = new Icon({
    			props: { name: "imgsPerRow" },
    			$$inline: true
    		});

    	icon2 = new Icon({
    			props: { name: "topSpace" },
    			$$inline: true
    		});

    	icon3 = new Icon({
    			props: { name: "bottomSpace" },
    			$$inline: true
    		});

    	icon4 = new Icon({
    			props: { name: "horGap" },
    			$$inline: true
    		});

    	icon5 = new Icon({
    			props: { name: "border" },
    			$$inline: true
    		});

    	let if_block = /*columnBetweenBorderThickness*/ ctx[7] > 0 && create_if_block_2$1(ctx);

    	expandableitem = new ExpandableItem({
    			props: {
    				title: "Advanced",
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			label0 = element("label");
    			create_component(icon0.$$.fragment);
    			t0 = text("\n          Maximum width");
    			t1 = space();
    			div0 = element("div");
    			input0 = element("input");
    			t2 = space();
    			code0 = element("code");
    			t3 = text(/*maxWidth*/ ctx[17]);
    			t4 = text(" px");
    			t5 = space();
    			small = element("small");
    			code1 = element("code");
    			t6 = text(/*colWidth*/ ctx[26]);
    			t7 = text(" px");
    			t8 = text(" per image");
    			t9 = space();
    			div3 = element("div");
    			label1 = element("label");
    			create_component(icon1.$$.fragment);
    			t10 = text("\n          Images per row");
    			t11 = space();
    			div2 = element("div");
    			input1 = element("input");
    			t12 = space();
    			code2 = element("code");
    			t13 = text(/*imagesPerRow*/ ctx[1]);
    			t14 = space();
    			div5 = element("div");
    			label2 = element("label");
    			create_component(icon2.$$.fragment);
    			t15 = text("\n          Space above row");
    			t16 = space();
    			div4 = element("div");
    			input2 = element("input");
    			t17 = space();
    			code3 = element("code");
    			t18 = text(/*columnBetweenBorderPaddingTop*/ ctx[10]);
    			t19 = text(" px");
    			t20 = space();
    			div7 = element("div");
    			label3 = element("label");
    			create_component(icon3.$$.fragment);
    			t21 = text("\n          Space below row");
    			t22 = space();
    			div6 = element("div");
    			input3 = element("input");
    			t23 = space();
    			code4 = element("code");
    			t24 = text(/*columnBetweenBorderPaddingBottom*/ ctx[11]);
    			t25 = text(" px");
    			t26 = space();
    			div9 = element("div");
    			label4 = element("label");
    			create_component(icon4.$$.fragment);
    			t27 = text("\n          Horizontal gap");
    			t28 = space();
    			div8 = element("div");
    			input4 = element("input");
    			t29 = space();
    			code5 = element("code");
    			t30 = text(/*columnsHGap*/ ctx[2]);
    			t31 = text(" px");
    			t32 = space();
    			div11 = element("div");
    			label5 = element("label");
    			create_component(icon5.$$.fragment);
    			t33 = text("\n          Border");
    			t34 = space();
    			div10 = element("div");
    			input5 = element("input");
    			t35 = space();
    			code6 = element("code");
    			t36 = text(/*columnBetweenBorderThickness*/ ctx[7]);
    			t37 = text(" px");
    			t38 = space();
    			if (if_block) if_block.c();
    			t39 = space();
    			create_component(expandableitem.$$.fragment);
    			attr_dev(label0, "for", "maxWidth");
    			add_location(label0, file$3, 557, 8, 15451);
    			attr_dev(input0, "id", "maxWidth");
    			attr_dev(input0, "type", "range");
    			attr_dev(input0, "min", "100");
    			attr_dev(input0, "max", "1200");
    			add_location(input0, file$3, 560, 10, 15575);
    			add_location(code0, file$3, 566, 10, 15725);
    			attr_dev(div0, "class", "side-by-side");
    			add_location(div0, file$3, 559, 8, 15538);
    			add_location(code1, file$3, 569, 42, 15810);
    			set_style(small, "font-size", "0.75rem");
    			add_location(small, file$3, 569, 8, 15776);
    			attr_dev(div1, "class", "ctrl-flex");
    			add_location(div1, file$3, 556, 6, 15419);
    			attr_dev(label1, "for", "colImgsPerRow");
    			add_location(label1, file$3, 573, 8, 15907);
    			attr_dev(input1, "id", "colImgsPerRow");
    			attr_dev(input1, "type", "range");
    			attr_dev(input1, "min", "1");
    			attr_dev(input1, "max", "6");
    			add_location(input1, file$3, 576, 10, 16039);
    			add_location(code2, file$3, 582, 10, 16193);
    			attr_dev(div2, "class", "side-by-side");
    			add_location(div2, file$3, 575, 8, 16002);
    			attr_dev(div3, "class", "ctrl-flex");
    			add_location(div3, file$3, 572, 6, 15875);
    			attr_dev(label2, "for", "colBrdrSpcTop");
    			add_location(label2, file$3, 587, 8, 16288);
    			attr_dev(input2, "id", "colBrdrSpcTop");
    			attr_dev(input2, "type", "range");
    			attr_dev(input2, "min", "0");
    			attr_dev(input2, "max", "40");
    			add_location(input2, file$3, 590, 10, 16419);
    			add_location(code3, file$3, 596, 10, 16591);
    			attr_dev(div4, "class", "side-by-side");
    			add_location(div4, file$3, 589, 8, 16382);
    			attr_dev(div5, "class", "ctrl-flex");
    			add_location(div5, file$3, 586, 6, 16256);
    			attr_dev(label3, "for", "colBrdrSpcBtm");
    			add_location(label3, file$3, 600, 8, 16705);
    			attr_dev(input3, "id", "colBrdrSpcBtm");
    			attr_dev(input3, "type", "range");
    			attr_dev(input3, "min", "0");
    			attr_dev(input3, "max", "40");
    			add_location(input3, file$3, 603, 10, 16839);
    			add_location(code4, file$3, 609, 10, 17014);
    			attr_dev(div6, "class", "side-by-side");
    			add_location(div6, file$3, 602, 8, 16802);
    			attr_dev(div7, "class", "ctrl-flex");
    			add_location(div7, file$3, 599, 6, 16673);
    			attr_dev(label4, "for", "colHgap");
    			add_location(label4, file$3, 614, 8, 17132);
    			attr_dev(input4, "id", "colHgap");
    			attr_dev(input4, "type", "range");
    			attr_dev(input4, "min", "0");
    			attr_dev(input4, "max", "32");
    			add_location(input4, file$3, 617, 10, 17254);
    			add_location(code5, file$3, 623, 10, 17402);
    			attr_dev(div8, "class", "side-by-side");
    			add_location(div8, file$3, 616, 8, 17217);
    			attr_dev(div9, "class", "ctrl-flex");
    			add_location(div9, file$3, 613, 6, 17100);
    			attr_dev(label5, "for", "colBrdrThcc");
    			add_location(label5, file$3, 628, 8, 17499);
    			attr_dev(input5, "id", "colBrdrThcc");
    			attr_dev(input5, "type", "range");
    			attr_dev(input5, "min", "0");
    			attr_dev(input5, "max", "10");
    			add_location(input5, file$3, 631, 10, 17617);
    			add_location(code6, file$3, 637, 10, 17786);
    			attr_dev(div10, "class", "side-by-side");
    			add_location(div10, file$3, 630, 8, 17580);
    			attr_dev(div11, "class", "ctrl-flex");
    			add_location(div11, file$3, 627, 6, 17467);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, label0);
    			mount_component(icon0, label0, null);
    			append_dev(label0, t0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, input0);
    			set_input_value(input0, /*maxWidth*/ ctx[17]);
    			append_dev(div0, t2);
    			append_dev(div0, code0);
    			append_dev(code0, t3);
    			append_dev(code0, t4);
    			append_dev(div1, t5);
    			append_dev(div1, small);
    			append_dev(small, code1);
    			append_dev(code1, t6);
    			append_dev(code1, t7);
    			append_dev(small, t8);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, label1);
    			mount_component(icon1, label1, null);
    			append_dev(label1, t10);
    			append_dev(div3, t11);
    			append_dev(div3, div2);
    			append_dev(div2, input1);
    			set_input_value(input1, /*imagesPerRow*/ ctx[1]);
    			append_dev(div2, t12);
    			append_dev(div2, code2);
    			append_dev(code2, t13);
    			insert_dev(target, t14, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, label2);
    			mount_component(icon2, label2, null);
    			append_dev(label2, t15);
    			append_dev(div5, t16);
    			append_dev(div5, div4);
    			append_dev(div4, input2);
    			set_input_value(input2, /*columnBetweenBorderPaddingTop*/ ctx[10]);
    			append_dev(div4, t17);
    			append_dev(div4, code3);
    			append_dev(code3, t18);
    			append_dev(code3, t19);
    			insert_dev(target, t20, anchor);
    			insert_dev(target, div7, anchor);
    			append_dev(div7, label3);
    			mount_component(icon3, label3, null);
    			append_dev(label3, t21);
    			append_dev(div7, t22);
    			append_dev(div7, div6);
    			append_dev(div6, input3);
    			set_input_value(input3, /*columnBetweenBorderPaddingBottom*/ ctx[11]);
    			append_dev(div6, t23);
    			append_dev(div6, code4);
    			append_dev(code4, t24);
    			append_dev(code4, t25);
    			insert_dev(target, t26, anchor);
    			insert_dev(target, div9, anchor);
    			append_dev(div9, label4);
    			mount_component(icon4, label4, null);
    			append_dev(label4, t27);
    			append_dev(div9, t28);
    			append_dev(div9, div8);
    			append_dev(div8, input4);
    			set_input_value(input4, /*columnsHGap*/ ctx[2]);
    			append_dev(div8, t29);
    			append_dev(div8, code5);
    			append_dev(code5, t30);
    			append_dev(code5, t31);
    			insert_dev(target, t32, anchor);
    			insert_dev(target, div11, anchor);
    			append_dev(div11, label5);
    			mount_component(icon5, label5, null);
    			append_dev(label5, t33);
    			append_dev(div11, t34);
    			append_dev(div11, div10);
    			append_dev(div10, input5);
    			set_input_value(input5, /*columnBetweenBorderThickness*/ ctx[7]);
    			append_dev(div10, t35);
    			append_dev(div10, code6);
    			append_dev(code6, t36);
    			append_dev(code6, t37);
    			append_dev(div11, t38);
    			if (if_block) if_block.m(div11, null);
    			insert_dev(target, t39, anchor);
    			mount_component(expandableitem, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*input0_change_input_handler*/ ctx[50]),
    					listen_dev(input0, "input", /*input0_change_input_handler*/ ctx[50]),
    					listen_dev(input1, "change", /*input1_change_input_handler*/ ctx[51]),
    					listen_dev(input1, "input", /*input1_change_input_handler*/ ctx[51]),
    					listen_dev(input2, "change", /*input2_change_input_handler*/ ctx[52]),
    					listen_dev(input2, "input", /*input2_change_input_handler*/ ctx[52]),
    					listen_dev(input3, "change", /*input3_change_input_handler*/ ctx[53]),
    					listen_dev(input3, "input", /*input3_change_input_handler*/ ctx[53]),
    					listen_dev(input4, "change", /*input4_change_input_handler*/ ctx[54]),
    					listen_dev(input4, "input", /*input4_change_input_handler*/ ctx[54]),
    					listen_dev(input5, "change", /*input5_change_input_handler*/ ctx[55]),
    					listen_dev(input5, "input", /*input5_change_input_handler*/ ctx[55])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*maxWidth*/ 131072) {
    				set_input_value(input0, /*maxWidth*/ ctx[17]);
    			}

    			if (!current || dirty[0] & /*maxWidth*/ 131072) set_data_dev(t3, /*maxWidth*/ ctx[17]);
    			if (!current || dirty[0] & /*colWidth*/ 67108864) set_data_dev(t6, /*colWidth*/ ctx[26]);

    			if (dirty[0] & /*imagesPerRow*/ 2) {
    				set_input_value(input1, /*imagesPerRow*/ ctx[1]);
    			}

    			if (!current || dirty[0] & /*imagesPerRow*/ 2) set_data_dev(t13, /*imagesPerRow*/ ctx[1]);

    			if (dirty[0] & /*columnBetweenBorderPaddingTop*/ 1024) {
    				set_input_value(input2, /*columnBetweenBorderPaddingTop*/ ctx[10]);
    			}

    			if (!current || dirty[0] & /*columnBetweenBorderPaddingTop*/ 1024) set_data_dev(t18, /*columnBetweenBorderPaddingTop*/ ctx[10]);

    			if (dirty[0] & /*columnBetweenBorderPaddingBottom*/ 2048) {
    				set_input_value(input3, /*columnBetweenBorderPaddingBottom*/ ctx[11]);
    			}

    			if (!current || dirty[0] & /*columnBetweenBorderPaddingBottom*/ 2048) set_data_dev(t24, /*columnBetweenBorderPaddingBottom*/ ctx[11]);

    			if (dirty[0] & /*columnsHGap*/ 4) {
    				set_input_value(input4, /*columnsHGap*/ ctx[2]);
    			}

    			if (!current || dirty[0] & /*columnsHGap*/ 4) set_data_dev(t30, /*columnsHGap*/ ctx[2]);

    			if (dirty[0] & /*columnBetweenBorderThickness*/ 128) {
    				set_input_value(input5, /*columnBetweenBorderThickness*/ ctx[7]);
    			}

    			if (!current || dirty[0] & /*columnBetweenBorderThickness*/ 128) set_data_dev(t36, /*columnBetweenBorderThickness*/ ctx[7]);

    			if (/*columnBetweenBorderThickness*/ ctx[7] > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*columnBetweenBorderThickness*/ 128) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_2$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div11, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			const expandableitem_changes = {};

    			if (dirty[0] & /*imageStyle, aStyle*/ 98304 | dirty[3] & /*$$scope*/ 262144) {
    				expandableitem_changes.$$scope = { dirty, ctx };
    			}

    			expandableitem.$set(expandableitem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon0.$$.fragment, local);
    			transition_in(icon1.$$.fragment, local);
    			transition_in(icon2.$$.fragment, local);
    			transition_in(icon3.$$.fragment, local);
    			transition_in(icon4.$$.fragment, local);
    			transition_in(icon5.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(expandableitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon0.$$.fragment, local);
    			transition_out(icon1.$$.fragment, local);
    			transition_out(icon2.$$.fragment, local);
    			transition_out(icon3.$$.fragment, local);
    			transition_out(icon4.$$.fragment, local);
    			transition_out(icon5.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(expandableitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(icon0);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(div3);
    			destroy_component(icon1);
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(div5);
    			destroy_component(icon2);
    			if (detaching) detach_dev(t20);
    			if (detaching) detach_dev(div7);
    			destroy_component(icon3);
    			if (detaching) detach_dev(t26);
    			if (detaching) detach_dev(div9);
    			destroy_component(icon4);
    			if (detaching) detach_dev(t32);
    			if (detaching) detach_dev(div11);
    			destroy_component(icon5);
    			if (if_block) if_block.d();
    			if (detaching) detach_dev(t39);
    			destroy_component(expandableitem, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(556:4) <ExpandableItem title=\\\"Options\\\">",
    		ctx
    	});

    	return block;
    }

    // (811:2) {#if colCurrentEditImg != null}
    function create_if_block_1$1(ctx) {
    	let div3;
    	let promise;
    	let t0;
    	let div2;
    	let div0;
    	let label0;
    	let t2;
    	let input0;
    	let t3;
    	let div1;
    	let label1;
    	let t5;
    	let input1;
    	let mounted;
    	let dispose;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 104
    	};

    	handle_promise(promise = /*getColTempImgData*/ ctx[40](), info);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			info.block.c();
    			t0 = space();
    			div2 = element("div");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Image";
    			t2 = space();
    			input0 = element("input");
    			t3 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "URL";
    			t5 = space();
    			input1 = element("input");
    			attr_dev(label0, "for", "currImgImg");
    			add_location(label0, file$3, 823, 10, 24776);
    			set_style(input0, "min-width", "300px");
    			set_style(input0, "font-size", "0.8rem");
    			set_style(input0, "font-family", "'Inconsolata', monospaced");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "id", "currImgimg");
    			add_location(input0, file$3, 824, 10, 24824);
    			attr_dev(div0, "class", "ctrl-flex");
    			add_location(div0, file$3, 822, 8, 24742);
    			attr_dev(label1, "for", "currImgUrl");
    			add_location(label1, file$3, 832, 10, 25103);
    			set_style(input1, "min-width", "300px");
    			set_style(input1, "font-size", "0.8rem");
    			set_style(input1, "font-family", "'Inconsolata', monospaced");
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "id", "currImgUrl");
    			add_location(input1, file$3, 833, 10, 25149);
    			attr_dev(div1, "class", "ctrl-flex");
    			add_location(div1, file$3, 831, 8, 25069);
    			add_location(div2, file$3, 821, 6, 24728);
    			set_style(div3, "display", "flex");
    			set_style(div3, "gap", "1rem");
    			set_style(div3, "flex-wrap", "wrap");
    			add_location(div3, file$3, 811, 4, 24397);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			info.block.m(div3, info.anchor = null);
    			info.mount = () => div3;
    			info.anchor = t0;
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t2);
    			append_dev(div0, input0);
    			set_input_value(input0, /*columnImgData*/ ctx[6][/*colCurrentEditImg*/ ctx[24]].img);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div1, label1);
    			append_dev(div1, t5);
    			append_dev(div1, input1);
    			set_input_value(input1, /*columnImgData*/ ctx[6][/*colCurrentEditImg*/ ctx[24]].url);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler_1*/ ctx[79]),
    					listen_dev(input1, "input", /*input1_input_handler_1*/ ctx[80])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			{
    				const child_ctx = ctx.slice();
    				child_ctx[104] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}

    			if (dirty[0] & /*columnImgData, colCurrentEditImg*/ 16777280 && input0.value !== /*columnImgData*/ ctx[6][/*colCurrentEditImg*/ ctx[24]].img) {
    				set_input_value(input0, /*columnImgData*/ ctx[6][/*colCurrentEditImg*/ ctx[24]].img);
    			}

    			if (dirty[0] & /*columnImgData, colCurrentEditImg*/ 16777280 && input1.value !== /*columnImgData*/ ctx[6][/*colCurrentEditImg*/ ctx[24]].url) {
    				set_input_value(input1, /*columnImgData*/ ctx[6][/*colCurrentEditImg*/ ctx[24]].url);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			info.block.d();
    			info.token = null;
    			info = null;
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(811:2) {#if colCurrentEditImg != null}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>   import { slide }
    function create_catch_block(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(1:0) <script>   import { slide }",
    		ctx
    	});

    	return block;
    }

    // (815:6) {:then imgSrc}
    function create_then_block(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "class", "colDialogImgPreview svelte-1f344py");
    			if (img.src !== (img_src_value = /*imgSrc*/ ctx[104])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Currently edited item");
    			add_location(img, file$3, 815, 8, 24599);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(815:6) {:then imgSrc}",
    		ctx
    	});

    	return block;
    }

    // (813:34)          <img class="colDialogImgPreview" src={placeholderImage}
    function create_pending_block(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "class", "colDialogImgPreview svelte-1f344py");
    			if (img.src !== (img_src_value = placeholderImage)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Loading");
    			add_location(img, file$3, 813, 8, 24497);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(813:34)          <img class=\\\"colDialogImgPreview\\\" src={placeholderImage}",
    		ctx
    	});

    	return block;
    }

    // (849:4) {#if colCurrentEditImg != null}
    function create_if_block$2(ctx) {
    	let button;
    	let t;
    	let button_disabled_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text("Save and close");
    			button.disabled = button_disabled_value = /*columnImgData*/ ctx[6][/*colCurrentEditImg*/ ctx[24]].img.length < 1 || /*columnImgData*/ ctx[6][/*colCurrentEditImg*/ ctx[24]].url.length < 1;
    			add_location(button, file$3, 849, 6, 25637);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_15*/ ctx[81], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*columnImgData, colCurrentEditImg*/ 16777280 && button_disabled_value !== (button_disabled_value = /*columnImgData*/ ctx[6][/*colCurrentEditImg*/ ctx[24]].img.length < 1 || /*columnImgData*/ ctx[6][/*colCurrentEditImg*/ ctx[24]].url.length < 1)) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(849:4) {#if colCurrentEditImg != null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div5;
    	let main;
    	let h1;
    	let t1;
    	let t2;
    	let div0;
    	let button0;
    	let t3;
    	let t4;
    	let button1;
    	let t5;
    	let t6;
    	let div1;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t7;
    	let t8;
    	let t9;
    	let aside;
    	let div2;
    	let t10;
    	let t11;
    	let expandableitem;
    	let t12;
    	let div3;
    	let span0;
    	let t14;
    	let textarea0;
    	let t15;
    	let p;
    	let t16;
    	let t17;
    	let div4;
    	let span1;
    	let t19;
    	let span2;
    	let t21;
    	let span3;
    	let t23;
    	let span4;
    	let t25;
    	let dialog0;
    	let h30;
    	let t27;
    	let div6;
    	let label0;
    	let t29;
    	let textarea1;
    	let t30;
    	let div7;
    	let label1;
    	let t32;
    	let textarea2;
    	let t33;
    	let div9;
    	let div8;
    	let small0;
    	let t35;
    	let button2;
    	let t37;
    	let button3;
    	let t39;
    	let button4;
    	let t41;
    	let button5;
    	let t43;
    	let button6;
    	let t45;
    	let dialog1;
    	let h31;
    	let t47;
    	let label2;
    	let t49;
    	let input;
    	let t50;
    	let br;
    	let t51;
    	let div10;
    	let small1;
    	let t53;
    	let button7;
    	let t55;
    	let button8;
    	let t56;
    	let button8_disabled_value;
    	let t57;
    	let dialog2;
    	let h32;
    	let t59;
    	let t60;
    	let div11;
    	let small2;
    	let t62;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*uploading*/ ctx[13] && create_if_block_7$1(ctx);
    	let each_value_1 = /*columnImgData*/ ctx[6];
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*n*/ ctx[108].id;
    	validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
    	}

    	let if_block1 = /*connState*/ ctx[19] != null && create_if_block_6$1(ctx);
    	let if_block2 = /*columnImgData*/ ctx[6].length > 0 && !/*uploading*/ ctx[13] && create_if_block_5$1(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*connState*/ ctx[19] == null) return create_if_block_4$1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block3 = current_block_type(ctx);
    	let if_block4 = /*connState*/ ctx[19] != null && create_if_block_3$1(ctx);

    	expandableitem = new ExpandableItem({
    			props: {
    				title: "Options",
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let if_block5 = /*colCurrentEditImg*/ ctx[24] != null && create_if_block_1$1(ctx);
    	let if_block6 = /*colCurrentEditImg*/ ctx[24] != null && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Multi-column images";
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			div0 = element("div");
    			button0 = element("button");
    			t3 = text("Add an image");
    			t4 = space();
    			button1 = element("button");
    			t5 = text("Batch edit");
    			t6 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t7 = space();
    			if (if_block1) if_block1.c();
    			t8 = space();
    			if (if_block2) if_block2.c();
    			t9 = space();
    			aside = element("aside");
    			div2 = element("div");
    			if_block3.c();
    			t10 = space();
    			if (if_block4) if_block4.c();
    			t11 = space();
    			create_component(expandableitem.$$.fragment);
    			t12 = space();
    			div3 = element("div");
    			span0 = element("span");
    			span0.textContent = "Code";
    			t14 = space();
    			textarea0 = element("textarea");
    			t15 = space();
    			p = element("p");
    			t16 = text(/*columnCopiedToClipboardTxt*/ ctx[12]);
    			t17 = space();
    			div4 = element("div");
    			span1 = element("span");
    			span1.textContent = "Test images";
    			t19 = space();
    			span2 = element("span");
    			span2.textContent = "add 2";
    			t21 = space();
    			span3 = element("span");
    			span3.textContent = "add 6";
    			t23 = space();
    			span4 = element("span");
    			span4.textContent = "add 12";
    			t25 = space();
    			dialog0 = element("dialog");
    			h30 = element("h3");
    			h30.textContent = "Batch edit data";
    			t27 = space();
    			div6 = element("div");
    			label0 = element("label");
    			label0.textContent = "Images";
    			t29 = space();
    			textarea1 = element("textarea");
    			t30 = space();
    			div7 = element("div");
    			label1 = element("label");
    			label1.textContent = "URLs";
    			t32 = space();
    			textarea2 = element("textarea");
    			t33 = space();
    			div9 = element("div");
    			div8 = element("div");
    			small0 = element("small");
    			small0.textContent = "Clear";
    			t35 = space();
    			button2 = element("button");
    			button2.textContent = "Images";
    			t37 = space();
    			button3 = element("button");
    			button3.textContent = "URLs";
    			t39 = space();
    			button4 = element("button");
    			button4.textContent = "Both";
    			t41 = space();
    			button5 = element("button");
    			button5.textContent = "Cancel";
    			t43 = space();
    			button6 = element("button");
    			button6.textContent = "Save";
    			t45 = space();
    			dialog1 = element("dialog");
    			h31 = element("h3");
    			h31.textContent = "Connect";
    			t47 = space();
    			label2 = element("label");
    			label2.textContent = "API key";
    			t49 = space();
    			input = element("input");
    			t50 = space();
    			br = element("br");
    			t51 = space();
    			div10 = element("div");
    			small1 = element("small");
    			small1.textContent = "Demo\n      API key";
    			t53 = space();
    			button7 = element("button");
    			button7.textContent = "Cancel";
    			t55 = space();
    			button8 = element("button");
    			t56 = text("Connect");
    			t57 = space();
    			dialog2 = element("dialog");
    			h32 = element("h3");
    			h32.textContent = "Edit image";
    			t59 = space();
    			if (if_block5) if_block5.c();
    			t60 = space();
    			div11 = element("div");
    			small2 = element("small");
    			small2.textContent = "Delete";
    			t62 = space();
    			if (if_block6) if_block6.c();
    			add_location(h1, file$3, 445, 4, 11849);
    			button0.disabled = /*uploading*/ ctx[13];
    			add_location(button0, file$3, 467, 6, 12578);
    			button1.disabled = /*uploading*/ ctx[13];
    			add_location(button1, file$3, 469, 6, 12656);
    			add_location(div0, file$3, 466, 4, 12566);
    			attr_dev(div1, "class", "list svelte-1f344py");
    			set_style(div1, "grid-template-columns", "repeat(" + /*imagesPerRow*/ ctx[1] + ", 7rem)");
    			set_style(div1, "grid-auto-rows", "7rem");
    			add_location(div1, file$3, 472, 4, 12744);
    			add_location(main, file$3, 444, 2, 11838);
    			attr_dev(div2, "class", "item");
    			add_location(div2, file$3, 512, 4, 14045);
    			attr_dev(span0, "class", "section-title");
    			add_location(span0, file$3, 703, 6, 20102);
    			attr_dev(textarea0, "class", "output");
    			attr_dev(textarea0, "type", "text");
    			textarea0.readOnly = true;
    			add_location(textarea0, file$3, 705, 6, 20149);
    			attr_dev(p, "class", "copiedToClipboardTxt svelte-1f344py");
    			add_location(p, file$3, 713, 6, 20344);
    			attr_dev(div3, "class", "item");
    			add_location(div3, file$3, 702, 4, 20077);
    			set_style(span1, "font-size", "0.8rem");
    			set_style(span1, "opacity", "0.6");
    			add_location(span1, file$3, 716, 6, 20485);
    			attr_dev(span2, "class", "copyable svelte-1f344py");
    			set_style(span2, "font-size", "0.8rem");
    			set_style(span2, "filter", "grayscale(1) brightness(140%)");
    			add_location(span2, file$3, 717, 6, 20556);
    			attr_dev(span3, "class", "copyable svelte-1f344py");
    			set_style(span3, "font-size", "0.8rem");
    			set_style(span3, "filter", "grayscale(1) brightness(140%)");
    			add_location(span3, file$3, 724, 6, 20867);
    			attr_dev(span4, "class", "copyable svelte-1f344py");
    			set_style(span4, "font-size", "0.8rem");
    			set_style(span4, "filter", "grayscale(1) brightness(140%)");
    			add_location(span4, file$3, 731, 6, 21421);
    			set_style(div4, "display", "flex");
    			set_style(div4, "gap", "1rem");
    			set_style(div4, "padding", "1rem");
    			add_location(div4, file$3, 715, 4, 20424);
    			attr_dev(aside, "class", "svelte-1f344py");
    			toggle_class(aside, "uploading", /*uploading*/ ctx[13]);
    			add_location(aside, file$3, 511, 2, 14017);
    			attr_dev(div5, "class", "sidebar-grid");
    			add_location(div5, file$3, 443, 0, 11809);
    			attr_dev(h30, "class", "svelte-1f344py");
    			add_location(h30, file$3, 742, 2, 22404);
    			attr_dev(label0, "for", "inputImages");
    			add_location(label0, file$3, 745, 4, 22460);
    			set_style(textarea1, "min-width", "440px");
    			attr_dev(textarea1, "id", "inputImages");
    			add_location(textarea1, file$3, 746, 4, 22504);
    			attr_dev(div6, "class", "ctrl-flex");
    			add_location(div6, file$3, 744, 2, 22432);
    			attr_dev(label1, "for", "inputUrls");
    			add_location(label1, file$3, 753, 4, 22643);
    			set_style(textarea2, "min-width", "440px");
    			attr_dev(textarea2, "id", "inputUrls");
    			add_location(textarea2, file$3, 754, 4, 22683);
    			attr_dev(div7, "class", "ctrl-flex");
    			add_location(div7, file$3, 752, 2, 22615);
    			set_style(small0, "margin-right", "0.5rem");
    			add_location(small0, file$3, 762, 6, 22883);
    			set_style(button2, "border-top-right-radius", "0");
    			set_style(button2, "border-bottom-right-radius", "0");
    			add_location(button2, file$3, 763, 6, 22939);
    			set_style(button3, "border-radius", "0");
    			set_style(button3, "border-left-width", "0");
    			set_style(button3, "border-right-width", "0");
    			add_location(button3, file$3, 766, 6, 23088);
    			set_style(button4, "border-top-left-radius", "0");
    			set_style(button4, "border-bottom-left-radius", "0");
    			add_location(button4, file$3, 769, 6, 23239);
    			set_style(div8, "display", "flex");
    			set_style(div8, "align-items", "baseline");
    			add_location(div8, file$3, 761, 4, 22825);
    			set_style(button5, "margin-left", "auto");
    			add_location(button5, file$3, 776, 4, 23443);
    			add_location(button6, file$3, 779, 4, 23547);
    			attr_dev(div9, "class", "dialog-actions");
    			add_location(div9, file$3, 760, 2, 22792);
    			add_location(dialog0, file$3, 741, 0, 22369);
    			attr_dev(h31, "class", "svelte-1f344py");
    			add_location(h31, file$3, 784, 2, 23651);
    			attr_dev(label2, "for", "apiKeyTxt");
    			add_location(label2, file$3, 786, 2, 23671);
    			set_style(input, "width", "20rem");
    			set_style(input, "font-family", "'Inconsolata', 'SF Mono', Menlo, Consolas, 'Courier New', Courier, monospace");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "apiKeyField");
    			attr_dev(input, "id", "apiKeyTxt");
    			add_location(input, file$3, 787, 2, 23712);
    			add_location(br, file$3, 794, 2, 23925);
    			set_style(small1, "opacity", "0.6");
    			set_style(small1, "cursor", "pointer");
    			set_style(small1, "margin-right", "auto");
    			add_location(small1, file$3, 797, 4, 23968);
    			add_location(button7, file$3, 802, 4, 24144);
    			button8.disabled = button8_disabled_value = /*apiKey*/ ctx[18].length < 1;
    			add_location(button8, file$3, 803, 4, 24210);
    			attr_dev(div10, "class", "dialog-actions");
    			add_location(div10, file$3, 796, 2, 23935);
    			add_location(dialog1, file$3, 783, 0, 23615);
    			attr_dev(h32, "class", "svelte-1f344py");
    			add_location(h32, file$3, 808, 2, 24338);
    			set_style(small2, "opacity", "0.6");
    			set_style(small2, "cursor", "pointer");
    			set_style(small2, "margin-right", "auto");
    			set_style(small2, "color", "var(--error)");
    			add_location(small2, file$3, 844, 4, 25453);
    			attr_dev(div11, "class", "dialog-actions");
    			add_location(div11, file$3, 843, 2, 25420);
    			add_location(dialog2, file$3, 807, 0, 24301);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, main);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t2);
    			append_dev(main, div0);
    			append_dev(div0, button0);
    			append_dev(button0, t3);
    			append_dev(div0, t4);
    			append_dev(div0, button1);
    			append_dev(button1, t5);
    			append_dev(main, t6);
    			append_dev(main, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div1, t7);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(main, t8);
    			if (if_block2) if_block2.m(main, null);
    			append_dev(div5, t9);
    			append_dev(div5, aside);
    			append_dev(aside, div2);
    			if_block3.m(div2, null);
    			append_dev(aside, t10);
    			if (if_block4) if_block4.m(aside, null);
    			append_dev(aside, t11);
    			mount_component(expandableitem, aside, null);
    			append_dev(aside, t12);
    			append_dev(aside, div3);
    			append_dev(div3, span0);
    			append_dev(div3, t14);
    			append_dev(div3, textarea0);
    			/*textarea0_binding*/ ctx[63](textarea0);
    			set_input_value(textarea0, /*columnOutputCode*/ ctx[27]);
    			append_dev(div3, t15);
    			append_dev(div3, p);
    			append_dev(p, t16);
    			append_dev(aside, t17);
    			append_dev(aside, div4);
    			append_dev(div4, span1);
    			append_dev(div4, t19);
    			append_dev(div4, span2);
    			append_dev(div4, t21);
    			append_dev(div4, span3);
    			append_dev(div4, t23);
    			append_dev(div4, span4);
    			insert_dev(target, t25, anchor);
    			insert_dev(target, dialog0, anchor);
    			append_dev(dialog0, h30);
    			append_dev(dialog0, t27);
    			append_dev(dialog0, div6);
    			append_dev(div6, label0);
    			append_dev(div6, t29);
    			append_dev(div6, textarea1);
    			set_input_value(textarea1, /*colBatchImgs*/ ctx[22]);
    			append_dev(dialog0, t30);
    			append_dev(dialog0, div7);
    			append_dev(div7, label1);
    			append_dev(div7, t32);
    			append_dev(div7, textarea2);
    			set_input_value(textarea2, /*colBatchUrls*/ ctx[23]);
    			append_dev(dialog0, t33);
    			append_dev(dialog0, div9);
    			append_dev(div9, div8);
    			append_dev(div8, small0);
    			append_dev(div8, t35);
    			append_dev(div8, button2);
    			append_dev(div8, t37);
    			append_dev(div8, button3);
    			append_dev(div8, t39);
    			append_dev(div8, button4);
    			append_dev(div9, t41);
    			append_dev(div9, button5);
    			append_dev(div9, t43);
    			append_dev(div9, button6);
    			/*dialog0_binding*/ ctx[74](dialog0);
    			insert_dev(target, t45, anchor);
    			insert_dev(target, dialog1, anchor);
    			append_dev(dialog1, h31);
    			append_dev(dialog1, t47);
    			append_dev(dialog1, label2);
    			append_dev(dialog1, t49);
    			append_dev(dialog1, input);
    			set_input_value(input, /*apiKey*/ ctx[18]);
    			append_dev(dialog1, t50);
    			append_dev(dialog1, br);
    			append_dev(dialog1, t51);
    			append_dev(dialog1, div10);
    			append_dev(div10, small1);
    			append_dev(div10, t53);
    			append_dev(div10, button7);
    			append_dev(div10, t55);
    			append_dev(div10, button8);
    			append_dev(button8, t56);
    			/*dialog1_binding*/ ctx[78](dialog1);
    			insert_dev(target, t57, anchor);
    			insert_dev(target, dialog2, anchor);
    			append_dev(dialog2, h32);
    			append_dev(dialog2, t59);
    			if (if_block5) if_block5.m(dialog2, null);
    			append_dev(dialog2, t60);
    			append_dev(dialog2, div11);
    			append_dev(div11, small2);
    			append_dev(div11, t62);
    			if (if_block6) if_block6.m(div11, null);
    			/*dialog2_binding*/ ctx[82](dialog2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*addImage*/ ctx[39], false, false, false),
    					listen_dev(button1, "click", /*doBatchEdit*/ ctx[35], false, false, false),
    					listen_dev(textarea0, "input", /*textarea0_input_handler_1*/ ctx[64]),
    					listen_dev(textarea0, "click", /*columnSelectCode*/ ctx[30], false, false, false),
    					listen_dev(span2, "click", /*click_handler_6*/ ctx[65], false, false, false),
    					listen_dev(span3, "click", /*click_handler_7*/ ctx[66], false, false, false),
    					listen_dev(span4, "click", /*click_handler_8*/ ctx[67], false, false, false),
    					listen_dev(textarea1, "input", /*textarea1_input_handler_1*/ ctx[68]),
    					listen_dev(textarea2, "input", /*textarea2_input_handler*/ ctx[69]),
    					listen_dev(button2, "click", /*click_handler_9*/ ctx[70], false, false, false),
    					listen_dev(button3, "click", /*click_handler_10*/ ctx[71], false, false, false),
    					listen_dev(button4, "click", /*click_handler_11*/ ctx[72], false, false, false),
    					listen_dev(button5, "click", /*click_handler_12*/ ctx[73], false, false, false),
    					listen_dev(button6, "click", /*saveBatchEdits*/ ctx[36], false, false, false),
    					listen_dev(input, "input", /*input_input_handler_1*/ ctx[75]),
    					listen_dev(small1, "click", /*click_handler_13*/ ctx[76], false, false, false),
    					listen_dev(button7, "click", /*click_handler_14*/ ctx[77], false, false, false),
    					listen_dev(button8, "click", /*setUp*/ ctx[34], false, false, false),
    					listen_dev(small2, "click", /*deleteCurrentImg*/ ctx[38], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*uploading*/ ctx[13]) {
    				if (if_block0) {
    					if (dirty[0] & /*uploading*/ 8192) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_7$1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(main, t2);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*uploading*/ 8192) {
    				prop_dev(button0, "disabled", /*uploading*/ ctx[13]);
    			}

    			if (!current || dirty[0] & /*uploading*/ 8192) {
    				prop_dev(button1, "disabled", /*uploading*/ ctx[13]);
    			}

    			if (dirty[0] & /*columnImgData, hovering, dragstart, drop*/ 805306464 | dirty[1] & /*editColImg*/ 64) {
    				const each_value_1 = /*columnImgData*/ ctx[6];
    				validate_each_argument(each_value_1);
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].r();
    				validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, div1, fix_and_destroy_block, create_each_block_1, t7, get_each_context_1);
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].a();
    			}

    			if (/*connState*/ ctx[19] != null) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*connState*/ 524288) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_6$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*imagesPerRow*/ 2) {
    				set_style(div1, "grid-template-columns", "repeat(" + /*imagesPerRow*/ ctx[1] + ", 7rem)");
    			}

    			if (/*columnImgData*/ ctx[6].length > 0 && !/*uploading*/ ctx[13]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*columnImgData, uploading*/ 8256) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_5$1(ctx);
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

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block3) {
    				if_block3.p(ctx, dirty);
    			} else {
    				if_block3.d(1);
    				if_block3 = current_block_type(ctx);

    				if (if_block3) {
    					if_block3.c();
    					if_block3.m(div2, null);
    				}
    			}

    			if (/*connState*/ ctx[19] != null) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);

    					if (dirty[0] & /*connState*/ 524288) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block_3$1(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(aside, t11);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}

    			const expandableitem_changes = {};

    			if (dirty[0] & /*imageStyle, aStyle, columnBetweenBorderStyle, columnBetweenBorderThickness, columnBetweenBorderColor, columnsHGap, columnBetweenBorderPaddingBottom, columnBetweenBorderPaddingTop, imagesPerRow, colWidth, maxWidth*/ 67342214 | dirty[3] & /*$$scope*/ 262144) {
    				expandableitem_changes.$$scope = { dirty, ctx };
    			}

    			expandableitem.$set(expandableitem_changes);

    			if (dirty[0] & /*columnOutputCode*/ 134217728) {
    				set_input_value(textarea0, /*columnOutputCode*/ ctx[27]);
    			}

    			if (!current || dirty[0] & /*columnCopiedToClipboardTxt*/ 4096) set_data_dev(t16, /*columnCopiedToClipboardTxt*/ ctx[12]);

    			if (dirty[0] & /*uploading*/ 8192) {
    				toggle_class(aside, "uploading", /*uploading*/ ctx[13]);
    			}

    			if (dirty[0] & /*colBatchImgs*/ 4194304) {
    				set_input_value(textarea1, /*colBatchImgs*/ ctx[22]);
    			}

    			if (dirty[0] & /*colBatchUrls*/ 8388608) {
    				set_input_value(textarea2, /*colBatchUrls*/ ctx[23]);
    			}

    			if (dirty[0] & /*apiKey*/ 262144 && input.value !== /*apiKey*/ ctx[18]) {
    				set_input_value(input, /*apiKey*/ ctx[18]);
    			}

    			if (!current || dirty[0] & /*apiKey*/ 262144 && button8_disabled_value !== (button8_disabled_value = /*apiKey*/ ctx[18].length < 1)) {
    				prop_dev(button8, "disabled", button8_disabled_value);
    			}

    			if (/*colCurrentEditImg*/ ctx[24] != null) {
    				if (if_block5) {
    					if_block5.p(ctx, dirty);
    				} else {
    					if_block5 = create_if_block_1$1(ctx);
    					if_block5.c();
    					if_block5.m(dialog2, t60);
    				}
    			} else if (if_block5) {
    				if_block5.d(1);
    				if_block5 = null;
    			}

    			if (/*colCurrentEditImg*/ ctx[24] != null) {
    				if (if_block6) {
    					if_block6.p(ctx, dirty);
    				} else {
    					if_block6 = create_if_block$2(ctx);
    					if_block6.c();
    					if_block6.m(div11, null);
    				}
    			} else if (if_block6) {
    				if_block6.d(1);
    				if_block6 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block4);
    			transition_in(expandableitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block4);
    			transition_out(expandableitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			if (if_block0) if_block0.d();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if_block3.d();
    			if (if_block4) if_block4.d();
    			destroy_component(expandableitem);
    			/*textarea0_binding*/ ctx[63](null);
    			if (detaching) detach_dev(t25);
    			if (detaching) detach_dev(dialog0);
    			/*dialog0_binding*/ ctx[74](null);
    			if (detaching) detach_dev(t45);
    			if (detaching) detach_dev(dialog1);
    			/*dialog1_binding*/ ctx[78](null);
    			if (detaching) detach_dev(t57);
    			if (detaching) detach_dev(dialog2);
    			if (if_block5) if_block5.d();
    			if (if_block6) if_block6.d();
    			/*dialog2_binding*/ ctx[82](null);
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

    const placeholderImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQMAAADCCAMAAAB6zFdcAAAAQlBMVEX///+hoaGenp6amprHx8f39/fOzs7j4+P7+/uYmJjT09OlpaXv7+/29va6urq1tbWvr6/AwMDn5+fd3d2xsbGqqqp20Q+8AAACjklEQVR4nO3b6XLCIBSG4QQ0qzHG5f5vtY1byEaiZMY5Z97nX1ukwydSOKFRBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADq7av9hqrs1+P5wjG3mzKHX4/oY5mNt2V2vx7SxzJDBv8ZmA0/wokRmsGG3ZEBGbTIQH4GVVJfm3NYd8IzKKz5Z+ugvxKyMyiemyVzCulOdAb7917JFgHdic6g6PaLt4DuRGfQdBmE7BvJQHgGSZdBGdCd6AwO7zP0wiAy7ywRnYHzYfAOssnzxvNj2RlER9umYGJvHeho/DsI4RlEl1Nsyp13Fjw2Up5hSs+g/crf+LVo2HSuhYIMFpTvdbOaaaE+g27ZNNeZJtozuDgl6LmRKs+g6lWg7XShQXkGt34VfnpHrTuD3eBBhKmnWqnOIB09j5qsM2jOYD/xOMpO7Cg1ZXAejO80+Uhu/Do9GVSltVd3zUsmIzDH0SvVZJCV7cnIKamdZx5Oj5cENRkc7++6aZw2M0aXDbRk8Kqy28vzG/V8BsP6q5IMDt2p4HEySjzXNMygoKIkg7LL4F4sOXhvqrwny4OODJwC8+NkVM4H4EyWJxUZXHrvuk2fC6Qng96SoCGDajji6Z1BLwR30BoyuA2HvOLKVu5U1hRkMDwcruMco+VnkObfROAW28Vn8PVdRZO8uhCfwfXr+5rvypr0DJb/BHhkrz5EZzB3OFzlVVmTnUG2sB9c8DxGy85g/nC4cibcj9GiMyiC7/Dfr25IzsB/OFw3EdrKmuAMsvh+QTNMXojO4JBuQnQGm5GaQZxsp5aaQfhS0JH4/0zRBothT9B15x8577aVLP9KAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABDuD7d6G0PBTSbxAAAAAElFTkSuQmCC";

    function instance$3($$self, $$props, $$invalidate) {
    	var Mailchimp = require("mailchimp-api-v3");
    	let columnImages = "";
    	let columnUrls = "";
    	let apiKeyDialog;
    	let imagesPerRow = 3;
    	let columnsHGap = 0;
    	let folderId = 0;
    	let newFolderName = "";
    	let batchDialog;
    	let hovering = false;

    	const drop = (event, target) => {
    		event.dataTransfer.dropEffect = "move";
    		const start = parseInt(event.dataTransfer.getData("text/plain"));
    		const newTracklist = columnImgData;

    		if (start < target) {
    			newTracklist.splice(target + 1, 0, newTracklist[start]);
    			newTracklist.splice(start, 1);
    		} else {
    			newTracklist.splice(target, 0, newTracklist[start]);
    			newTracklist.splice(start + 1, 1);
    		}

    		$$invalidate(6, columnImgData = newTracklist);
    		$$invalidate(5, hovering = null);
    	};

    	const dragstart = (event, i) => {
    		event.dataTransfer.effectAllowed = "move";
    		event.dataTransfer.dropEffect = "move";
    		const start = i;
    		event.dataTransfer.setData("text/plain", start);
    	};

    	let columnImgData = [];
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
    		$$invalidate(12, columnCopiedToClipboardTxt = "Copied to clipboard");
    		setTimeout(() => $$invalidate(12, columnCopiedToClipboardTxt = "Click to copy"), 2000);
    	};

    	const copyText = txt => {
    		let tempInput = document.createElement("input");
    		tempInput.value = txt;
    		document.body.appendChild(tempInput);
    		tempInput.select();
    		document.execCommand("copy");
    		document.body.removeChild(tempInput);
    	};

    	let previewDebug = false;

    	const toBase64 = () => {
    		filesToUpload = [...uploadElement.files];

    		if (filesToUpload.length > 10) {
    			alert("Select up to 10 files!");
    			return;
    		}

    		$$invalidate(13, uploading = true);

    		for (let piece of chunk(filesToUpload, 10)) {
    			for (let file of piece) {
    				let reader = new FileReader();

    				reader.onloadend = async () => {
    					const readerResult = reader.result;
    					currentBase64 = readerResult.substring(reader.result.indexOf("base64,") + 7);
    					await doUpload(file.name, currentBase64);
    					filesToUpload.shift();

    					if (filesToUpload.length == 0) {
    						$$invalidate(21, uploadElement.value = "", uploadElement);
    						$$invalidate(13, uploading = false);
    					}
    				};

    				reader.readAsDataURL(file);
    			}
    		}
    	};

    	const getId = () => "_" + Math.random().toString(36).substr(2, 9);

    	const getFolderList = async () => {
    		const mailChimp = new Mailchimp(apiKey);
    		let r = await mailChimp.get("/file-manager/folders");
    		console.log(r);
    		let tempFolders = [{ id: 0, name: "Main folder" }];

    		for (let folder of r.folders) {
    			tempFolders.push({ id: folder.id, name: folder.name });
    		}

    		$$invalidate(14, folders = [...tempFolders]);
    	};

    	const addFolder = async () => {
    		const mailChimp = new Mailchimp(apiKey);
    		let r = await mailChimp.post("/file-manager/folders", { name: newFolderName });
    		alert("Folder added!");
    		$$invalidate(3, newFolderName = "");
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
    		$$invalidate(6, columnImgData = [...columnImgData, { img: newImageUrl, url: "#", id: getId() }]);

    		// columnImages += newImageUrl;
    		// columnImages += "\n";
    		// columnUrls += "#";
    		// columnUrls += "\n";
    		currentBase64 = null;

    		currentFileName = null;
    	};

    	let uploadElement;
    	let currentBase64;
    	let currentFileName;

    	const testConnection = async e => {
    		const response = await client.ping.get();
    		$$invalidate(19, connState = "✔ connected");
    	};

    	const setUp = () => {
    		const mailchimp = new Mailchimp(apiKey);

    		mailchimp.get({ path: "/ping" }).then(r => {
    			if (r.statusCode === 200) {
    				$$invalidate(19, connState = "✔ connected");
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

    	let colBatchImgs = "";
    	let colBatchUrls = "";

    	const doBatchEdit = () => {
    		$$invalidate(22, colBatchImgs = "");
    		$$invalidate(23, colBatchUrls = "");

    		for (let item of columnImgData) {
    			$$invalidate(22, colBatchImgs += `${item.img}\n`);
    			$$invalidate(23, colBatchUrls += `${item.url}\n`);
    		}

    		$$invalidate(22, colBatchImgs = colBatchImgs.trimEnd());
    		$$invalidate(23, colBatchUrls = colBatchUrls.trimEnd());
    		batchDialog.showModal();
    	};

    	const saveBatchEdits = () => {
    		let splitImages = colBatchImgs.split("\n");
    		let splitUrls = colBatchUrls.split("\n");

    		if (splitImages.length !== splitUrls.length) {
    			alert("Fields should have the same number of items");
    			return;
    		}

    		for (let i in columnImgData) {
    			$$invalidate(6, columnImgData[i].img = splitImages[i], columnImgData);
    			$$invalidate(6, columnImgData[i].url = splitUrls[i], columnImgData);
    		}

    		for (let i = columnImgData.length; i < splitImages.length; i++) {
    			$$invalidate(6, columnImgData = [
    				...columnImgData,
    				{
    					img: splitImages[i],
    					url: splitUrls[i],
    					id: getId()
    				}
    			]);
    		}

    		batchDialog.close();
    	};

    	let colCurrentEditImg;
    	let editImgDialog;

    	const editColImg = imgIndex => {
    		$$invalidate(24, colCurrentEditImg = imgIndex);
    		editImgDialog.showModal();
    	};

    	const deleteCurrentImg = () => {
    		$$invalidate(6, columnImgData = columnImgData.filter(el => el != colCurrentEditImg));
    		editImgDialog.close();
    	};

    	const addImage = () => {
    		$$invalidate(6, columnImgData = [...columnImgData, { img: "", url: "", id: getId() }]);
    		$$invalidate(24, colCurrentEditImg = columnImgData.length - 1);
    		editImgDialog.showModal();
    	};

    	const getColTempImgData = async () => {
    		let currentUrl = columnImgData[colCurrentEditImg].img;
    		if (currentUrl.length < 11) return placeholderImage;
    		let data = await fetch(currentUrl, { method: "HEAD" });
    		console.log(data);

    		if (data.ok) {
    			return currentUrl;
    		}

    		return placeholderImage;
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<MultiColumn> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("MultiColumn", $$slots, []);
    	const click_handler = index => editColImg(index);
    	const dragstart_handler = (index, event) => dragstart(event, index);
    	const drop_handler = (index, event) => drop(event, index);
    	const dragenter_handler = index => $$invalidate(5, hovering = index);

    	function input_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			uploadElement = $$value;
    			$$invalidate(21, uploadElement);
    		});
    	}

    	const click_handler_1 = () => apiKeyDialog.showModal();

    	const click_handler_2 = () => {
    		$$invalidate(18, apiKey = "");
    		$$invalidate(19, connState = null);
    	};

    	function input_input_handler() {
    		newFolderName = this.value;
    		$$invalidate(3, newFolderName);
    	}

    	const click_handler_3 = () => addFolder();

    	function input0_change_input_handler() {
    		maxWidth = to_number(this.value);
    		$$invalidate(17, maxWidth);
    	}

    	function input1_change_input_handler() {
    		imagesPerRow = to_number(this.value);
    		$$invalidate(1, imagesPerRow);
    	}

    	function input2_change_input_handler() {
    		columnBetweenBorderPaddingTop = to_number(this.value);
    		$$invalidate(10, columnBetweenBorderPaddingTop);
    	}

    	function input3_change_input_handler() {
    		columnBetweenBorderPaddingBottom = to_number(this.value);
    		$$invalidate(11, columnBetweenBorderPaddingBottom);
    	}

    	function input4_change_input_handler() {
    		columnsHGap = to_number(this.value);
    		$$invalidate(2, columnsHGap);
    	}

    	function input5_change_input_handler() {
    		columnBetweenBorderThickness = to_number(this.value);
    		$$invalidate(7, columnBetweenBorderThickness);
    	}

    	function input0_input_handler() {
    		columnBetweenBorderColor = this.value;
    		$$invalidate(9, columnBetweenBorderColor);
    	}

    	function input1_input_handler() {
    		columnBetweenBorderColor = this.value;
    		$$invalidate(9, columnBetweenBorderColor);
    	}

    	function select_change_handler() {
    		columnBetweenBorderStyle = select_value(this);
    		$$invalidate(8, columnBetweenBorderStyle);
    	}

    	function textarea0_input_handler() {
    		aStyle = this.value;
    		$$invalidate(16, aStyle);
    	}

    	function textarea1_input_handler() {
    		imageStyle = this.value;
    		$$invalidate(15, imageStyle);
    	}

    	const click_handler_4 = () => copyText("{columnWidth}");
    	const click_handler_5 = () => copyText("{setGap}");

    	function textarea0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			columnOutputTextArea = $$value;
    			$$invalidate(20, columnOutputTextArea);
    		});
    	}

    	function textarea0_input_handler_1() {
    		columnOutputCode = this.value;
    		((((((((((((((((($$invalidate(27, columnOutputCode), $$invalidate(90, columnItemsChunked)), $$invalidate(92, getColChildItems)), $$invalidate(93, columnBetweenBorder)), $$invalidate(6, columnImgData)), $$invalidate(1, imagesPerRow)), $$invalidate(16, aStyle)), $$invalidate(86, parsedImageStyle)), $$invalidate(91, columnSeparatorTd)), $$invalidate(2, columnsHGap)), $$invalidate(10, columnBetweenBorderPaddingTop)), $$invalidate(7, columnBetweenBorderThickness)), $$invalidate(8, columnBetweenBorderStyle)), $$invalidate(9, columnBetweenBorderColor)), $$invalidate(11, columnBetweenBorderPaddingBottom)), $$invalidate(15, imageStyle)), $$invalidate(26, colWidth)), $$invalidate(17, maxWidth));
    	}

    	const click_handler_6 = () => {
    		$$invalidate(6, columnImgData = [
    			{
    				img: "https://picsum.photos/id/10/300",
    				url: "#",
    				id: 0
    			},
    			{
    				img: "https://picsum.photos/id/20/300",
    				url: "#",
    				id: 1
    			}
    		]);
    	};

    	const click_handler_7 = () => {
    		$$invalidate(6, columnImgData = [
    			{
    				img: "https://picsum.photos/id/1/300",
    				url: "#",
    				id: 0
    			},
    			{
    				img: "https://picsum.photos/id/10/300",
    				url: "#",
    				id: 1
    			},
    			{
    				img: "https://picsum.photos/id/20/300",
    				url: "#",
    				id: 2
    			},
    			{
    				img: "https://picsum.photos/id/30/300",
    				url: "#",
    				id: 3
    			},
    			{
    				img: "https://picsum.photos/id/40/300",
    				url: "#",
    				id: 4
    			},
    			{
    				img: "https://picsum.photos/id/50/300",
    				url: "#",
    				id: 5
    			}
    		]);
    	};

    	const click_handler_8 = () => {
    		$$invalidate(6, columnImgData = [
    			{
    				img: "https://picsum.photos/id/1/300",
    				url: "#",
    				id: 0
    			},
    			{
    				img: "https://picsum.photos/id/10/300",
    				url: "#",
    				id: 1
    			},
    			{
    				img: "https://picsum.photos/id/20/300",
    				url: "#",
    				id: 2
    			},
    			{
    				img: "https://picsum.photos/id/30/300",
    				url: "#",
    				id: 3
    			},
    			{
    				img: "https://picsum.photos/id/40/300",
    				url: "#",
    				id: 4
    			},
    			{
    				img: "https://picsum.photos/id/50/300",
    				url: "#",
    				id: 5
    			},
    			{
    				img: "https://picsum.photos/id/60/300",
    				url: "#",
    				id: 6
    			},
    			{
    				img: "https://picsum.photos/id/70/300",
    				url: "#",
    				id: 7
    			},
    			{
    				img: "https://picsum.photos/id/80/300",
    				url: "#",
    				id: 8
    			},
    			{
    				img: "https://picsum.photos/id/90/300",
    				url: "#",
    				id: 9
    			},
    			{
    				img: "https://picsum.photos/id/100/300",
    				url: "#",
    				id: 10
    			},
    			{
    				img: "https://picsum.photos/id/110/300",
    				url: "#",
    				id: 11
    			}
    		]);
    	};

    	function textarea1_input_handler_1() {
    		colBatchImgs = this.value;
    		$$invalidate(22, colBatchImgs);
    	}

    	function textarea2_input_handler() {
    		colBatchUrls = this.value;
    		$$invalidate(23, colBatchUrls);
    	}

    	const click_handler_9 = () => $$invalidate(22, colBatchImgs = "");
    	const click_handler_10 = () => $$invalidate(23, colBatchUrls = "");

    	const click_handler_11 = () => {
    		$$invalidate(22, colBatchImgs = "");
    		$$invalidate(23, colBatchUrls = "");
    	};

    	const click_handler_12 = () => batchDialog.close();

    	function dialog0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			batchDialog = $$value;
    			$$invalidate(4, batchDialog);
    		});
    	}

    	function input_input_handler_1() {
    		apiKey = this.value;
    		$$invalidate(18, apiKey);
    	}

    	const click_handler_13 = () => $$invalidate(18, apiKey = "be378ccde22c3aa784133ae1fe4ed5ec-us2");
    	const click_handler_14 = () => apiKeyDialog.close();

    	function dialog1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			apiKeyDialog = $$value;
    			$$invalidate(0, apiKeyDialog);
    		});
    	}

    	function input0_input_handler_1() {
    		columnImgData[colCurrentEditImg].img = this.value;
    		$$invalidate(6, columnImgData);
    		$$invalidate(24, colCurrentEditImg);
    	}

    	function input1_input_handler_1() {
    		columnImgData[colCurrentEditImg].url = this.value;
    		$$invalidate(6, columnImgData);
    		$$invalidate(24, colCurrentEditImg);
    	}

    	const click_handler_15 = () => editImgDialog.close();

    	function dialog2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			editImgDialog = $$value;
    			$$invalidate(25, editImgDialog);
    		});
    	}

    	$$self.$capture_state = () => ({
    		slide,
    		ExpandableItem,
    		flip,
    		Icon,
    		Mailchimp,
    		placeholderImage,
    		columnImages,
    		columnUrls,
    		apiKeyDialog,
    		imagesPerRow,
    		columnsHGap,
    		folderId,
    		newFolderName,
    		batchDialog,
    		hovering,
    		drop,
    		dragstart,
    		columnImgData,
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
    		copyText,
    		previewDebug,
    		toBase64,
    		getId,
    		getFolderList,
    		addFolder,
    		doUpload,
    		uploadElement,
    		currentBase64,
    		currentFileName,
    		testConnection,
    		setUp,
    		chunk,
    		colBatchImgs,
    		colBatchUrls,
    		doBatchEdit,
    		saveBatchEdits,
    		colCurrentEditImg,
    		editImgDialog,
    		editColImg,
    		deleteCurrentImg,
    		addImage,
    		getColTempImgData,
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
    		if ("columnImages" in $$props) $$invalidate(95, columnImages = $$props.columnImages);
    		if ("columnUrls" in $$props) $$invalidate(96, columnUrls = $$props.columnUrls);
    		if ("apiKeyDialog" in $$props) $$invalidate(0, apiKeyDialog = $$props.apiKeyDialog);
    		if ("imagesPerRow" in $$props) $$invalidate(1, imagesPerRow = $$props.imagesPerRow);
    		if ("columnsHGap" in $$props) $$invalidate(2, columnsHGap = $$props.columnsHGap);
    		if ("folderId" in $$props) folderId = $$props.folderId;
    		if ("newFolderName" in $$props) $$invalidate(3, newFolderName = $$props.newFolderName);
    		if ("batchDialog" in $$props) $$invalidate(4, batchDialog = $$props.batchDialog);
    		if ("hovering" in $$props) $$invalidate(5, hovering = $$props.hovering);
    		if ("columnImgData" in $$props) $$invalidate(6, columnImgData = $$props.columnImgData);
    		if ("columnBetweenBorderThickness" in $$props) $$invalidate(7, columnBetweenBorderThickness = $$props.columnBetweenBorderThickness);
    		if ("columnBetweenBorderStyle" in $$props) $$invalidate(8, columnBetweenBorderStyle = $$props.columnBetweenBorderStyle);
    		if ("columnBetweenBorderColor" in $$props) $$invalidate(9, columnBetweenBorderColor = $$props.columnBetweenBorderColor);
    		if ("columnBetweenBorderPaddingTop" in $$props) $$invalidate(10, columnBetweenBorderPaddingTop = $$props.columnBetweenBorderPaddingTop);
    		if ("columnBetweenBorderPaddingBottom" in $$props) $$invalidate(11, columnBetweenBorderPaddingBottom = $$props.columnBetweenBorderPaddingBottom);
    		if ("columnCopiedToClipboardTxt" in $$props) $$invalidate(12, columnCopiedToClipboardTxt = $$props.columnCopiedToClipboardTxt);
    		if ("uploading" in $$props) $$invalidate(13, uploading = $$props.uploading);
    		if ("filesToUpload" in $$props) filesToUpload = $$props.filesToUpload;
    		if ("folders" in $$props) $$invalidate(14, folders = $$props.folders);
    		if ("imageStyle" in $$props) $$invalidate(15, imageStyle = $$props.imageStyle);
    		if ("aStyle" in $$props) $$invalidate(16, aStyle = $$props.aStyle);
    		if ("maxWidth" in $$props) $$invalidate(17, maxWidth = $$props.maxWidth);
    		if ("apiKey" in $$props) $$invalidate(18, apiKey = $$props.apiKey);
    		if ("connState" in $$props) $$invalidate(19, connState = $$props.connState);
    		if ("columnOutputTextArea" in $$props) $$invalidate(20, columnOutputTextArea = $$props.columnOutputTextArea);
    		if ("previewDebug" in $$props) previewDebug = $$props.previewDebug;
    		if ("uploadElement" in $$props) $$invalidate(21, uploadElement = $$props.uploadElement);
    		if ("currentBase64" in $$props) currentBase64 = $$props.currentBase64;
    		if ("currentFileName" in $$props) currentFileName = $$props.currentFileName;
    		if ("colBatchImgs" in $$props) $$invalidate(22, colBatchImgs = $$props.colBatchImgs);
    		if ("colBatchUrls" in $$props) $$invalidate(23, colBatchUrls = $$props.colBatchUrls);
    		if ("colCurrentEditImg" in $$props) $$invalidate(24, colCurrentEditImg = $$props.colCurrentEditImg);
    		if ("editImgDialog" in $$props) $$invalidate(25, editImgDialog = $$props.editImgDialog);
    		if ("parsedImageStyle" in $$props) $$invalidate(86, parsedImageStyle = $$props.parsedImageStyle);
    		if ("colWidth" in $$props) $$invalidate(26, colWidth = $$props.colWidth);
    		if ("splitImages" in $$props) $$invalidate(87, splitImages = $$props.splitImages);
    		if ("splitUrls" in $$props) $$invalidate(88, splitUrls = $$props.splitUrls);
    		if ("columnItems" in $$props) columnItems = $$props.columnItems;
    		if ("columnItemsChunked" in $$props) $$invalidate(90, columnItemsChunked = $$props.columnItemsChunked);
    		if ("columnSeparatorTd" in $$props) $$invalidate(91, columnSeparatorTd = $$props.columnSeparatorTd);
    		if ("getColChildItems" in $$props) $$invalidate(92, getColChildItems = $$props.getColChildItems);
    		if ("columnOutputCode" in $$props) $$invalidate(27, columnOutputCode = $$props.columnOutputCode);
    		if ("columnBetweenBorder" in $$props) $$invalidate(93, columnBetweenBorder = $$props.columnBetweenBorder);
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
    		if ($$self.$$.dirty[0] & /*maxWidth, imagesPerRow, columnsHGap*/ 131078) {
    			 $$invalidate(26, colWidth = Math.floor((maxWidth - (imagesPerRow - 1) * columnsHGap) / imagesPerRow));
    		}

    		if ($$self.$$.dirty[0] & /*imageStyle, colWidth*/ 67141632) {
    			 $$invalidate(86, parsedImageStyle = imageStyle.replace("{columnWidth}", colWidth));
    		}

    		if ($$self.$$.dirty[2] & /*splitImages, splitUrls*/ 100663296) {
    			 columnItems = splitImages.map(i => {
    				let index = splitImages.indexOf(i);
    				return { image: i, url: splitUrls[index] };
    			});
    		}

    		if ($$self.$$.dirty[0] & /*columnImgData, imagesPerRow*/ 66) {
    			 $$invalidate(90, columnItemsChunked = new Array(Math.ceil(columnImgData.length / imagesPerRow)).fill().map((_, i) => columnImgData.slice(i * imagesPerRow, i * imagesPerRow + imagesPerRow)));
    		}

    		if ($$self.$$.dirty[0] & /*columnsHGap*/ 4) {
    			 $$invalidate(91, columnSeparatorTd = columnsHGap > 0
    			? `<td style="padding: 0; margin: 0; border: 0; padding: 0 ${columnsHGap}px 0 0;"></td>`
    			: "");
    		}

    		if ($$self.$$.dirty[0] & /*aStyle*/ 65536 | $$self.$$.dirty[2] & /*parsedImageStyle, columnSeparatorTd*/ 553648128) {
    			 $$invalidate(92, getColChildItems = source => source.map(item => `<td style="border: 0; padding: 0; margin: 0;">\n\t<a href="${item.url}" style="${aStyle}">\n\t\t<img src="${item.img}" style="padding: 0; margin: 0; display: block; ${parsedImageStyle}" />
      </a></td>`).join(`${columnSeparatorTd}\n`));
    		}

    		if ($$self.$$.dirty[0] & /*columnsHGap, imagesPerRow, columnBetweenBorderPaddingTop, columnBetweenBorderThickness, columnBetweenBorderStyle, columnBetweenBorderColor, columnBetweenBorderPaddingBottom*/ 3974) {
    			 $$invalidate(93, columnBetweenBorder = `\n<tr style="border: 0; padding: 0; margin: 0;"><td colspan="${columnsHGap > 0
			? imagesPerRow + (imagesPerRow - 1)
			: imagesPerRow}" style="padding: 0; padding-top: ${columnBetweenBorderPaddingTop}px; height: 0; ${columnBetweenBorderThickness > 0
			? `border-bottom: ${columnBetweenBorderThickness}px ${columnBetweenBorderStyle} ${columnBetweenBorderColor};`
			: "border: 0;"}"></td></tr><tr style="border: 0; padding: 0; margin: 0;"><td colspan="${imagesPerRow}" style="padding: 0; padding-top: ${columnBetweenBorderPaddingBottom}px; height: 0; border: 0;}"></td></tr>`);
    		}

    		if ($$self.$$.dirty[2] & /*columnItemsChunked, getColChildItems*/ 1342177280 | $$self.$$.dirty[3] & /*columnBetweenBorder*/ 1) {
    			 $$invalidate(27, columnOutputCode = "<div class=\"mcnTextContent\" style=\"text-align: center; margin: 0; padding: 0; line-height: 0;\"><table style=\"border-collapse: collapse; margin: 0; padding: 0;\">" + columnItemsChunked.map(item => `<tr style="border: 0; padding: 0; margin: 0;">\n${getColChildItems(item)}\n</tr>`).join(`${columnBetweenBorder}\n`) + "</table></div>");
    		}
    	};

    	 $$invalidate(87, splitImages = columnImages.trimEnd().split("\n"));
    	 $$invalidate(88, splitUrls = columnUrls.trimEnd().split("\n"));

    	return [
    		apiKeyDialog,
    		imagesPerRow,
    		columnsHGap,
    		newFolderName,
    		batchDialog,
    		hovering,
    		columnImgData,
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
    		colBatchImgs,
    		colBatchUrls,
    		colCurrentEditImg,
    		editImgDialog,
    		colWidth,
    		columnOutputCode,
    		drop,
    		dragstart,
    		columnSelectCode,
    		copyText,
    		toBase64,
    		addFolder,
    		setUp,
    		doBatchEdit,
    		saveBatchEdits,
    		editColImg,
    		deleteCurrentImg,
    		addImage,
    		getColTempImgData,
    		click_handler,
    		dragstart_handler,
    		drop_handler,
    		dragenter_handler,
    		input_binding,
    		click_handler_1,
    		click_handler_2,
    		input_input_handler,
    		click_handler_3,
    		input0_change_input_handler,
    		input1_change_input_handler,
    		input2_change_input_handler,
    		input3_change_input_handler,
    		input4_change_input_handler,
    		input5_change_input_handler,
    		input0_input_handler,
    		input1_input_handler,
    		select_change_handler,
    		textarea0_input_handler,
    		textarea1_input_handler,
    		click_handler_4,
    		click_handler_5,
    		textarea0_binding,
    		textarea0_input_handler_1,
    		click_handler_6,
    		click_handler_7,
    		click_handler_8,
    		textarea1_input_handler_1,
    		textarea2_input_handler,
    		click_handler_9,
    		click_handler_10,
    		click_handler_11,
    		click_handler_12,
    		dialog0_binding,
    		input_input_handler_1,
    		click_handler_13,
    		click_handler_14,
    		dialog1_binding,
    		input0_input_handler_1,
    		input1_input_handler_1,
    		click_handler_15,
    		dialog2_binding
    	];
    }

    class MultiColumn extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {}, [-1, -1, -1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MultiColumn",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.24.1 */
    const file$4 = "src/App.svelte";

    // (152:4) {#if process.platform === 'darwin'}
    function create_if_block_3$2(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "✗";
    			set_style(button, "margin-right", "0.25rem");
    			attr_dev(button, "class", "macCloseBtn svelte-1g2vejw");
    			add_location(button, file$4, 152, 6, 3118);
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
    		id: create_if_block_3$2.name,
    		type: "if",
    		source: "(152:4) {#if process.platform === 'darwin'}",
    		ctx
    	});

    	return block;
    }

    // (168:4) {#if process.platform !== 'darwin'}
    function create_if_block_2$2(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "×";
    			attr_dev(button, "class", "winCloseBtn svelte-1g2vejw");
    			add_location(button, file$4, 168, 6, 3581);
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
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(168:4) {#if process.platform !== 'darwin'}",
    		ctx
    	});

    	return block;
    }

    // (178:31) 
    function create_if_block_1$2(ctx) {
    	let div;
    	let buttongenerator;
    	let div_transition;
    	let current;
    	buttongenerator = new ButtonGenerator({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(buttongenerator.$$.fragment);
    			add_location(div, file$4, 178, 6, 3861);
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
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(178:31) ",
    		ctx
    	});

    	return block;
    }

    // (174:4) {#if currentPage == 1}
    function create_if_block$3(ctx) {
    	let div;
    	let multicolumn;
    	let div_transition;
    	let current;
    	multicolumn = new MultiColumn({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(multicolumn.$$.fragment);
    			add_location(div, file$4, 174, 6, 3729);
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
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(174:4) {#if currentPage == 1}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
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
    	let if_block0 = process.platform === "darwin" && create_if_block_3$2(ctx);
    	let if_block1 = process.platform !== "darwin" && create_if_block_2$2(ctx);
    	const if_block_creators = [create_if_block$3, create_if_block_1$2];
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
    			add_location(button0, file$4, 158, 4, 3259);
    			attr_dev(button1, "class", "tabBtn svelte-1g2vejw");
    			toggle_class(button1, "active", /*currentPage*/ ctx[0] == 2);
    			add_location(button1, file$4, 162, 4, 3400);
    			attr_dev(div0, "class", "sidebar svelte-1g2vejw");
    			add_location(div0, file$4, 150, 2, 3050);
    			attr_dev(div1, "class", "content svelte-1g2vejw");
    			add_location(div1, file$4, 172, 2, 3674);
    			attr_dev(div2, "class", "grid svelte-1g2vejw");
    			add_location(div2, file$4, 149, 0, 3029);
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
