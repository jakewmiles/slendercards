
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
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
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
        return value === '' ? null : +value;
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
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
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
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
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
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
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
            set_current_component(null);
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
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
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
            if (running_program || pending_program) {
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
                                if (info.blocks[i] === block) {
                                    info.blocks[i] = null;
                                }
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
                if (!info.hasCatch) {
                    throw error;
                }
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
    function update_await_block_branch(info, ctx, dirty) {
        const child_ctx = ctx.slice();
        const { resolved } = info;
        if (info.current === info.then) {
            child_ctx[info.value] = resolved;
        }
        if (info.current === info.catch) {
            child_ctx[info.error] = resolved;
        }
        info.block.p(child_ctx, dirty);
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
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
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
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
        }
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
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
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
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
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
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /**
     * @typedef {Object} WrappedComponent Object returned by the `wrap` method
     * @property {SvelteComponent} component - Component to load (this is always asynchronous)
     * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
     * @property {Object} [props] - Optional dictionary of static props
     * @property {Object} [userData] - Optional user data dictionary
     * @property {bool} _sveltesparouter - Internal flag; always set to true
     */

    /**
     * @callback AsyncSvelteComponent
     * @returns {Promise<SvelteComponent>} Returns a Promise that resolves with a Svelte component
     */

    /**
     * @callback RoutePrecondition
     * @param {RouteDetail} detail - Route detail object
     * @returns {boolean|Promise<boolean>} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
     */

    /**
     * @typedef {Object} WrapOptions Options object for the call to `wrap`
     * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
     * @property {AsyncSvelteComponent} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
     * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
     * @property {object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
     * @property {object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
     * @property {object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
     * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
     */

    /**
     * Wraps a component to enable multiple capabilities:
     * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
     * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
     * 3. Adding static props that are passed to the component
     * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
     * 
     * @param {WrapOptions} args - Arguments object
     * @returns {WrappedComponent} Wrapped component
     */
    function wrap$1(args) {
        if (!args) {
            throw Error('Parameter args is required')
        }

        // We need to have one and only one of component and asyncComponent
        // This does a "XNOR"
        if (!args.component == !args.asyncComponent) {
            throw Error('One and only one of component and asyncComponent is required')
        }

        // If the component is not async, wrap it into a function returning a Promise
        if (args.component) {
            args.asyncComponent = () => Promise.resolve(args.component);
        }

        // Parameter asyncComponent and each item of conditions must be functions
        if (typeof args.asyncComponent != 'function') {
            throw Error('Parameter asyncComponent must be a function')
        }
        if (args.conditions) {
            // Ensure it's an array
            if (!Array.isArray(args.conditions)) {
                args.conditions = [args.conditions];
            }
            for (let i = 0; i < args.conditions.length; i++) {
                if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                    throw Error('Invalid parameter conditions[' + i + ']')
                }
            }
        }

        // Check if we have a placeholder component
        if (args.loadingComponent) {
            args.asyncComponent.loading = args.loadingComponent;
            args.asyncComponent.loadingParams = args.loadingParams || undefined;
        }

        // Returns an object that contains all the functions to execute too
        // The _sveltesparouter flag is to confirm the object was created by this router
        const obj = {
            component: args.asyncComponent,
            userData: args.userData,
            conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
            props: (args.props && Object.keys(args.props).length) ? args.props : {},
            _sveltesparouter: true
        };

        return obj
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function regexparam (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.38.2 */

    const { Error: Error_1, Object: Object_1$1, console: console_1 } = globals;

    // (209:0) {:else}
    function create_else_block$2(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(209:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (202:0) {#if componentParams}
    function create_if_block$7(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(202:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$7, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
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
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
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
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap(component, userData, ...conditions) {
    	// Use the new wrap method and show a deprecation warning
    	// eslint-disable-next-line no-console
    	console.warn("Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading");

    	return wrap$1({ component, userData, conditions });
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	// Check if there's a querystring
    	const qsPosition = location.indexOf("?");

    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener("hashchange", update, false);

    	return function stop() {
    		window.removeEventListener("hashchange", update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			scrollX: window.scrollX,
    			scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == "#" ? "" : "#") + location;

    	try {
    		window.history.replaceState(undefined, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn("Caught exception while replacing the current page. If you're running this in the Svelte REPL, please note that the `replace` method might not work in this environment.");
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event("hashchange"));
    }

    function link(node, hrefVar) {
    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
    		throw Error("Action \"link\" can only be used with <a> tags");
    	}

    	updateLink(node, hrefVar || node.getAttribute("href"));

    	return {
    		update(updated) {
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, href) {
    	// Destination must start with '/'
    	if (!href || href.length < 1 || href.charAt(0) != "/") {
    		throw Error("Invalid value for \"href\" attribute: " + href);
    	}

    	// Add # to the href attribute
    	node.setAttribute("href", "#" + href);

    	node.addEventListener("click", scrollstateHistoryHandler);
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {HTMLElementEventMap} event - an onclick event attached to an anchor tag
     */
    function scrollstateHistoryHandler(event) {
    	// Prevent default anchor onclick behaviour
    	event.preventDefault();

    	const href = event.currentTarget.getAttribute("href");

    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			scrollX: window.scrollX,
    			scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Router", slots, []);
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument - strings must start with / or *");
    			}

    			const { pattern, keys } = regexparam(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == "object" && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, check if it matches the start of the path.
    			// If not, bail early, else remove it before we run the matching.
    			if (prefix) {
    				if (typeof prefix == "string") {
    					if (path.startsWith(prefix)) {
    						path = path.substr(prefix.length) || "/";
    					} else {
    						return null;
    					}
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || "/";
    					} else {
    						return null;
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || "") || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {bool} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	if (restoreScrollState) {
    		window.addEventListener("popstate", event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && event.state.scrollY) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		});

    		afterUpdate(() => {
    			// If this exists, then this is a back navigation: restore the scroll position
    			if (previousScrollState) {
    				window.scrollTo(previousScrollState.scrollX, previousScrollState.scrollY);
    			} else {
    				// Otherwise this is a forward navigation: scroll to top
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick("conditionsFailed", detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoading", Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == "object" && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    	});

    	const writable_props = ["routes", "prefix", "restoreScrollState"];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble($$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		derived,
    		tick,
    		_wrap: wrap$1,
    		wrap,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		scrollstateHistoryHandler,
    		createEventDispatcher,
    		afterUpdate,
    		regexparam,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		lastLoc,
    		componentObj
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ("props" in $$props) $$invalidate(2, props = $$props.props);
    		if ("previousScrollState" in $$props) previousScrollState = $$props.previousScrollState;
    		if ("lastLoc" in $$props) lastLoc = $$props.lastLoc;
    		if ("componentObj" in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			history.scrollRestoration = restoreScrollState ? "manual" : "auto";
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$b.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Home.svelte generated by Svelte v3.38.2 */

    const file$a = "src/Home.svelte";

    function create_fragment$a(ctx) {
    	let main;
    	let div;
    	let h1;
    	let t1;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Welcome to";
    			t1 = space();
    			img = element("img");
    			attr_dev(h1, "class", "svelte-sfwlar");
    			add_location(h1, file$a, 2, 3, 36);
    			if (img.src !== (img_src_value = "animated-logo.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "slendercards");
    			attr_dev(img, "class", "svelte-sfwlar");
    			add_location(img, file$a, 3, 4, 61);
    			attr_dev(div, "class", "container svelte-sfwlar");
    			add_location(div, file$a, 1, 2, 9);
    			add_location(main, file$a, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			append_dev(div, img);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Home", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    /* src/Create/LanguageChoices.svelte generated by Svelte v3.38.2 */

    const { Object: Object_1 } = globals;
    const file$9 = "src/Create/LanguageChoices.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i][0];
    	child_ctx[10] = list[i][1];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i][0];
    	child_ctx[10] = list[i][1];
    	return child_ctx;
    }

    // (12:6) {#each Object.entries(languages) as [language, emoji]}
    function create_each_block_1(ctx) {
    	let button;
    	let t0_value = /*emoji*/ ctx[10] + "";
    	let t0;
    	let t1_value = /*language*/ ctx[9] + "";
    	let t1;
    	let t2;
    	let button_intro;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[6](/*language*/ ctx[9], /*emoji*/ ctx[10]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(button, "class", "animated-button language-choice svelte-n0o2o7");
    			add_location(button, file$9, 12, 8, 445);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);
    			append_dev(button, t2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i: function intro(local) {
    			if (!button_intro) {
    				add_render_callback(() => {
    					button_intro = create_in_transition(button, fly, { x: -100, duration: 1000 });
    					button_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(12:6) {#each Object.entries(languages) as [language, emoji]}",
    		ctx
    	});

    	return block;
    }

    // (21:6) {#each Object.entries(languages) as [language, emoji]}
    function create_each_block$2(ctx) {
    	let button;
    	let t0_value = /*emoji*/ ctx[10] + "";
    	let t0;
    	let t1_value = /*language*/ ctx[9] + "";
    	let t1;
    	let t2;
    	let button_intro;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[7](/*language*/ ctx[9], /*emoji*/ ctx[10]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(button, "class", "animated-button language-choice svelte-n0o2o7");
    			add_location(button, file$9, 21, 6, 795);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);
    			append_dev(button, t2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i: function intro(local) {
    			if (!button_intro) {
    				add_render_callback(() => {
    					button_intro = create_in_transition(button, fly, { x: 100, duration: 1000 });
    					button_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(21:6) {#each Object.entries(languages) as [language, emoji]}",
    		ctx
    	});

    	return block;
    }

    // (33:2) {:else}
    function create_else_block_1(ctx) {
    	let h3;
    	let t0;
    	let t1_value = /*languages*/ ctx[5][/*srcLang*/ ctx[1]] + "";
    	let t1;
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t0 = text("Source: ");
    			t1 = text(t1_value);
    			t2 = space();
    			t3 = text(/*srcLang*/ ctx[1]);
    			add_location(h3, file$9, 33, 4, 1114);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t0);
    			append_dev(h3, t1);
    			append_dev(h3, t2);
    			append_dev(h3, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*srcLang*/ 2 && t1_value !== (t1_value = /*languages*/ ctx[5][/*srcLang*/ ctx[1]] + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*srcLang*/ 2) set_data_dev(t3, /*srcLang*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(33:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (31:2) {#if !srcLang}
    function create_if_block_1$3(ctx) {
    	let h3;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "No L1 selected";
    			add_location(h3, file$9, 31, 4, 1076);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(31:2) {#if !srcLang}",
    		ctx
    	});

    	return block;
    }

    // (38:2) {:else}
    function create_else_block$1(ctx) {
    	let h3;
    	let t0;
    	let t1_value = /*languages*/ ctx[5][/*targLang*/ ctx[3]] + "";
    	let t1;
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t0 = text("Target: ");
    			t1 = text(t1_value);
    			t2 = space();
    			t3 = text(/*targLang*/ ctx[3]);
    			add_location(h3, file$9, 38, 4, 1230);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t0);
    			append_dev(h3, t1);
    			append_dev(h3, t2);
    			append_dev(h3, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*targLang*/ 8 && t1_value !== (t1_value = /*languages*/ ctx[5][/*targLang*/ ctx[3]] + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*targLang*/ 8) set_data_dev(t3, /*targLang*/ ctx[3]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(38:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (36:2) {#if !targLang}
    function create_if_block$6(ctx) {
    	let h3;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "No L2 selected";
    			add_location(h3, file$9, 36, 4, 1192);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(36:2) {#if !targLang}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div2;
    	let div0;
    	let h30;
    	let t1;
    	let t2;
    	let div1;
    	let h31;
    	let t4;
    	let t5;
    	let h1;
    	let t7;
    	let t8;
    	let t9;
    	let button;
    	let mounted;
    	let dispose;
    	let each_value_1 = Object.entries(/*languages*/ ctx[5]);
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = Object.entries(/*languages*/ ctx[5]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	function select_block_type(ctx, dirty) {
    		if (!/*srcLang*/ ctx[1]) return create_if_block_1$3;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (!/*targLang*/ ctx[3]) return create_if_block$6;
    		return create_else_block$1;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h30 = element("h3");
    			h30.textContent = "Source:";
    			t1 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t2 = space();
    			div1 = element("div");
    			h31 = element("h3");
    			h31.textContent = "Target:";
    			t4 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			h1 = element("h1");
    			h1.textContent = "Chosen languages:";
    			t7 = space();
    			if_block0.c();
    			t8 = space();
    			if_block1.c();
    			t9 = space();
    			button = element("button");
    			button.textContent = "NEXT";
    			add_location(h30, file$9, 10, 6, 359);
    			attr_dev(div0, "class", "src-lang-list");
    			add_location(div0, file$9, 9, 4, 325);
    			add_location(h31, file$9, 19, 6, 711);
    			attr_dev(div1, "class", "targ-lang-list");
    			add_location(div1, file$9, 18, 4, 676);
    			attr_dev(div2, "class", "lang-container");
    			add_location(div2, file$9, 8, 2, 292);
    			add_location(h1, file$9, 29, 2, 1028);
    			attr_dev(button, "class", "svelte-n0o2o7");
    			add_location(button, file$9, 41, 2, 1291);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h30);
    			append_dev(div0, t1);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div0, null);
    			}

    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, h31);
    			append_dev(div1, t4);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			insert_dev(target, t5, anchor);
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t7, anchor);
    			if_block0.m(target, anchor);
    			insert_dev(target, t8, anchor);
    			if_block1.m(target, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_2*/ ctx[8], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*srcLangHandler, Object, languages*/ 36) {
    				each_value_1 = Object.entries(/*languages*/ ctx[5]);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    						transition_in(each_blocks_1[i], 1);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						transition_in(each_blocks_1[i], 1);
    						each_blocks_1[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*targLangHandler, Object, languages*/ 48) {
    				each_value = Object.entries(/*languages*/ ctx[5]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(t8.parentNode, t8);
    				}
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(t9.parentNode, t9);
    				}
    			}
    		},
    		i: function intro(local) {
    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t7);
    			if_block0.d(detaching);
    			if (detaching) detach_dev(t8);
    			if_block1.d(detaching);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("LanguageChoices", slots, []);

    	let { languagesChosen } = $$props,
    		{ srcLang } = $$props,
    		{ srcLangHandler } = $$props,
    		{ targLang } = $$props,
    		{ targLangHandler } = $$props;

    	const languages = {
    		"English": "🇬🇧",
    		"German": "🇩🇪",
    		"Spanish": "🇪🇸",
    		"French": "🇫🇷",
    		"Italian": "🇮🇹",
    		"Polish": "🇵🇱",
    		"Russian": "🇷🇺"
    	};

    	const writable_props = ["languagesChosen", "srcLang", "srcLangHandler", "targLang", "targLangHandler"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<LanguageChoices> was created with unknown prop '${key}'`);
    	});

    	const click_handler = (language, emoji) => srcLangHandler(language, emoji);
    	const click_handler_1 = (language, emoji) => targLangHandler(language, emoji);

    	const click_handler_2 = () => {
    		if (srcLang && targLang) $$invalidate(0, languagesChosen = true);
    		if (srcLang === targLang) $$invalidate(0, languagesChosen = false);
    	};

    	$$self.$$set = $$props => {
    		if ("languagesChosen" in $$props) $$invalidate(0, languagesChosen = $$props.languagesChosen);
    		if ("srcLang" in $$props) $$invalidate(1, srcLang = $$props.srcLang);
    		if ("srcLangHandler" in $$props) $$invalidate(2, srcLangHandler = $$props.srcLangHandler);
    		if ("targLang" in $$props) $$invalidate(3, targLang = $$props.targLang);
    		if ("targLangHandler" in $$props) $$invalidate(4, targLangHandler = $$props.targLangHandler);
    	};

    	$$self.$capture_state = () => ({
    		fly,
    		languagesChosen,
    		srcLang,
    		srcLangHandler,
    		targLang,
    		targLangHandler,
    		languages
    	});

    	$$self.$inject_state = $$props => {
    		if ("languagesChosen" in $$props) $$invalidate(0, languagesChosen = $$props.languagesChosen);
    		if ("srcLang" in $$props) $$invalidate(1, srcLang = $$props.srcLang);
    		if ("srcLangHandler" in $$props) $$invalidate(2, srcLangHandler = $$props.srcLangHandler);
    		if ("targLang" in $$props) $$invalidate(3, targLang = $$props.targLang);
    		if ("targLangHandler" in $$props) $$invalidate(4, targLangHandler = $$props.targLangHandler);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		languagesChosen,
    		srcLang,
    		srcLangHandler,
    		targLang,
    		targLangHandler,
    		languages,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class LanguageChoices extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
    			languagesChosen: 0,
    			srcLang: 1,
    			srcLangHandler: 2,
    			targLang: 3,
    			targLangHandler: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LanguageChoices",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*languagesChosen*/ ctx[0] === undefined && !("languagesChosen" in props)) {
    			console.warn("<LanguageChoices> was created without expected prop 'languagesChosen'");
    		}

    		if (/*srcLang*/ ctx[1] === undefined && !("srcLang" in props)) {
    			console.warn("<LanguageChoices> was created without expected prop 'srcLang'");
    		}

    		if (/*srcLangHandler*/ ctx[2] === undefined && !("srcLangHandler" in props)) {
    			console.warn("<LanguageChoices> was created without expected prop 'srcLangHandler'");
    		}

    		if (/*targLang*/ ctx[3] === undefined && !("targLang" in props)) {
    			console.warn("<LanguageChoices> was created without expected prop 'targLang'");
    		}

    		if (/*targLangHandler*/ ctx[4] === undefined && !("targLangHandler" in props)) {
    			console.warn("<LanguageChoices> was created without expected prop 'targLangHandler'");
    		}
    	}

    	get languagesChosen() {
    		throw new Error("<LanguageChoices>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set languagesChosen(value) {
    		throw new Error("<LanguageChoices>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get srcLang() {
    		throw new Error("<LanguageChoices>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set srcLang(value) {
    		throw new Error("<LanguageChoices>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get srcLangHandler() {
    		throw new Error("<LanguageChoices>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set srcLangHandler(value) {
    		throw new Error("<LanguageChoices>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get targLang() {
    		throw new Error("<LanguageChoices>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set targLang(value) {
    		throw new Error("<LanguageChoices>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get targLangHandler() {
    		throw new Error("<LanguageChoices>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set targLangHandler(value) {
    		throw new Error("<LanguageChoices>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Create/IndividualCard.svelte generated by Svelte v3.38.2 */
    const file$8 = "src/Create/IndividualCard.svelte";

    // (21:0) {#if visible}
    function create_if_block$5(ctx) {
    	let div2;
    	let div0;
    	let h1;
    	let t0_value = /*index*/ ctx[0] + 1 + "";
    	let t0;
    	let t1;
    	let p0;
    	let t2;
    	let t3;
    	let t4_value = /*example*/ ctx[1].from + "";
    	let t4;
    	let div0_intro;
    	let t5;
    	let div1;
    	let p1;
    	let t6;
    	let t7;
    	let t8_value = /*example*/ ctx[1].to + "";
    	let t8;
    	let t9;
    	let button;
    	let div1_intro;
    	let div2_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			p0 = element("p");
    			t2 = text(/*srcEmoji*/ ctx[2]);
    			t3 = space();
    			t4 = text(t4_value);
    			t5 = space();
    			div1 = element("div");
    			p1 = element("p");
    			t6 = text(/*targEmoji*/ ctx[3]);
    			t7 = space();
    			t8 = text(t8_value);
    			t9 = space();
    			button = element("button");
    			button.textContent = "✅";
    			attr_dev(h1, "class", "example-number");
    			add_location(h1, file$8, 23, 6, 576);
    			attr_dev(p0, "class", "sentence svelte-2727go");
    			add_location(p0, file$8, 24, 6, 624);
    			attr_dev(div0, "class", "left svelte-2727go");
    			add_location(div0, file$8, 22, 4, 515);
    			attr_dev(p1, "class", "sentence svelte-2727go");
    			add_location(p1, file$8, 27, 6, 749);
    			attr_dev(button, "class", "card-selector svelte-2727go");
    			add_location(button, file$8, 28, 6, 804);
    			attr_dev(div1, "class", "right svelte-2727go");
    			add_location(div1, file$8, 26, 4, 689);
    			attr_dev(div2, "class", "example-card svelte-2727go");
    			add_location(div2, file$8, 21, 2, 468);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h1);
    			append_dev(h1, t0);
    			append_dev(div0, t1);
    			append_dev(div0, p0);
    			append_dev(p0, t2);
    			append_dev(p0, t3);
    			append_dev(p0, t4);
    			append_dev(div2, t5);
    			append_dev(div2, div1);
    			append_dev(div1, p1);
    			append_dev(p1, t6);
    			append_dev(p1, t7);
    			append_dev(p1, t8);
    			append_dev(div1, t9);
    			append_dev(div1, button);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[8], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*index*/ 1) && t0_value !== (t0_value = /*index*/ ctx[0] + 1 + "")) set_data_dev(t0, t0_value);
    			if (!current || dirty & /*srcEmoji*/ 4) set_data_dev(t2, /*srcEmoji*/ ctx[2]);
    			if ((!current || dirty & /*example*/ 2) && t4_value !== (t4_value = /*example*/ ctx[1].from + "")) set_data_dev(t4, t4_value);
    			if (!current || dirty & /*targEmoji*/ 8) set_data_dev(t6, /*targEmoji*/ ctx[3]);
    			if ((!current || dirty & /*example*/ 2) && t8_value !== (t8_value = /*example*/ ctx[1].to + "")) set_data_dev(t8, t8_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			if (!div0_intro) {
    				add_render_callback(() => {
    					div0_intro = create_in_transition(div0, fly, { x: -200, duration: 1000 });
    					div0_intro.start();
    				});
    			}

    			if (!div1_intro) {
    				add_render_callback(() => {
    					div1_intro = create_in_transition(div1, fly, { x: 200, duration: 1000 });
    					div1_intro.start();
    				});
    			}

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fade, {}, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fade, {}, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching && div2_transition) div2_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(21:0) {#if visible}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*visible*/ ctx[4] && create_if_block$5(ctx);

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
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*visible*/ ctx[4]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*visible*/ 16) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$5(ctx);
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
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("IndividualCard", slots, []);

    	let { index } = $$props,
    		{ example } = $$props,
    		{ srcEmoji } = $$props,
    		{ srcLang } = $$props,
    		{ targEmoji } = $$props,
    		{ targLang } = $$props;

    	let visible = true;

    	const postSentence = async () => {
    		return await fetch("http://localhost:3000/flashcards", {
    			method: "POST",
    			headers: { "Content-Type": "application/json" },
    			body: JSON.stringify({
    				srcLang,
    				targLang,
    				srcSentence: example.from,
    				targSentence: example.to
    			})
    		});
    	};

    	const writable_props = ["index", "example", "srcEmoji", "srcLang", "targEmoji", "targLang"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<IndividualCard> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		$$invalidate(4, visible = false);
    		postSentence();
    	};

    	$$self.$$set = $$props => {
    		if ("index" in $$props) $$invalidate(0, index = $$props.index);
    		if ("example" in $$props) $$invalidate(1, example = $$props.example);
    		if ("srcEmoji" in $$props) $$invalidate(2, srcEmoji = $$props.srcEmoji);
    		if ("srcLang" in $$props) $$invalidate(6, srcLang = $$props.srcLang);
    		if ("targEmoji" in $$props) $$invalidate(3, targEmoji = $$props.targEmoji);
    		if ("targLang" in $$props) $$invalidate(7, targLang = $$props.targLang);
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		fly,
    		index,
    		example,
    		srcEmoji,
    		srcLang,
    		targEmoji,
    		targLang,
    		visible,
    		postSentence
    	});

    	$$self.$inject_state = $$props => {
    		if ("index" in $$props) $$invalidate(0, index = $$props.index);
    		if ("example" in $$props) $$invalidate(1, example = $$props.example);
    		if ("srcEmoji" in $$props) $$invalidate(2, srcEmoji = $$props.srcEmoji);
    		if ("srcLang" in $$props) $$invalidate(6, srcLang = $$props.srcLang);
    		if ("targEmoji" in $$props) $$invalidate(3, targEmoji = $$props.targEmoji);
    		if ("targLang" in $$props) $$invalidate(7, targLang = $$props.targLang);
    		if ("visible" in $$props) $$invalidate(4, visible = $$props.visible);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		index,
    		example,
    		srcEmoji,
    		targEmoji,
    		visible,
    		postSentence,
    		srcLang,
    		targLang,
    		click_handler
    	];
    }

    class IndividualCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			index: 0,
    			example: 1,
    			srcEmoji: 2,
    			srcLang: 6,
    			targEmoji: 3,
    			targLang: 7
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "IndividualCard",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*index*/ ctx[0] === undefined && !("index" in props)) {
    			console.warn("<IndividualCard> was created without expected prop 'index'");
    		}

    		if (/*example*/ ctx[1] === undefined && !("example" in props)) {
    			console.warn("<IndividualCard> was created without expected prop 'example'");
    		}

    		if (/*srcEmoji*/ ctx[2] === undefined && !("srcEmoji" in props)) {
    			console.warn("<IndividualCard> was created without expected prop 'srcEmoji'");
    		}

    		if (/*srcLang*/ ctx[6] === undefined && !("srcLang" in props)) {
    			console.warn("<IndividualCard> was created without expected prop 'srcLang'");
    		}

    		if (/*targEmoji*/ ctx[3] === undefined && !("targEmoji" in props)) {
    			console.warn("<IndividualCard> was created without expected prop 'targEmoji'");
    		}

    		if (/*targLang*/ ctx[7] === undefined && !("targLang" in props)) {
    			console.warn("<IndividualCard> was created without expected prop 'targLang'");
    		}
    	}

    	get index() {
    		throw new Error("<IndividualCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<IndividualCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get example() {
    		throw new Error("<IndividualCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set example(value) {
    		throw new Error("<IndividualCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get srcEmoji() {
    		throw new Error("<IndividualCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set srcEmoji(value) {
    		throw new Error("<IndividualCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get srcLang() {
    		throw new Error("<IndividualCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set srcLang(value) {
    		throw new Error("<IndividualCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get targEmoji() {
    		throw new Error("<IndividualCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set targEmoji(value) {
    		throw new Error("<IndividualCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get targLang() {
    		throw new Error("<IndividualCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set targLang(value) {
    		throw new Error("<IndividualCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Create/ContextCards.svelte generated by Svelte v3.38.2 */
    const file$7 = "src/Create/ContextCards.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	child_ctx[12] = i;
    	return child_ctx;
    }

    // (39:2) {#if searched}
    function create_if_block$4(ctx) {
    	let await_block_anchor;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block$2,
    		then: create_then_block$2,
    		catch: create_catch_block$2,
    		value: 9,
    		error: 13,
    		blocks: [,,,]
    	};

    	handle_promise(/*fetchSentences*/ ctx[7](), info);

    	const block = {
    		c: function create() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			update_await_block_branch(info, ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(39:2) {#if searched}",
    		ctx
    	});

    	return block;
    }

    // (46:3) {:catch error}
    function create_catch_block$2(ctx) {
    	let p;
    	let t0;
    	let t1_value = /*error*/ ctx[13] + "";
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("An error occurred! ");
    			t1 = text(t1_value);
    			add_location(p, file$7, 46, 4, 1257);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$2.name,
    		type: "catch",
    		source: "(46:3) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (42:3) {:then data}
    function create_then_block$2(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = /*data*/ ctx[9].examples.slice(0, 5);
    	validate_each_argument(each_value);
    	const get_key = ctx => /*i*/ ctx[12];
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*fetchSentences, srcEmoji, srcLang, targEmoji, targLang*/ 143) {
    				each_value = /*data*/ ctx[9].examples.slice(0, 5);
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block$1, each_1_anchor, get_each_context$1);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$2.name,
    		type: "then",
    		source: "(42:3) {:then data}",
    		ctx
    	});

    	return block;
    }

    // (43:4) {#each data.examples.slice(0, 5) as example, i (i)}
    function create_each_block$1(key_1, ctx) {
    	let first;
    	let individualcard;
    	let current;

    	individualcard = new IndividualCard({
    			props: {
    				index: /*i*/ ctx[12],
    				example: /*example*/ ctx[10],
    				srcEmoji: /*srcEmoji*/ ctx[2],
    				srcLang: /*srcLang*/ ctx[0],
    				targEmoji: /*targEmoji*/ ctx[3],
    				targLang: /*targLang*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(individualcard.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(individualcard, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const individualcard_changes = {};
    			if (dirty & /*srcEmoji*/ 4) individualcard_changes.srcEmoji = /*srcEmoji*/ ctx[2];
    			if (dirty & /*srcLang*/ 1) individualcard_changes.srcLang = /*srcLang*/ ctx[0];
    			if (dirty & /*targEmoji*/ 8) individualcard_changes.targEmoji = /*targEmoji*/ ctx[3];
    			if (dirty & /*targLang*/ 2) individualcard_changes.targLang = /*targLang*/ ctx[1];
    			individualcard.$set(individualcard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(individualcard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(individualcard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(individualcard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(43:4) {#each data.examples.slice(0, 5) as example, i (i)}",
    		ctx
    	});

    	return block;
    }

    // (40:28)      <p>Getting sentence..</p>    {:then data}
    function create_pending_block$2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Getting sentence..";
    			add_location(p, file$7, 40, 4, 1038);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$2.name,
    		type: "pending",
    		source: "(40:28)      <p>Getting sentence..</p>    {:then data}",
    		ctx
    	});

    	return block;
    }

    // (38:1) {#key newSearch}
    function create_key_block$1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*searched*/ ctx[5] && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*searched*/ ctx[5]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*searched*/ 32) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$4(ctx);
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
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block$1.name,
    		type: "key",
    		source: "(38:1) {#key newSearch}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let main;
    	let h20;
    	let t0;
    	let t1;
    	let t2;
    	let h20_transition;
    	let t3;
    	let h21;
    	let t4;
    	let t5;
    	let t6;
    	let h21_transition;
    	let t7;
    	let h3;
    	let h3_transition;
    	let t9;
    	let input;
    	let t10;
    	let button;
    	let t12;
    	let previous_key = /*newSearch*/ ctx[6];
    	let current;
    	let mounted;
    	let dispose;
    	let key_block = create_key_block$1(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			h20 = element("h2");
    			t0 = text("1. Search for a ");
    			t1 = text(/*srcEmoji*/ ctx[2]);
    			t2 = text(" word, phrase or sentence");
    			t3 = space();
    			h21 = element("h2");
    			t4 = text("2. See ");
    			t5 = text(/*targEmoji*/ ctx[3]);
    			t6 = text(" translations!");
    			t7 = space();
    			h3 = element("h3");
    			h3.textContent = "Click the ✅ next to any sentence pair to create a flashcard!";
    			t9 = space();
    			input = element("input");
    			t10 = space();
    			button = element("button");
    			button.textContent = "Submit";
    			t12 = space();
    			key_block.c();
    			attr_dev(h20, "class", "svelte-cbti99");
    			add_location(h20, file$7, 30, 1, 641);
    			attr_dev(h21, "class", "svelte-cbti99");
    			add_location(h21, file$7, 31, 1, 719);
    			add_location(h3, file$7, 32, 1, 778);
    			add_location(input, file$7, 33, 1, 865);
    			attr_dev(button, "type", "button");
    			add_location(button, file$7, 34, 1, 900);
    			attr_dev(main, "class", "svelte-cbti99");
    			add_location(main, file$7, 29, 0, 633);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h20);
    			append_dev(h20, t0);
    			append_dev(h20, t1);
    			append_dev(h20, t2);
    			append_dev(main, t3);
    			append_dev(main, h21);
    			append_dev(h21, t4);
    			append_dev(h21, t5);
    			append_dev(h21, t6);
    			append_dev(main, t7);
    			append_dev(main, h3);
    			append_dev(main, t9);
    			append_dev(main, input);
    			set_input_value(input, /*phraseQuery*/ ctx[4]);
    			append_dev(main, t10);
    			append_dev(main, button);
    			append_dev(main, t12);
    			key_block.m(main, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[8]),
    					listen_dev(button, "click", /*fetchSentences*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*srcEmoji*/ 4) set_data_dev(t1, /*srcEmoji*/ ctx[2]);
    			if (!current || dirty & /*targEmoji*/ 8) set_data_dev(t5, /*targEmoji*/ ctx[3]);

    			if (dirty & /*phraseQuery*/ 16 && input.value !== /*phraseQuery*/ ctx[4]) {
    				set_input_value(input, /*phraseQuery*/ ctx[4]);
    			}

    			if (dirty & /*newSearch*/ 64 && safe_not_equal(previous_key, previous_key = /*newSearch*/ ctx[6])) {
    				group_outros();
    				transition_out(key_block, 1, 1, noop);
    				check_outros();
    				key_block = create_key_block$1(ctx);
    				key_block.c();
    				transition_in(key_block);
    				key_block.m(main, null);
    			} else {
    				key_block.p(ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h20_transition) h20_transition = create_bidirectional_transition(h20, fade, {}, true);
    				h20_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!h21_transition) h21_transition = create_bidirectional_transition(h21, fade, {}, true);
    				h21_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!h3_transition) h3_transition = create_bidirectional_transition(h3, fade, {}, true);
    				h3_transition.run(1);
    			});

    			transition_in(key_block);
    			current = true;
    		},
    		o: function outro(local) {
    			if (!h20_transition) h20_transition = create_bidirectional_transition(h20, fade, {}, false);
    			h20_transition.run(0);
    			if (!h21_transition) h21_transition = create_bidirectional_transition(h21, fade, {}, false);
    			h21_transition.run(0);
    			if (!h3_transition) h3_transition = create_bidirectional_transition(h3, fade, {}, false);
    			h3_transition.run(0);
    			transition_out(key_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (detaching && h20_transition) h20_transition.end();
    			if (detaching && h21_transition) h21_transition.end();
    			if (detaching && h3_transition) h3_transition.end();
    			key_block.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ContextCards", slots, []);
    	let { srcLang } = $$props;
    	let { targLang } = $$props;
    	let { srcEmoji } = $$props;
    	let { targEmoji } = $$props;
    	let phraseQuery = "";
    	let searched = false;
    	let newSearch = "";

    	const fetchSentences = async () => {
    		$$invalidate(5, searched = true);
    		$$invalidate(6, newSearch = phraseQuery);

    		const response = await fetch("http://localhost:3000/scrape", {
    			method: "POST",
    			headers: { "Content-Type": "application/json" },
    			body: JSON.stringify({ srcLang, targLang, phraseQuery })
    		});

    		$$invalidate(4, phraseQuery = "");
    		return response.json();
    	};

    	const writable_props = ["srcLang", "targLang", "srcEmoji", "targEmoji"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ContextCards> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		phraseQuery = this.value;
    		$$invalidate(4, phraseQuery);
    	}

    	$$self.$$set = $$props => {
    		if ("srcLang" in $$props) $$invalidate(0, srcLang = $$props.srcLang);
    		if ("targLang" in $$props) $$invalidate(1, targLang = $$props.targLang);
    		if ("srcEmoji" in $$props) $$invalidate(2, srcEmoji = $$props.srcEmoji);
    		if ("targEmoji" in $$props) $$invalidate(3, targEmoji = $$props.targEmoji);
    	};

    	$$self.$capture_state = () => ({
    		IndividualCard,
    		fly,
    		fade,
    		srcLang,
    		targLang,
    		srcEmoji,
    		targEmoji,
    		phraseQuery,
    		searched,
    		newSearch,
    		fetchSentences
    	});

    	$$self.$inject_state = $$props => {
    		if ("srcLang" in $$props) $$invalidate(0, srcLang = $$props.srcLang);
    		if ("targLang" in $$props) $$invalidate(1, targLang = $$props.targLang);
    		if ("srcEmoji" in $$props) $$invalidate(2, srcEmoji = $$props.srcEmoji);
    		if ("targEmoji" in $$props) $$invalidate(3, targEmoji = $$props.targEmoji);
    		if ("phraseQuery" in $$props) $$invalidate(4, phraseQuery = $$props.phraseQuery);
    		if ("searched" in $$props) $$invalidate(5, searched = $$props.searched);
    		if ("newSearch" in $$props) $$invalidate(6, newSearch = $$props.newSearch);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		srcLang,
    		targLang,
    		srcEmoji,
    		targEmoji,
    		phraseQuery,
    		searched,
    		newSearch,
    		fetchSentences,
    		input_input_handler
    	];
    }

    class ContextCards extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			srcLang: 0,
    			targLang: 1,
    			srcEmoji: 2,
    			targEmoji: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ContextCards",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*srcLang*/ ctx[0] === undefined && !("srcLang" in props)) {
    			console.warn("<ContextCards> was created without expected prop 'srcLang'");
    		}

    		if (/*targLang*/ ctx[1] === undefined && !("targLang" in props)) {
    			console.warn("<ContextCards> was created without expected prop 'targLang'");
    		}

    		if (/*srcEmoji*/ ctx[2] === undefined && !("srcEmoji" in props)) {
    			console.warn("<ContextCards> was created without expected prop 'srcEmoji'");
    		}

    		if (/*targEmoji*/ ctx[3] === undefined && !("targEmoji" in props)) {
    			console.warn("<ContextCards> was created without expected prop 'targEmoji'");
    		}
    	}

    	get srcLang() {
    		throw new Error("<ContextCards>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set srcLang(value) {
    		throw new Error("<ContextCards>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get targLang() {
    		throw new Error("<ContextCards>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set targLang(value) {
    		throw new Error("<ContextCards>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get srcEmoji() {
    		throw new Error("<ContextCards>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set srcEmoji(value) {
    		throw new Error("<ContextCards>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get targEmoji() {
    		throw new Error("<ContextCards>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set targEmoji(value) {
    		throw new Error("<ContextCards>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Create/CreateDashboard.svelte generated by Svelte v3.38.2 */
    const file$6 = "src/Create/CreateDashboard.svelte";

    // (23:2) {#if !languagesChosen || !srcLang || !targLang}
    function create_if_block_1$2(ctx) {
    	let languagechoices;
    	let updating_languagesChosen;
    	let updating_srcLang;
    	let updating_targLang;
    	let current;

    	function languagechoices_languagesChosen_binding(value) {
    		/*languagechoices_languagesChosen_binding*/ ctx[7](value);
    	}

    	function languagechoices_srcLang_binding(value) {
    		/*languagechoices_srcLang_binding*/ ctx[8](value);
    	}

    	function languagechoices_targLang_binding(value) {
    		/*languagechoices_targLang_binding*/ ctx[9](value);
    	}

    	let languagechoices_props = {
    		srcLangHandler: /*srcLangHandler*/ ctx[5],
    		targLangHandler: /*targLangHandler*/ ctx[6]
    	};

    	if (/*languagesChosen*/ ctx[0] !== void 0) {
    		languagechoices_props.languagesChosen = /*languagesChosen*/ ctx[0];
    	}

    	if (/*srcLang*/ ctx[1] !== void 0) {
    		languagechoices_props.srcLang = /*srcLang*/ ctx[1];
    	}

    	if (/*targLang*/ ctx[3] !== void 0) {
    		languagechoices_props.targLang = /*targLang*/ ctx[3];
    	}

    	languagechoices = new LanguageChoices({
    			props: languagechoices_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(languagechoices, "languagesChosen", languagechoices_languagesChosen_binding));
    	binding_callbacks.push(() => bind(languagechoices, "srcLang", languagechoices_srcLang_binding));
    	binding_callbacks.push(() => bind(languagechoices, "targLang", languagechoices_targLang_binding));

    	const block = {
    		c: function create() {
    			create_component(languagechoices.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(languagechoices, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const languagechoices_changes = {};

    			if (!updating_languagesChosen && dirty & /*languagesChosen*/ 1) {
    				updating_languagesChosen = true;
    				languagechoices_changes.languagesChosen = /*languagesChosen*/ ctx[0];
    				add_flush_callback(() => updating_languagesChosen = false);
    			}

    			if (!updating_srcLang && dirty & /*srcLang*/ 2) {
    				updating_srcLang = true;
    				languagechoices_changes.srcLang = /*srcLang*/ ctx[1];
    				add_flush_callback(() => updating_srcLang = false);
    			}

    			if (!updating_targLang && dirty & /*targLang*/ 8) {
    				updating_targLang = true;
    				languagechoices_changes.targLang = /*targLang*/ ctx[3];
    				add_flush_callback(() => updating_targLang = false);
    			}

    			languagechoices.$set(languagechoices_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(languagechoices.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(languagechoices.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(languagechoices, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(23:2) {#if !languagesChosen || !srcLang || !targLang}",
    		ctx
    	});

    	return block;
    }

    // (27:2) {#if languagesChosen && srcLang && targLang}
    function create_if_block$3(ctx) {
    	let contextcards;
    	let t0;
    	let button;
    	let current;
    	let mounted;
    	let dispose;

    	contextcards = new ContextCards({
    			props: {
    				srcLang: /*srcLang*/ ctx[1],
    				srcEmoji: /*srcEmoji*/ ctx[2],
    				targLang: /*targLang*/ ctx[3],
    				targEmoji: /*targEmoji*/ ctx[4]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(contextcards.$$.fragment);
    			t0 = space();
    			button = element("button");
    			button.textContent = "Go back!";
    			add_location(button, file$6, 28, 4, 773);
    		},
    		m: function mount(target, anchor) {
    			mount_component(contextcards, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, button, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[10], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const contextcards_changes = {};
    			if (dirty & /*srcLang*/ 2) contextcards_changes.srcLang = /*srcLang*/ ctx[1];
    			if (dirty & /*srcEmoji*/ 4) contextcards_changes.srcEmoji = /*srcEmoji*/ ctx[2];
    			if (dirty & /*targLang*/ 8) contextcards_changes.targLang = /*targLang*/ ctx[3];
    			if (dirty & /*targEmoji*/ 16) contextcards_changes.targEmoji = /*targEmoji*/ ctx[4];
    			contextcards.$set(contextcards_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(contextcards.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(contextcards.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(contextcards, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(27:2) {#if languagesChosen && srcLang && targLang}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let main;
    	let t;
    	let current;
    	let if_block0 = (!/*languagesChosen*/ ctx[0] || !/*srcLang*/ ctx[1] || !/*targLang*/ ctx[3]) && create_if_block_1$2(ctx);
    	let if_block1 = /*languagesChosen*/ ctx[0] && /*srcLang*/ ctx[1] && /*targLang*/ ctx[3] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(main, "class", "svelte-1nmr3zb");
    			add_location(main, file$6, 21, 0, 449);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t);
    			if (if_block1) if_block1.m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*languagesChosen*/ ctx[0] || !/*srcLang*/ ctx[1] || !/*targLang*/ ctx[3]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*languagesChosen, srcLang, targLang*/ 11) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1$2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(main, t);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*languagesChosen*/ ctx[0] && /*srcLang*/ ctx[1] && /*targLang*/ ctx[3]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*languagesChosen, srcLang, targLang*/ 11) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$3(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(main, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("CreateDashboard", slots, []);
    	let languagesChosen = false;
    	let srcLang = "";
    	let srcEmoji = "";

    	const srcLangHandler = (language, emoji) => {
    		$$invalidate(1, srcLang = language);
    		$$invalidate(2, srcEmoji = emoji);
    	};

    	let targLang = "";
    	let targEmoji = "";

    	const targLangHandler = (language, emoji) => {
    		$$invalidate(3, targLang = language);
    		$$invalidate(4, targEmoji = emoji);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CreateDashboard> was created with unknown prop '${key}'`);
    	});

    	function languagechoices_languagesChosen_binding(value) {
    		languagesChosen = value;
    		$$invalidate(0, languagesChosen);
    	}

    	function languagechoices_srcLang_binding(value) {
    		srcLang = value;
    		$$invalidate(1, srcLang);
    	}

    	function languagechoices_targLang_binding(value) {
    		targLang = value;
    		$$invalidate(3, targLang);
    	}

    	const click_handler = () => {
    		$$invalidate(0, languagesChosen = !languagesChosen);
    		$$invalidate(1, srcLang = !srcLang);
    		$$invalidate(3, targLang = !targLang);
    	};

    	$$self.$capture_state = () => ({
    		LanguageChoices,
    		ContextCards,
    		languagesChosen,
    		srcLang,
    		srcEmoji,
    		srcLangHandler,
    		targLang,
    		targEmoji,
    		targLangHandler
    	});

    	$$self.$inject_state = $$props => {
    		if ("languagesChosen" in $$props) $$invalidate(0, languagesChosen = $$props.languagesChosen);
    		if ("srcLang" in $$props) $$invalidate(1, srcLang = $$props.srcLang);
    		if ("srcEmoji" in $$props) $$invalidate(2, srcEmoji = $$props.srcEmoji);
    		if ("targLang" in $$props) $$invalidate(3, targLang = $$props.targLang);
    		if ("targEmoji" in $$props) $$invalidate(4, targEmoji = $$props.targEmoji);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		languagesChosen,
    		srcLang,
    		srcEmoji,
    		targLang,
    		targEmoji,
    		srcLangHandler,
    		targLangHandler,
    		languagechoices_languagesChosen_binding,
    		languagechoices_srcLang_binding,
    		languagechoices_targLang_binding,
    		click_handler
    	];
    }

    class CreateDashboard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CreateDashboard",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/Review/Flashcard.svelte generated by Svelte v3.38.2 */

    const file$5 = "src/Review/Flashcard.svelte";

    // (24:4) {:else}
    function create_else_block(ctx) {
    	let div;
    	let h1;
    	let t0_value = /*languages*/ ctx[5][/*data*/ ctx[2][/*cardIndex*/ ctx[1]].targLang] + "";
    	let t0;
    	let t1;
    	let h2;
    	let t2_value = /*data*/ ctx[2][/*cardIndex*/ ctx[1]].targSentence + "";
    	let t2;
    	let div_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			h2 = element("h2");
    			t2 = text(t2_value);
    			attr_dev(h1, "class", "lang svelte-106v0tk");
    			add_location(h1, file$5, 25, 6, 770);
    			attr_dev(h2, "class", "sentence svelte-106v0tk");
    			add_location(h2, file$5, 26, 6, 836);
    			attr_dev(div, "class", "side back svelte-106v0tk");
    			add_location(div, file$5, 24, 4, 724);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(h1, t0);
    			append_dev(div, t1);
    			append_dev(div, h2);
    			append_dev(h2, t2);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*data, cardIndex*/ 6) && t0_value !== (t0_value = /*languages*/ ctx[5][/*data*/ ctx[2][/*cardIndex*/ ctx[1]].targLang] + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty & /*data, cardIndex*/ 6) && t2_value !== (t2_value = /*data*/ ctx[2][/*cardIndex*/ ctx[1]].targSentence + "")) set_data_dev(t2, t2_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, /*flip*/ ctx[4], {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, /*flip*/ ctx[4], {}, false);
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
    		id: create_else_block.name,
    		type: "else",
    		source: "(24:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (19:4) {#if frontSide}
    function create_if_block$2(ctx) {
    	let div;
    	let h1;
    	let t0_value = /*languages*/ ctx[5][/*data*/ ctx[2][/*cardIndex*/ ctx[1]].srcLang] + "";
    	let t0;
    	let t1;
    	let h2;
    	let t2_value = /*data*/ ctx[2][/*cardIndex*/ ctx[1]].srcSentence + "";
    	let t2;
    	let div_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			h2 = element("h2");
    			t2 = text(t2_value);
    			attr_dev(h1, "class", "lang svelte-106v0tk");
    			add_location(h1, file$5, 20, 6, 576);
    			attr_dev(h2, "class", "sentence svelte-106v0tk");
    			add_location(h2, file$5, 21, 6, 641);
    			attr_dev(div, "class", "side svelte-106v0tk");
    			add_location(div, file$5, 19, 4, 535);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(h1, t0);
    			append_dev(div, t1);
    			append_dev(div, h2);
    			append_dev(h2, t2);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*data, cardIndex*/ 6) && t0_value !== (t0_value = /*languages*/ ctx[5][/*data*/ ctx[2][/*cardIndex*/ ctx[1]].srcLang] + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty & /*data, cardIndex*/ 6) && t2_value !== (t2_value = /*data*/ ctx[2][/*cardIndex*/ ctx[1]].srcSentence + "")) set_data_dev(t2, t2_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, /*flip*/ ctx[4], {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, /*flip*/ ctx[4], {}, false);
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
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(19:4) {#if frontSide}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block$2, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*frontSide*/ ctx[3]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "flashcard svelte-106v0tk");
    			add_location(div, file$5, 14, 2, 417);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
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
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
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
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Flashcard", slots, []);
    	let { cardIndex } = $$props, { data } = $$props, { flipped } = $$props;
    	let frontSide = true;

    	const flip = ({ delay = 0, duration = 500 }) => {
    		return {
    			delay,
    			duration,
    			css: u => `transform: rotateY(${1 - u * 180}deg);
      opacity: ${1 - u};`
    		};
    	};

    	const languages = {
    		"English": "🇬🇧",
    		"German": "🇩🇪",
    		"Spanish": "🇪🇸",
    		"French": "🇫🇷",
    		"Italian": "🇮🇹",
    		"Polish": "🇵🇱",
    		"Russian": "🇷🇺"
    	};

    	const writable_props = ["cardIndex", "data", "flipped"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Flashcard> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		$$invalidate(3, frontSide = !frontSide);
    		$$invalidate(0, flipped = true);
    	};

    	$$self.$$set = $$props => {
    		if ("cardIndex" in $$props) $$invalidate(1, cardIndex = $$props.cardIndex);
    		if ("data" in $$props) $$invalidate(2, data = $$props.data);
    		if ("flipped" in $$props) $$invalidate(0, flipped = $$props.flipped);
    	};

    	$$self.$capture_state = () => ({
    		cardIndex,
    		data,
    		flipped,
    		frontSide,
    		flip,
    		languages
    	});

    	$$self.$inject_state = $$props => {
    		if ("cardIndex" in $$props) $$invalidate(1, cardIndex = $$props.cardIndex);
    		if ("data" in $$props) $$invalidate(2, data = $$props.data);
    		if ("flipped" in $$props) $$invalidate(0, flipped = $$props.flipped);
    		if ("frontSide" in $$props) $$invalidate(3, frontSide = $$props.frontSide);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [flipped, cardIndex, data, frontSide, flip, languages, click_handler];
    }

    class Flashcard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { cardIndex: 1, data: 2, flipped: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Flashcard",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*cardIndex*/ ctx[1] === undefined && !("cardIndex" in props)) {
    			console.warn("<Flashcard> was created without expected prop 'cardIndex'");
    		}

    		if (/*data*/ ctx[2] === undefined && !("data" in props)) {
    			console.warn("<Flashcard> was created without expected prop 'data'");
    		}

    		if (/*flipped*/ ctx[0] === undefined && !("flipped" in props)) {
    			console.warn("<Flashcard> was created without expected prop 'flipped'");
    		}
    	}

    	get cardIndex() {
    		throw new Error("<Flashcard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cardIndex(value) {
    		throw new Error("<Flashcard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<Flashcard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Flashcard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get flipped() {
    		throw new Error("<Flashcard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set flipped(value) {
    		throw new Error("<Flashcard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Review/FlashcardTable.svelte generated by Svelte v3.38.2 */
    const file$4 = "src/Review/FlashcardTable.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (26:4) {#each flashcardData as sentence}
    function create_each_block(ctx) {
    	let tbody;
    	let tr;
    	let td0;
    	let t0_value = /*sentence*/ ctx[5].srcLang + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*sentence*/ ctx[5].srcSentence + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*sentence*/ ctx[5].targLang + "";
    	let t4;
    	let t5;
    	let td3;
    	let t6_value = /*sentence*/ ctx[5].targSentence + "";
    	let t6;
    	let t7;
    	let td4;
    	let t8_value = /*sentence*/ ctx[5].overallScore + "";
    	let t8;
    	let t9;
    	let td5;
    	let button;
    	let tr_transition;
    	let t11;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[4](/*sentence*/ ctx[5]);
    	}

    	const block = {
    		c: function create() {
    			tbody = element("tbody");
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			td4 = element("td");
    			t8 = text(t8_value);
    			t9 = space();
    			td5 = element("td");
    			button = element("button");
    			button.textContent = "❌";
    			t11 = space();
    			add_location(td0, file$4, 28, 8, 638);
    			add_location(td1, file$4, 29, 8, 674);
    			add_location(td2, file$4, 30, 8, 714);
    			add_location(td3, file$4, 31, 8, 751);
    			add_location(td4, file$4, 32, 8, 792);
    			attr_dev(button, "class", "delete-button svelte-fbbn1w");
    			add_location(button, file$4, 33, 12, 837);
    			add_location(td5, file$4, 33, 8, 833);
    			attr_dev(tr, "class", "svelte-fbbn1w");
    			add_location(tr, file$4, 27, 6, 609);
    			add_location(tbody, file$4, 26, 4, 595);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tbody, anchor);
    			append_dev(tbody, tr);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, t6);
    			append_dev(tr, t7);
    			append_dev(tr, td4);
    			append_dev(td4, t8);
    			append_dev(tr, t9);
    			append_dev(tr, td5);
    			append_dev(td5, button);
    			append_dev(tbody, t11);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*flashcardData*/ 1) && t0_value !== (t0_value = /*sentence*/ ctx[5].srcLang + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty & /*flashcardData*/ 1) && t2_value !== (t2_value = /*sentence*/ ctx[5].srcSentence + "")) set_data_dev(t2, t2_value);
    			if ((!current || dirty & /*flashcardData*/ 1) && t4_value !== (t4_value = /*sentence*/ ctx[5].targLang + "")) set_data_dev(t4, t4_value);
    			if ((!current || dirty & /*flashcardData*/ 1) && t6_value !== (t6_value = /*sentence*/ ctx[5].targSentence + "")) set_data_dev(t6, t6_value);
    			if ((!current || dirty & /*flashcardData*/ 1) && t8_value !== (t8_value = /*sentence*/ ctx[5].overallScore + "")) set_data_dev(t8, t8_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!tr_transition) tr_transition = create_bidirectional_transition(tr, fade, {}, true);
    				tr_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!tr_transition) tr_transition = create_bidirectional_transition(tr, fade, {}, false);
    			tr_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tbody);
    			if (detaching && tr_transition) tr_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(26:4) {#each flashcardData as sentence}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let t0;
    	let input;
    	let t1;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t3;
    	let th1;
    	let t5;
    	let th2;
    	let t7;
    	let th3;
    	let t9;
    	let th4;
    	let t11;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*flashcardData*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("Filter: ");
    			input = element("input");
    			t1 = space();
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "srcLang";
    			t3 = space();
    			th1 = element("th");
    			th1.textContent = "srcSentence";
    			t5 = space();
    			th2 = element("th");
    			th2.textContent = "targLang";
    			t7 = space();
    			th3 = element("th");
    			th3.textContent = "targSentence";
    			t9 = space();
    			th4 = element("th");
    			th4.textContent = "overallScore";
    			t11 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(input, file$4, 13, 10, 293);
    			add_location(th0, file$4, 17, 8, 368);
    			add_location(th1, file$4, 18, 8, 393);
    			add_location(th2, file$4, 19, 8, 422);
    			add_location(th3, file$4, 20, 8, 448);
    			add_location(th4, file$4, 21, 8, 478);
    			attr_dev(tr, "class", "svelte-fbbn1w");
    			add_location(tr, file$4, 16, 6, 355);
    			add_location(thead, file$4, 15, 4, 341);
    			attr_dev(table, "class", "svelte-fbbn1w");
    			add_location(table, file$4, 14, 2, 329);
    			attr_dev(div, "class", "database-table svelte-fbbn1w");
    			add_location(div, file$4, 12, 0, 254);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, input);
    			set_input_value(input, /*searchTerm*/ ctx[1]);
    			append_dev(div, t1);
    			append_dev(div, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t3);
    			append_dev(tr, th1);
    			append_dev(tr, t5);
    			append_dev(tr, th2);
    			append_dev(tr, t7);
    			append_dev(tr, th3);
    			append_dev(tr, t9);
    			append_dev(tr, th4);
    			append_dev(table, t11);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[3]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*searchTerm*/ 2 && input.value !== /*searchTerm*/ ctx[1]) {
    				set_input_value(input, /*searchTerm*/ ctx[1]);
    			}

    			if (dirty & /*removeFlashcard, flashcardData*/ 5) {
    				each_value = /*flashcardData*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(table, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("FlashcardTable", slots, []);
    	let { flashcardData } = $$props;
    	let searchTerm = "";

    	const removeFlashcard = async id => {
    		await fetch(`http://localhost:3000/flashcards/${id}`, { method: "DELETE" });
    	};

    	const writable_props = ["flashcardData"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FlashcardTable> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		searchTerm = this.value;
    		$$invalidate(1, searchTerm);
    	}

    	const click_handler = sentence => {
    		// visible = false;
    		removeFlashcard(sentence._id);
    	};

    	$$self.$$set = $$props => {
    		if ("flashcardData" in $$props) $$invalidate(0, flashcardData = $$props.flashcardData);
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		flashcardData,
    		searchTerm,
    		removeFlashcard
    	});

    	$$self.$inject_state = $$props => {
    		if ("flashcardData" in $$props) $$invalidate(0, flashcardData = $$props.flashcardData);
    		if ("searchTerm" in $$props) $$invalidate(1, searchTerm = $$props.searchTerm);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [flashcardData, searchTerm, removeFlashcard, input_input_handler, click_handler];
    }

    class FlashcardTable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { flashcardData: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FlashcardTable",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*flashcardData*/ ctx[0] === undefined && !("flashcardData" in props)) {
    			console.warn("<FlashcardTable> was created without expected prop 'flashcardData'");
    		}
    	}

    	get flashcardData() {
    		throw new Error("<FlashcardTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set flashcardData(value) {
    		throw new Error("<FlashcardTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Review/ReactionButtons.svelte generated by Svelte v3.38.2 */

    const file$3 = "src/Review/ReactionButtons.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let button2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			button0.textContent = "😭";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "😐";
    			t3 = space();
    			button2 = element("button");
    			button2.textContent = "😄";
    			add_location(button0, file$3, 15, 2, 377);
    			add_location(button1, file$3, 21, 2, 531);
    			add_location(button2, file$3, 27, 2, 685);
    			attr_dev(div, "class", "flashcard-reaction-buttons svelte-8k09h4");
    			add_location(div, file$3, 14, 0, 334);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(div, t1);
    			append_dev(div, button1);
    			append_dev(div, t3);
    			append_dev(div, button2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[5], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[6], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ReactionButtons", slots, []);

    	let { data } = $$props,
    		{ cardIndex } = $$props,
    		{ frontSide } = $$props,
    		{ flipped } = $$props;

    	const updateFlashcardScore = async (id, value) => {
    		await fetch(`http://localhost:3000/flashcards/${id}`, {
    			method: "PUT",
    			headers: { "Content-Type": "application/json" },
    			body: JSON.stringify({ incValue: value })
    		});
    	};

    	const writable_props = ["data", "cardIndex", "frontSide", "flipped"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ReactionButtons> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		updateFlashcardScore(data[cardIndex]._id, 0);
    		$$invalidate(0, cardIndex++, cardIndex);
    		$$invalidate(1, frontSide = true);
    		$$invalidate(2, flipped = false);
    	};

    	const click_handler_1 = () => {
    		updateFlashcardScore(data[cardIndex]._id, 1);
    		$$invalidate(0, cardIndex++, cardIndex);
    		$$invalidate(1, frontSide = true);
    		$$invalidate(2, flipped = false);
    	};

    	const click_handler_2 = () => {
    		updateFlashcardScore(data[cardIndex]._id, 3);
    		$$invalidate(0, cardIndex++, cardIndex);
    		$$invalidate(1, frontSide = true);
    		$$invalidate(2, flipped = false);
    	};

    	$$self.$$set = $$props => {
    		if ("data" in $$props) $$invalidate(3, data = $$props.data);
    		if ("cardIndex" in $$props) $$invalidate(0, cardIndex = $$props.cardIndex);
    		if ("frontSide" in $$props) $$invalidate(1, frontSide = $$props.frontSide);
    		if ("flipped" in $$props) $$invalidate(2, flipped = $$props.flipped);
    	};

    	$$self.$capture_state = () => ({
    		data,
    		cardIndex,
    		frontSide,
    		flipped,
    		updateFlashcardScore
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(3, data = $$props.data);
    		if ("cardIndex" in $$props) $$invalidate(0, cardIndex = $$props.cardIndex);
    		if ("frontSide" in $$props) $$invalidate(1, frontSide = $$props.frontSide);
    		if ("flipped" in $$props) $$invalidate(2, flipped = $$props.flipped);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		cardIndex,
    		frontSide,
    		flipped,
    		data,
    		updateFlashcardScore,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class ReactionButtons extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			data: 3,
    			cardIndex: 0,
    			frontSide: 1,
    			flipped: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ReactionButtons",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[3] === undefined && !("data" in props)) {
    			console.warn("<ReactionButtons> was created without expected prop 'data'");
    		}

    		if (/*cardIndex*/ ctx[0] === undefined && !("cardIndex" in props)) {
    			console.warn("<ReactionButtons> was created without expected prop 'cardIndex'");
    		}

    		if (/*frontSide*/ ctx[1] === undefined && !("frontSide" in props)) {
    			console.warn("<ReactionButtons> was created without expected prop 'frontSide'");
    		}

    		if (/*flipped*/ ctx[2] === undefined && !("flipped" in props)) {
    			console.warn("<ReactionButtons> was created without expected prop 'flipped'");
    		}
    	}

    	get data() {
    		throw new Error("<ReactionButtons>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<ReactionButtons>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get cardIndex() {
    		throw new Error("<ReactionButtons>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cardIndex(value) {
    		throw new Error("<ReactionButtons>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get frontSide() {
    		throw new Error("<ReactionButtons>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set frontSide(value) {
    		throw new Error("<ReactionButtons>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get flipped() {
    		throw new Error("<ReactionButtons>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set flipped(value) {
    		throw new Error("<ReactionButtons>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Review/PracticeFlashcard.svelte generated by Svelte v3.38.2 */
    const file$2 = "src/Review/PracticeFlashcard.svelte";

    // (32:2) {:catch error}
    function create_catch_block$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Error!";
    			add_location(p, file$2, 32, 2, 1074);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$1.name,
    		type: "catch",
    		source: "(32:2) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (14:2) {:then data}
    function create_then_block$1(ctx) {
    	let t0;
    	let t1;
    	let if_block2_anchor;
    	let current;
    	let if_block0 = !/*data*/ ctx[9].length && create_if_block_4$1(ctx);
    	let if_block1 = /*data*/ ctx[9].length && create_if_block_1$1(ctx);

    	let if_block2 = /*cardIndex*/ ctx[2] === (/*numberOfCards*/ ctx[1] < /*data*/ ctx[9].length
    	? /*numberOfCards*/ ctx[1]
    	: /*data*/ ctx[9].length) && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			if_block2_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, if_block2_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!/*data*/ ctx[9].length) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_4$1(ctx);
    					if_block0.c();
    					if_block0.m(t0.parentNode, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*data*/ ctx[9].length) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*promisedData*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(t1.parentNode, t1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*cardIndex*/ ctx[2] === (/*numberOfCards*/ ctx[1] < /*data*/ ctx[9].length
    			? /*numberOfCards*/ ctx[1]
    			: /*data*/ ctx[9].length)) {
    				if (if_block2) ; else {
    					if_block2 = create_if_block$1(ctx);
    					if_block2.c();
    					if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t1);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(if_block2_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$1.name,
    		type: "then",
    		source: "(14:2) {:then data}",
    		ctx
    	});

    	return block;
    }

    // (15:4) {#if !data.length}
    function create_if_block_4$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "No cards to display! Create some cards fast!";
    			add_location(p, file$2, 15, 6, 379);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(15:4) {#if !data.length}",
    		ctx
    	});

    	return block;
    }

    // (18:4) {#if data.length}
    function create_if_block_1$1(ctx) {
    	let if_block_anchor;
    	let current;

    	let if_block = /*cardIndex*/ ctx[2] < (/*numberOfCards*/ ctx[1] < /*data*/ ctx[9].length
    	? /*numberOfCards*/ ctx[1]
    	: /*data*/ ctx[9].length) && create_if_block_2$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*cardIndex*/ ctx[2] < (/*numberOfCards*/ ctx[1] < /*data*/ ctx[9].length
    			? /*numberOfCards*/ ctx[1]
    			: /*data*/ ctx[9].length)) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*cardIndex, numberOfCards, promisedData*/ 7) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_2$1(ctx);
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
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(18:4) {#if data.length}",
    		ctx
    	});

    	return block;
    }

    // (19:6) {#if cardIndex < (numberOfCards < data.length ? numberOfCards : data.length)}
    function create_if_block_2$1(ctx) {
    	let previous_key = /*cardIndex*/ ctx[2];
    	let t;
    	let if_block_anchor;
    	let current;
    	let key_block = create_key_block(ctx);
    	let if_block = /*flipped*/ ctx[4] && create_if_block_3$1(ctx);

    	const block = {
    		c: function create() {
    			key_block.c();
    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			key_block.m(target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*cardIndex*/ 4 && safe_not_equal(previous_key, previous_key = /*cardIndex*/ ctx[2])) {
    				group_outros();
    				transition_out(key_block, 1, 1, noop);
    				check_outros();
    				key_block = create_key_block(ctx);
    				key_block.c();
    				transition_in(key_block);
    				key_block.m(t.parentNode, t);
    			} else {
    				key_block.p(ctx, dirty);
    			}

    			if (/*flipped*/ ctx[4]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*flipped*/ 16) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_3$1(ctx);
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
    			transition_in(key_block);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(key_block);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			key_block.d(detaching);
    			if (detaching) detach_dev(t);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(19:6) {#if cardIndex < (numberOfCards < data.length ? numberOfCards : data.length)}",
    		ctx
    	});

    	return block;
    }

    // (20:8) {#key cardIndex}
    function create_key_block(ctx) {
    	let h2;
    	let t0;
    	let t1_value = /*cardIndex*/ ctx[2] + 1 + "";
    	let t1;
    	let t2;

    	let t3_value = (/*numberOfCards*/ ctx[1] < /*data*/ ctx[9].length
    	? /*numberOfCards*/ ctx[1]
    	: /*data*/ ctx[9].length) + "";

    	let t3;
    	let t4;
    	let flashcard;
    	let updating_flipped;
    	let current;

    	function flashcard_flipped_binding(value) {
    		/*flashcard_flipped_binding*/ ctx[5](value);
    	}

    	let flashcard_props = {
    		data: /*data*/ ctx[9],
    		cardIndex: /*cardIndex*/ ctx[2]
    	};

    	if (/*flipped*/ ctx[4] !== void 0) {
    		flashcard_props.flipped = /*flipped*/ ctx[4];
    	}

    	flashcard = new Flashcard({ props: flashcard_props, $$inline: true });
    	binding_callbacks.push(() => bind(flashcard, "flipped", flashcard_flipped_binding));

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			t0 = text("Card ");
    			t1 = text(t1_value);
    			t2 = text("/");
    			t3 = text(t3_value);
    			t4 = space();
    			create_component(flashcard.$$.fragment);
    			add_location(h2, file$2, 20, 10, 582);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(h2, t2);
    			append_dev(h2, t3);
    			insert_dev(target, t4, anchor);
    			mount_component(flashcard, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*cardIndex*/ 4) && t1_value !== (t1_value = /*cardIndex*/ ctx[2] + 1 + "")) set_data_dev(t1, t1_value);

    			if ((!current || dirty & /*numberOfCards, promisedData*/ 3) && t3_value !== (t3_value = (/*numberOfCards*/ ctx[1] < /*data*/ ctx[9].length
    			? /*numberOfCards*/ ctx[1]
    			: /*data*/ ctx[9].length) + "")) set_data_dev(t3, t3_value);

    			const flashcard_changes = {};
    			if (dirty & /*promisedData*/ 1) flashcard_changes.data = /*data*/ ctx[9];
    			if (dirty & /*cardIndex*/ 4) flashcard_changes.cardIndex = /*cardIndex*/ ctx[2];

    			if (!updating_flipped && dirty & /*flipped*/ 16) {
    				updating_flipped = true;
    				flashcard_changes.flipped = /*flipped*/ ctx[4];
    				add_flush_callback(() => updating_flipped = false);
    			}

    			flashcard.$set(flashcard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(flashcard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(flashcard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t4);
    			destroy_component(flashcard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block.name,
    		type: "key",
    		source: "(20:8) {#key cardIndex}",
    		ctx
    	});

    	return block;
    }

    // (24:8) {#if flipped}
    function create_if_block_3$1(ctx) {
    	let reactionbuttons;
    	let updating_cardIndex;
    	let updating_frontSide;
    	let updating_flipped;
    	let current;

    	function reactionbuttons_cardIndex_binding(value) {
    		/*reactionbuttons_cardIndex_binding*/ ctx[6](value);
    	}

    	function reactionbuttons_frontSide_binding(value) {
    		/*reactionbuttons_frontSide_binding*/ ctx[7](value);
    	}

    	function reactionbuttons_flipped_binding(value) {
    		/*reactionbuttons_flipped_binding*/ ctx[8](value);
    	}

    	let reactionbuttons_props = { data: /*data*/ ctx[9] };

    	if (/*cardIndex*/ ctx[2] !== void 0) {
    		reactionbuttons_props.cardIndex = /*cardIndex*/ ctx[2];
    	}

    	if (/*frontSide*/ ctx[3] !== void 0) {
    		reactionbuttons_props.frontSide = /*frontSide*/ ctx[3];
    	}

    	if (/*flipped*/ ctx[4] !== void 0) {
    		reactionbuttons_props.flipped = /*flipped*/ ctx[4];
    	}

    	reactionbuttons = new ReactionButtons({
    			props: reactionbuttons_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(reactionbuttons, "cardIndex", reactionbuttons_cardIndex_binding));
    	binding_callbacks.push(() => bind(reactionbuttons, "frontSide", reactionbuttons_frontSide_binding));
    	binding_callbacks.push(() => bind(reactionbuttons, "flipped", reactionbuttons_flipped_binding));

    	const block = {
    		c: function create() {
    			create_component(reactionbuttons.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(reactionbuttons, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const reactionbuttons_changes = {};
    			if (dirty & /*promisedData*/ 1) reactionbuttons_changes.data = /*data*/ ctx[9];

    			if (!updating_cardIndex && dirty & /*cardIndex*/ 4) {
    				updating_cardIndex = true;
    				reactionbuttons_changes.cardIndex = /*cardIndex*/ ctx[2];
    				add_flush_callback(() => updating_cardIndex = false);
    			}

    			if (!updating_frontSide && dirty & /*frontSide*/ 8) {
    				updating_frontSide = true;
    				reactionbuttons_changes.frontSide = /*frontSide*/ ctx[3];
    				add_flush_callback(() => updating_frontSide = false);
    			}

    			if (!updating_flipped && dirty & /*flipped*/ 16) {
    				updating_flipped = true;
    				reactionbuttons_changes.flipped = /*flipped*/ ctx[4];
    				add_flush_callback(() => updating_flipped = false);
    			}

    			reactionbuttons.$set(reactionbuttons_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(reactionbuttons.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(reactionbuttons.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(reactionbuttons, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(24:8) {#if flipped}",
    		ctx
    	});

    	return block;
    }

    // (29:2) {#if cardIndex === (numberOfCards < data.length ? numberOfCards : data.length)}
    function create_if_block$1(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Review finished!";
    			attr_dev(h1, "id", "finished");
    			attr_dev(h1, "class", "svelte-1o529lf");
    			add_location(h1, file$2, 29, 4, 1007);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(29:2) {#if cardIndex === (numberOfCards < data.length ? numberOfCards : data.length)}",
    		ctx
    	});

    	return block;
    }

    // (12:23)    <p>awaiting data...</p>   {:then data}
    function create_pending_block$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "awaiting data...";
    			add_location(p, file$2, 12, 2, 311);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$1.name,
    		type: "pending",
    		source: "(12:23)    <p>awaiting data...</p>   {:then data}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let main;
    	let promise;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block$1,
    		then: create_then_block$1,
    		catch: create_catch_block$1,
    		value: 9,
    		error: 10,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*promisedData*/ ctx[0], info);

    	const block = {
    		c: function create() {
    			main = element("main");
    			info.block.c();
    			attr_dev(main, "class", "svelte-1o529lf");
    			add_location(main, file$2, 10, 0, 278);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			info.block.m(main, info.anchor = null);
    			info.mount = () => main;
    			info.anchor = null;
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*promisedData*/ 1 && promise !== (promise = /*promisedData*/ ctx[0]) && handle_promise(promise, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			info.block.d();
    			info.token = null;
    			info = null;
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PracticeFlashcard", slots, []);
    	let { promisedData } = $$props, { numberOfCards } = $$props;
    	let cardIndex = 0;
    	let frontSide = true;
    	let flipped = false;
    	const writable_props = ["promisedData", "numberOfCards"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PracticeFlashcard> was created with unknown prop '${key}'`);
    	});

    	function flashcard_flipped_binding(value) {
    		flipped = value;
    		$$invalidate(4, flipped);
    	}

    	function reactionbuttons_cardIndex_binding(value) {
    		cardIndex = value;
    		$$invalidate(2, cardIndex);
    	}

    	function reactionbuttons_frontSide_binding(value) {
    		frontSide = value;
    		$$invalidate(3, frontSide);
    	}

    	function reactionbuttons_flipped_binding(value) {
    		flipped = value;
    		$$invalidate(4, flipped);
    	}

    	$$self.$$set = $$props => {
    		if ("promisedData" in $$props) $$invalidate(0, promisedData = $$props.promisedData);
    		if ("numberOfCards" in $$props) $$invalidate(1, numberOfCards = $$props.numberOfCards);
    	};

    	$$self.$capture_state = () => ({
    		Flashcard,
    		ReactionButtons,
    		fade,
    		promisedData,
    		numberOfCards,
    		cardIndex,
    		frontSide,
    		flipped
    	});

    	$$self.$inject_state = $$props => {
    		if ("promisedData" in $$props) $$invalidate(0, promisedData = $$props.promisedData);
    		if ("numberOfCards" in $$props) $$invalidate(1, numberOfCards = $$props.numberOfCards);
    		if ("cardIndex" in $$props) $$invalidate(2, cardIndex = $$props.cardIndex);
    		if ("frontSide" in $$props) $$invalidate(3, frontSide = $$props.frontSide);
    		if ("flipped" in $$props) $$invalidate(4, flipped = $$props.flipped);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		promisedData,
    		numberOfCards,
    		cardIndex,
    		frontSide,
    		flipped,
    		flashcard_flipped_binding,
    		reactionbuttons_cardIndex_binding,
    		reactionbuttons_frontSide_binding,
    		reactionbuttons_flipped_binding
    	];
    }

    class PracticeFlashcard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { promisedData: 0, numberOfCards: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PracticeFlashcard",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*promisedData*/ ctx[0] === undefined && !("promisedData" in props)) {
    			console.warn("<PracticeFlashcard> was created without expected prop 'promisedData'");
    		}

    		if (/*numberOfCards*/ ctx[1] === undefined && !("numberOfCards" in props)) {
    			console.warn("<PracticeFlashcard> was created without expected prop 'numberOfCards'");
    		}
    	}

    	get promisedData() {
    		throw new Error("<PracticeFlashcard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set promisedData(value) {
    		throw new Error("<PracticeFlashcard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get numberOfCards() {
    		throw new Error("<PracticeFlashcard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set numberOfCards(value) {
    		throw new Error("<PracticeFlashcard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Review/ReviewDashboard.svelte generated by Svelte v3.38.2 */
    const file$1 = "src/Review/ReviewDashboard.svelte";

    // (18:2) {#if !practiceMode}
    function create_if_block_1(ctx) {
    	let await_block_anchor;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 6,
    		error: 7,
    		blocks: [,,,]
    	};

    	handle_promise(/*fetchAllFlashcards*/ ctx[2], info);

    	const block = {
    		c: function create() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			update_await_block_branch(info, ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(18:2) {#if !practiceMode}",
    		ctx
    	});

    	return block;
    }

    // (46:6) {:catch error}
    function create_catch_block(ctx) {
    	let p;
    	let t0;
    	let t1_value = /*error*/ ctx[7] + "";
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("An error occurred! ");
    			t1 = text(t1_value);
    			add_location(p, file$1, 46, 6, 1568);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(46:6) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (21:2) {:then data}
    function create_then_block(ctx) {
    	let t;
    	let if_block1_anchor;
    	let current;
    	let if_block0 = !/*data*/ ctx[6].length && create_if_block_4(ctx);
    	let if_block1 = /*data*/ ctx[6].length && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*data*/ ctx[6].length) if_block1.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(21:2) {:then data}",
    		ctx
    	});

    	return block;
    }

    // (22:2) {#if !data.length}
    function create_if_block_4(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "No flashcards saved! Create some flashcards first...";
    			add_location(p, file$1, 22, 2, 594);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(22:2) {#if !data.length}",
    		ctx
    	});

    	return block;
    }

    // (25:2) {#if data.length}
    function create_if_block_2(ctx) {
    	let div2;
    	let div0;
    	let label;
    	let t1;
    	let input;
    	let t2;
    	let button;
    	let t4;
    	let div1;
    	let p0;
    	let t5;
    	let t6;
    	let t7;
    	let t8_value = (/*numberOfCards*/ ctx[1] === 1 ? "card" : "cards") + "";
    	let t8;
    	let t9;
    	let t10;
    	let div3;
    	let p1;
    	let t11_value = /*data*/ ctx[6].length + "";
    	let t11;
    	let t12;
    	let t13;
    	let flashcardtable;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*numberOfCards*/ ctx[1] > /*data*/ ctx[6].length && create_if_block_3(ctx);

    	flashcardtable = new FlashcardTable({
    			props: { flashcardData: /*data*/ ctx[6] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			label = element("label");
    			label.textContent = "How many cards would you like to review? (1-10)";
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			button = element("button");
    			button.textContent = "➡️";
    			t4 = space();
    			div1 = element("div");
    			p0 = element("p");
    			t5 = text("Review session of ");
    			t6 = text(/*numberOfCards*/ ctx[1]);
    			t7 = space();
    			t8 = text(t8_value);
    			t9 = space();
    			if (if_block) if_block.c();
    			t10 = space();
    			div3 = element("div");
    			p1 = element("p");
    			t11 = text(t11_value);
    			t12 = text(" cards currently saved");
    			t13 = space();
    			create_component(flashcardtable.$$.fragment);
    			attr_dev(label, "for", "number-of-cards");
    			add_location(label, file$1, 27, 6, 765);
    			attr_dev(input, "type", "number");
    			attr_dev(input, "id", "number-of-cards");
    			attr_dev(input, "name", "number-of-cards");
    			attr_dev(input, "min", "1");
    			attr_dev(input, "max", "10");
    			add_location(input, file$1, 28, 6, 856);
    			attr_dev(div0, "id", "card-quantity-selector");
    			attr_dev(div0, "class", "svelte-emp01n");
    			add_location(div0, file$1, 26, 4, 725);
    			attr_dev(button, "id", "review-start");
    			attr_dev(button, "class", "svelte-emp01n");
    			add_location(button, file$1, 30, 4, 981);
    			attr_dev(p0, "class", "svelte-emp01n");
    			add_location(p0, file$1, 34, 10, 1126);
    			attr_dev(div1, "id", "session-preview");
    			attr_dev(div1, "class", "svelte-emp01n");
    			add_location(div1, file$1, 33, 8, 1089);
    			attr_dev(div2, "id", "practice-session-selector");
    			attr_dev(div2, "class", "svelte-emp01n");
    			add_location(div2, file$1, 25, 2, 684);
    			add_location(p1, file$1, 41, 8, 1427);
    			attr_dev(div3, "id", "database-length");
    			attr_dev(div3, "class", "svelte-emp01n");
    			add_location(div3, file$1, 40, 6, 1392);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, label);
    			append_dev(div0, t1);
    			append_dev(div0, input);
    			set_input_value(input, /*numberOfCards*/ ctx[1]);
    			append_dev(div2, t2);
    			append_dev(div2, button);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, p0);
    			append_dev(p0, t5);
    			append_dev(p0, t6);
    			append_dev(p0, t7);
    			append_dev(p0, t8);
    			append_dev(div1, t9);
    			if (if_block) if_block.m(div1, null);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, p1);
    			append_dev(p1, t11);
    			append_dev(p1, t12);
    			insert_dev(target, t13, anchor);
    			mount_component(flashcardtable, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[3]),
    					listen_dev(button, "click", /*click_handler*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*numberOfCards*/ 2 && to_number(input.value) !== /*numberOfCards*/ ctx[1]) {
    				set_input_value(input, /*numberOfCards*/ ctx[1]);
    			}

    			if (!current || dirty & /*numberOfCards*/ 2) set_data_dev(t6, /*numberOfCards*/ ctx[1]);
    			if ((!current || dirty & /*numberOfCards*/ 2) && t8_value !== (t8_value = (/*numberOfCards*/ ctx[1] === 1 ? "card" : "cards") + "")) set_data_dev(t8, t8_value);

    			if (/*numberOfCards*/ ctx[1] > /*data*/ ctx[6].length) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_3(ctx);
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(flashcardtable.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(flashcardtable.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block) if_block.d();
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(div3);
    			if (detaching) detach_dev(t13);
    			destroy_component(flashcardtable, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(25:2) {#if data.length}",
    		ctx
    	});

    	return block;
    }

    // (36:10) {#if numberOfCards > data.length}
    function create_if_block_3(ctx) {
    	let p;
    	let t0;
    	let t1_value = /*data*/ ctx[6].length + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Note that you will only be shown ");
    			t1 = text(t1_value);
    			t2 = text(" cards");
    			set_style(p, "color", "red");
    			attr_dev(p, "class", "svelte-emp01n");
    			add_location(p, file$1, 36, 10, 1263);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(36:10) {#if numberOfCards > data.length}",
    		ctx
    	});

    	return block;
    }

    // (19:29)      <p>Fetching all flashcards...</p>   {:then data}
    function create_pending_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Fetching all flashcards...";
    			add_location(p, file$1, 19, 4, 522);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(19:29)      <p>Fetching all flashcards...</p>   {:then data}",
    		ctx
    	});

    	return block;
    }

    // (51:6) {#if practiceMode}
    function create_if_block(ctx) {
    	let practiceflashcard;
    	let t0;
    	let button;
    	let current;
    	let mounted;
    	let dispose;

    	practiceflashcard = new PracticeFlashcard({
    			props: {
    				promisedData: /*fetchAllFlashcards*/ ctx[2],
    				numberOfCards: /*numberOfCards*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(practiceflashcard.$$.fragment);
    			t0 = space();
    			button = element("button");
    			button.textContent = "Go back!";
    			add_location(button, file$1, 52, 8, 1748);
    		},
    		m: function mount(target, anchor) {
    			mount_component(practiceflashcard, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, button, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const practiceflashcard_changes = {};
    			if (dirty & /*numberOfCards*/ 2) practiceflashcard_changes.numberOfCards = /*numberOfCards*/ ctx[1];
    			practiceflashcard.$set(practiceflashcard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(practiceflashcard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(practiceflashcard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(practiceflashcard, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(51:6) {#if practiceMode}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let main;
    	let t;
    	let current;
    	let if_block0 = !/*practiceMode*/ ctx[0] && create_if_block_1(ctx);
    	let if_block1 = /*practiceMode*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(main, "class", "svelte-emp01n");
    			add_location(main, file$1, 16, 0, 457);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t);
    			if (if_block1) if_block1.m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*practiceMode*/ ctx[0]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*practiceMode*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(main, t);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*practiceMode*/ ctx[0]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*practiceMode*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(main, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ReviewDashboard", slots, []);

    	const fetchAllFlashcards = (async () => {
    		const response = await fetch("http://localhost:3000/flashcards");
    		const data = await response.json();
    		return data;
    	})();

    	let practiceMode = false;
    	let numberOfCards = 1;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ReviewDashboard> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		numberOfCards = to_number(this.value);
    		$$invalidate(1, numberOfCards);
    	}

    	const click_handler = () => {
    		$$invalidate(0, practiceMode = !practiceMode);
    	};

    	const click_handler_1 = () => {
    		$$invalidate(0, practiceMode = !practiceMode);
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		Flashcard,
    		FlashcardTable,
    		PracticeFlashcard,
    		fetchAllFlashcards,
    		practiceMode,
    		numberOfCards
    	});

    	$$self.$inject_state = $$props => {
    		if ("practiceMode" in $$props) $$invalidate(0, practiceMode = $$props.practiceMode);
    		if ("numberOfCards" in $$props) $$invalidate(1, numberOfCards = $$props.numberOfCards);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		practiceMode,
    		numberOfCards,
    		fetchAllFlashcards,
    		input_input_handler,
    		click_handler,
    		click_handler_1
    	];
    }

    class ReviewDashboard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ReviewDashboard",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.38.2 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let body;
    	let nav;
    	let a0;
    	let t1;
    	let a1;
    	let t3;
    	let a2;
    	let t5;
    	let router;
    	let current;

    	router = new Router({
    			props: {
    				routes: {
    					"/": Home,
    					"/create-dashboard": CreateDashboard,
    					"/review-dashboard": ReviewDashboard
    				}
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			body = element("body");
    			nav = element("nav");
    			a0 = element("a");
    			a0.textContent = "🏠";
    			t1 = space();
    			a1 = element("a");
    			a1.textContent = "CREATE";
    			t3 = space();
    			a2 = element("a");
    			a2.textContent = "REVIEW";
    			t5 = space();
    			create_component(router.$$.fragment);
    			attr_dev(a0, "class", "nav-button svelte-3f774y");
    			attr_dev(a0, "href", "/#/");
    			add_location(a0, file, 10, 3, 258);
    			attr_dev(a1, "class", "nav-button svelte-3f774y");
    			attr_dev(a1, "href", "/#/create-dashboard");
    			add_location(a1, file, 11, 3, 301);
    			attr_dev(a2, "class", "nav-button svelte-3f774y");
    			attr_dev(a2, "href", "/#/review-dashboard");
    			add_location(a2, file, 12, 3, 364);
    			attr_dev(nav, "class", "svelte-3f774y");
    			add_location(nav, file, 9, 1, 249);
    			attr_dev(body, "class", "svelte-3f774y");
    			add_location(body, file, 8, 0, 241);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, body, anchor);
    			append_dev(body, nav);
    			append_dev(nav, a0);
    			append_dev(nav, t1);
    			append_dev(nav, a1);
    			append_dev(nav, t3);
    			append_dev(nav, a2);
    			append_dev(body, t5);
    			mount_component(router, body, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(body);
    			destroy_component(router);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let reviewMode;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Router,
    		Home,
    		CreateDashboard,
    		ReviewDashboard,
    		reviewMode
    	});

    	$$self.$inject_state = $$props => {
    		if ("reviewMode" in $$props) reviewMode = $$props.reviewMode;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
