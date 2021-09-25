
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
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
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

    const { Error: Error_1, Object: Object_1$1, console: console_1$1 } = globals;

    // (209:0) {:else}
    function create_else_block$1(ctx) {
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
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(209:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (202:0) {#if componentParams}
    function create_if_block$a(ctx) {
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
    		id: create_if_block$a.name,
    		type: "if",
    		source: "(202:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$a, create_else_block$1];
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
    		id: create_fragment$d.name,
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

    const location$1 = derived(loc, $loc => $loc.location);
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

    function instance$d($$self, $$props, $$invalidate) {
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Router> was created with unknown prop '${key}'`);
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
    		location: location$1,
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

    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$d.name
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

    /* src/Home.svelte generated by Svelte v3.38.2 */
    const file$c = "src/Home.svelte";

    // (7:2) {#if renderReady}
    function create_if_block$9(ctx) {
    	let div;
    	let h1;
    	let t1;
    	let img;
    	let img_src_value;
    	let t2;
    	let h3;
    	let t3;
    	let span0;
    	let t5;
    	let span1;
    	let t7;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Welcome to";
    			t1 = space();
    			img = element("img");
    			t2 = space();
    			h3 = element("h3");
    			t3 = text("Click ");
    			span0 = element("span");
    			span0.textContent = "✍️";
    			t5 = text("create or ");
    			span1 = element("span");
    			span1.textContent = "📚";
    			t7 = text("review to get started!");
    			attr_dev(h1, "class", "svelte-1uascni");
    			add_location(h1, file$c, 8, 3, 146);
    			if (img.src !== (img_src_value = "animated-logo.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "slendercards");
    			attr_dev(img, "class", "svelte-1uascni");
    			add_location(img, file$c, 9, 4, 170);
    			attr_dev(span0, "id", "create");
    			attr_dev(span0, "class", "svelte-1uascni");
    			add_location(span0, file$c, 10, 14, 233);
    			attr_dev(span1, "id", "review");
    			attr_dev(span1, "class", "svelte-1uascni");
    			add_location(span1, file$c, 10, 51, 270);
    			attr_dev(h3, "class", "svelte-1uascni");
    			add_location(h3, file$c, 10, 4, 223);
    			attr_dev(div, "class", "container svelte-1uascni");
    			add_location(div, file$c, 7, 2, 119);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			append_dev(div, img);
    			append_dev(div, t2);
    			append_dev(div, h3);
    			append_dev(h3, t3);
    			append_dev(h3, span0);
    			append_dev(h3, t5);
    			append_dev(h3, span1);
    			append_dev(h3, t7);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$9.name,
    		type: "if",
    		source: "(7:2) {#if renderReady}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let main;
    	let if_block = /*renderReady*/ ctx[0] && create_if_block$9(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block) if_block.c();
    			add_location(main, file$c, 5, 0, 90);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if (if_block) if_block.m(main, null);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Home", slots, []);
    	let renderReady = true;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ fade, renderReady });

    	$$self.$inject_state = $$props => {
    		if ("renderReady" in $$props) $$invalidate(0, renderReady = $$props.renderReady);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [renderReady];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src/Create/LanguageChoices.svelte generated by Svelte v3.38.2 */

    const { Object: Object_1 } = globals;
    const file$b = "src/Create/LanguageChoices.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i][0];
    	child_ctx[16] = list[i][1];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i][0];
    	child_ctx[16] = list[i][1];
    	return child_ctx;
    }

    // (26:6) {#each Object.entries(languages) as [language, emoji]}
    function create_each_block_1(ctx) {
    	let button;
    	let t0_value = /*emoji*/ ctx[16] + "";
    	let t0;
    	let t1_value = /*language*/ ctx[15] + "";
    	let t1;
    	let t2;
    	let button_intro;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[8](/*language*/ ctx[15], /*emoji*/ ctx[16]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(button, "class", "animated-button language-choice svelte-pp86xw");
    			add_location(button, file$b, 26, 8, 624);
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
    		source: "(26:6) {#each Object.entries(languages) as [language, emoji]}",
    		ctx
    	});

    	return block;
    }

    // (35:8) {#each Object.entries(languages) as [language, emoji]}
    function create_each_block$2(ctx) {
    	let button;
    	let t0_value = /*emoji*/ ctx[16] + "";
    	let t0;
    	let t1_value = /*language*/ ctx[15] + "";
    	let t1;
    	let t2;
    	let button_intro;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[9](/*language*/ ctx[15], /*emoji*/ ctx[16]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(button, "class", "animated-button language-choice svelte-pp86xw");
    			add_location(button, file$b, 35, 8, 992);
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
    		source: "(35:8) {#each Object.entries(languages) as [language, emoji]}",
    		ctx
    	});

    	return block;
    }

    // (49:35) 
    function create_if_block_3$2(ctx) {
    	let h3;
    	let t0_value = /*languages*/ ctx[7][/*srcLang*/ ctx[1]] + "";
    	let t0;
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(/*srcLang*/ ctx[1]);
    			attr_dev(h3, "class", "svelte-pp86xw");
    			add_location(h3, file$b, 49, 8, 1565);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t0);
    			append_dev(h3, t1);
    			append_dev(h3, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*srcLang*/ 2 && t0_value !== (t0_value = /*languages*/ ctx[7][/*srcLang*/ ctx[1]] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*srcLang*/ 2) set_data_dev(t2, /*srcLang*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$2.name,
    		type: "if",
    		source: "(49:35) ",
    		ctx
    	});

    	return block;
    }

    // (47:8) {#if !srcLang}
    function create_if_block_2$3(ctx) {
    	let h3;
    	let h3_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "No source language selected";
    			attr_dev(h3, "class", "svelte-pp86xw");
    			add_location(h3, file$b, 47, 8, 1377);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(h3, "outrostart", /*outrostart_handler*/ ctx[10], false, false, false),
    					listen_dev(h3, "outroend", /*outroend_handler*/ ctx[11], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h3_transition) h3_transition = create_bidirectional_transition(h3, fade, {}, true);
    				h3_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!h3_transition) h3_transition = create_bidirectional_transition(h3, fade, {}, false);
    			h3_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching && h3_transition) h3_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$3.name,
    		type: "if",
    		source: "(47:8) {#if !srcLang}",
    		ctx
    	});

    	return block;
    }

    // (55:36) 
    function create_if_block_1$5(ctx) {
    	let h3;
    	let t0_value = /*languages*/ ctx[7][/*targLang*/ ctx[3]] + "";
    	let t0;
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(/*targLang*/ ctx[3]);
    			attr_dev(h3, "class", "svelte-pp86xw");
    			add_location(h3, file$b, 55, 8, 1862);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t0);
    			append_dev(h3, t1);
    			append_dev(h3, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*targLang*/ 8 && t0_value !== (t0_value = /*languages*/ ctx[7][/*targLang*/ ctx[3]] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*targLang*/ 8) set_data_dev(t2, /*targLang*/ ctx[3]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$5.name,
    		type: "if",
    		source: "(55:36) ",
    		ctx
    	});

    	return block;
    }

    // (53:8) {#if !targLang}
    function create_if_block$8(ctx) {
    	let h3;
    	let h3_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "No target language selected";
    			attr_dev(h3, "class", "svelte-pp86xw");
    			add_location(h3, file$b, 53, 8, 1670);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(h3, "outrostart", /*outrostart_handler_1*/ ctx[12], false, false, false),
    					listen_dev(h3, "outroend", /*outroend_handler_1*/ ctx[13], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h3_transition) h3_transition = create_bidirectional_transition(h3, fade, {}, true);
    				h3_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!h3_transition) h3_transition = create_bidirectional_transition(h3, fade, {}, false);
    			h3_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching && h3_transition) h3_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(53:8) {#if !targLang}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let main;
    	let div2;
    	let div0;
    	let h30;
    	let t1;
    	let t2;
    	let div1;
    	let h31;
    	let t4;
    	let t5;
    	let div4;
    	let h2;
    	let t7;
    	let div3;
    	let current_block_type_index;
    	let if_block0;
    	let t8;
    	let h4;
    	let t10;
    	let current_block_type_index_1;
    	let if_block1;
    	let t11;
    	let button;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_1 = Object.entries(/*languages*/ ctx[7]);
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = Object.entries(/*languages*/ ctx[7]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const if_block_creators = [create_if_block_2$3, create_if_block_3$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*srcLang*/ ctx[1]) return 0;
    		if (/*readyToRenderSrc*/ ctx[5]) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const if_block_creators_1 = [create_if_block$8, create_if_block_1$5];
    	const if_blocks_1 = [];

    	function select_block_type_1(ctx, dirty) {
    		if (!/*targLang*/ ctx[3]) return 0;
    		if (/*readyToRenderTarg*/ ctx[6]) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index_1 = select_block_type_1(ctx))) {
    		if_block1 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
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
    			div4 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Chosen languages:";
    			t7 = space();
    			div3 = element("div");
    			if (if_block0) if_block0.c();
    			t8 = space();
    			h4 = element("h4");
    			h4.textContent = "↓";
    			t10 = space();
    			if (if_block1) if_block1.c();
    			t11 = space();
    			button = element("button");
    			button.textContent = "Next";
    			attr_dev(h30, "class", "svelte-pp86xw");
    			add_location(h30, file$b, 24, 6, 538);
    			attr_dev(div0, "class", "src-lang-list");
    			add_location(div0, file$b, 23, 4, 504);
    			attr_dev(h31, "class", "svelte-pp86xw");
    			add_location(h31, file$b, 33, 8, 904);
    			attr_dev(div1, "class", "targ-lang-list");
    			add_location(div1, file$b, 32, 6, 867);
    			attr_dev(div2, "class", "lang-container");
    			add_location(div2, file$b, 22, 2, 471);
    			attr_dev(h2, "class", "svelte-pp86xw");
    			add_location(h2, file$b, 44, 6, 1283);
    			attr_dev(h4, "class", "svelte-pp86xw");
    			add_location(h4, file$b, 51, 8, 1627);
    			attr_dev(div3, "id", "selected-languages");
    			attr_dev(div3, "class", "svelte-pp86xw");
    			add_location(div3, file$b, 45, 6, 1316);
    			attr_dev(div4, "id", "chosen-languages-container");
    			attr_dev(div4, "class", "svelte-pp86xw");
    			add_location(div4, file$b, 43, 4, 1239);
    			attr_dev(button, "class", "animated-button language-choice svelte-pp86xw");
    			add_location(button, file$b, 59, 8, 1950);
    			attr_dev(main, "class", "svelte-pp86xw");
    			add_location(main, file$b, 21, 0, 462);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div2);
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

    			append_dev(main, t5);
    			append_dev(main, div4);
    			append_dev(div4, h2);
    			append_dev(div4, t7);
    			append_dev(div4, div3);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div3, null);
    			}

    			append_dev(div3, t8);
    			append_dev(div3, h4);
    			append_dev(div3, t10);

    			if (~current_block_type_index_1) {
    				if_blocks_1[current_block_type_index_1].m(div3, null);
    			}

    			append_dev(main, t11);
    			append_dev(main, button);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_2*/ ctx[14], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*srcLangHandler, Object, languages*/ 132) {
    				each_value_1 = Object.entries(/*languages*/ ctx[7]);
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

    			if (dirty & /*targLangHandler, Object, languages*/ 144) {
    				each_value = Object.entries(/*languages*/ ctx[7]);
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

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block0) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block0 = if_blocks[current_block_type_index];

    					if (!if_block0) {
    						if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block0.c();
    					} else {
    						if_block0.p(ctx, dirty);
    					}

    					transition_in(if_block0, 1);
    					if_block0.m(div3, t8);
    				} else {
    					if_block0 = null;
    				}
    			}

    			let previous_block_index_1 = current_block_type_index_1;
    			current_block_type_index_1 = select_block_type_1(ctx);

    			if (current_block_type_index_1 === previous_block_index_1) {
    				if (~current_block_type_index_1) {
    					if_blocks_1[current_block_type_index_1].p(ctx, dirty);
    				}
    			} else {
    				if (if_block1) {
    					group_outros();

    					transition_out(if_blocks_1[previous_block_index_1], 1, 1, () => {
    						if_blocks_1[previous_block_index_1] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index_1) {
    					if_block1 = if_blocks_1[current_block_type_index_1];

    					if (!if_block1) {
    						if_block1 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    						if_block1.c();
    					} else {
    						if_block1.p(ctx, dirty);
    					}

    					transition_in(if_block1, 1);
    					if_block1.m(div3, null);
    				} else {
    					if_block1 = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

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
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			if (~current_block_type_index_1) {
    				if_blocks_1[current_block_type_index_1].d();
    			}

    			mounted = false;
    			dispose();
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

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("LanguageChoices", slots, []);

    	let { languagesChosen } = $$props,
    		{ srcLang } = $$props,
    		{ srcLangHandler } = $$props,
    		{ targLang } = $$props,
    		{ targLangHandler } = $$props;

    	let readyToRenderSrc = true;
    	let readyToRenderTarg = true;

    	const languages = {
    		"English": "🇬🇧",
    		"German": "🇩🇪",
    		"Spanish": "🇪🇸",
    		"French": "🇫🇷",
    		"Italian": "🇮🇹",
    		"Polish": "🇵🇱",
    		"Russian": "🇷🇺",
    		"Portuguese": "🇵🇹",
    		"Japanese": "🇯🇵",
    		"Chinese": "🇨🇳"
    	};

    	const writable_props = ["languagesChosen", "srcLang", "srcLangHandler", "targLang", "targLangHandler"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<LanguageChoices> was created with unknown prop '${key}'`);
    	});

    	const click_handler = (language, emoji) => srcLangHandler(language, emoji);
    	const click_handler_1 = (language, emoji) => targLangHandler(language, emoji);
    	const outrostart_handler = () => $$invalidate(5, readyToRenderSrc = false);
    	const outroend_handler = () => $$invalidate(5, readyToRenderSrc = true);
    	const outrostart_handler_1 = () => $$invalidate(6, readyToRenderTarg = false);
    	const outroend_handler_1 = () => $$invalidate(6, readyToRenderTarg = true);

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
    		fade,
    		fly,
    		languagesChosen,
    		srcLang,
    		srcLangHandler,
    		targLang,
    		targLangHandler,
    		readyToRenderSrc,
    		readyToRenderTarg,
    		languages
    	});

    	$$self.$inject_state = $$props => {
    		if ("languagesChosen" in $$props) $$invalidate(0, languagesChosen = $$props.languagesChosen);
    		if ("srcLang" in $$props) $$invalidate(1, srcLang = $$props.srcLang);
    		if ("srcLangHandler" in $$props) $$invalidate(2, srcLangHandler = $$props.srcLangHandler);
    		if ("targLang" in $$props) $$invalidate(3, targLang = $$props.targLang);
    		if ("targLangHandler" in $$props) $$invalidate(4, targLangHandler = $$props.targLangHandler);
    		if ("readyToRenderSrc" in $$props) $$invalidate(5, readyToRenderSrc = $$props.readyToRenderSrc);
    		if ("readyToRenderTarg" in $$props) $$invalidate(6, readyToRenderTarg = $$props.readyToRenderTarg);
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
    		readyToRenderSrc,
    		readyToRenderTarg,
    		languages,
    		click_handler,
    		click_handler_1,
    		outrostart_handler,
    		outroend_handler,
    		outrostart_handler_1,
    		outroend_handler_1,
    		click_handler_2
    	];
    }

    class LanguageChoices extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {
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
    			id: create_fragment$b.name
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

    const { console: console_1 } = globals;
    const file$a = "src/Create/IndividualCard.svelte";

    // (26:1) {#if visible}
    function create_if_block$7(ctx) {
    	let div;
    	let p0;
    	let t0;
    	let t1;
    	let t2_value = /*example*/ ctx[1].from + "";
    	let t2;
    	let t3;
    	let p1;
    	let t4;
    	let t5;
    	let t6_value = /*example*/ ctx[1].to + "";
    	let t6;
    	let t7;
    	let button;
    	let div_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			t0 = text(/*srcEmoji*/ ctx[2]);
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = space();
    			p1 = element("p");
    			t4 = text(/*targEmoji*/ ctx[3]);
    			t5 = space();
    			t6 = text(t6_value);
    			t7 = space();
    			button = element("button");
    			button.textContent = "✅";
    			attr_dev(p0, "class", "sentence svelte-g8ccvz");
    			add_location(p0, file$a, 27, 3, 643);
    			attr_dev(p1, "class", "sentence svelte-g8ccvz");
    			add_location(p1, file$a, 28, 3, 696);
    			attr_dev(button, "class", "card-selector svelte-g8ccvz");
    			add_location(button, file$a, 29, 3, 748);
    			attr_dev(div, "class", "example-card svelte-g8ccvz");
    			add_location(div, file$a, 26, 2, 597);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(p0, t0);
    			append_dev(p0, t1);
    			append_dev(p0, t2);
    			append_dev(div, t3);
    			append_dev(div, p1);
    			append_dev(p1, t4);
    			append_dev(p1, t5);
    			append_dev(p1, t6);
    			append_dev(div, t7);
    			append_dev(div, button);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*srcEmoji*/ 4) set_data_dev(t0, /*srcEmoji*/ ctx[2]);
    			if ((!current || dirty & /*example*/ 2) && t2_value !== (t2_value = /*example*/ ctx[1].from + "")) set_data_dev(t2, t2_value);
    			if (!current || dirty & /*targEmoji*/ 8) set_data_dev(t4, /*targEmoji*/ ctx[3]);
    			if ((!current || dirty & /*example*/ 2) && t6_value !== (t6_value = /*example*/ ctx[1].to + "")) set_data_dev(t6, t6_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(26:1) {#if visible}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*visible*/ ctx[0] && create_if_block$7(ctx);

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
    			if (/*visible*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*visible*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$7(ctx);
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
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("IndividualCard", slots, []);

    	let { visible } = $$props,
    		{ example } = $$props,
    		{ srcEmoji } = $$props,
    		{ srcLang } = $$props,
    		{ targEmoji } = $$props,
    		{ targLang } = $$props;

    	let examplePosted = false;

    	const postSentence = async () => {
    		if (examplePosted) {
    			console.log("Sentence already posted to database!!");
    			return;
    		}

    		
    		examplePosted = true;

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

    	const writable_props = ["visible", "example", "srcEmoji", "srcLang", "targEmoji", "targLang"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<IndividualCard> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		$$invalidate(0, visible = false);
    		postSentence();
    	};

    	$$self.$$set = $$props => {
    		if ("visible" in $$props) $$invalidate(0, visible = $$props.visible);
    		if ("example" in $$props) $$invalidate(1, example = $$props.example);
    		if ("srcEmoji" in $$props) $$invalidate(2, srcEmoji = $$props.srcEmoji);
    		if ("srcLang" in $$props) $$invalidate(5, srcLang = $$props.srcLang);
    		if ("targEmoji" in $$props) $$invalidate(3, targEmoji = $$props.targEmoji);
    		if ("targLang" in $$props) $$invalidate(6, targLang = $$props.targLang);
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		fly,
    		visible,
    		example,
    		srcEmoji,
    		srcLang,
    		targEmoji,
    		targLang,
    		examplePosted,
    		postSentence
    	});

    	$$self.$inject_state = $$props => {
    		if ("visible" in $$props) $$invalidate(0, visible = $$props.visible);
    		if ("example" in $$props) $$invalidate(1, example = $$props.example);
    		if ("srcEmoji" in $$props) $$invalidate(2, srcEmoji = $$props.srcEmoji);
    		if ("srcLang" in $$props) $$invalidate(5, srcLang = $$props.srcLang);
    		if ("targEmoji" in $$props) $$invalidate(3, targEmoji = $$props.targEmoji);
    		if ("targLang" in $$props) $$invalidate(6, targLang = $$props.targLang);
    		if ("examplePosted" in $$props) examplePosted = $$props.examplePosted;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		visible,
    		example,
    		srcEmoji,
    		targEmoji,
    		postSentence,
    		srcLang,
    		targLang,
    		click_handler
    	];
    }

    class IndividualCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
    			visible: 0,
    			example: 1,
    			srcEmoji: 2,
    			srcLang: 5,
    			targEmoji: 3,
    			targLang: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "IndividualCard",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*visible*/ ctx[0] === undefined && !("visible" in props)) {
    			console_1.warn("<IndividualCard> was created without expected prop 'visible'");
    		}

    		if (/*example*/ ctx[1] === undefined && !("example" in props)) {
    			console_1.warn("<IndividualCard> was created without expected prop 'example'");
    		}

    		if (/*srcEmoji*/ ctx[2] === undefined && !("srcEmoji" in props)) {
    			console_1.warn("<IndividualCard> was created without expected prop 'srcEmoji'");
    		}

    		if (/*srcLang*/ ctx[5] === undefined && !("srcLang" in props)) {
    			console_1.warn("<IndividualCard> was created without expected prop 'srcLang'");
    		}

    		if (/*targEmoji*/ ctx[3] === undefined && !("targEmoji" in props)) {
    			console_1.warn("<IndividualCard> was created without expected prop 'targEmoji'");
    		}

    		if (/*targLang*/ ctx[6] === undefined && !("targLang" in props)) {
    			console_1.warn("<IndividualCard> was created without expected prop 'targLang'");
    		}
    	}

    	get visible() {
    		throw new Error("<IndividualCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set visible(value) {
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
    const file$9 = "src/Create/ContextCards.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	return child_ctx;
    }

    // (45:2) {#if searched}
    function create_if_block$6(ctx) {
    	let await_block_anchor;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block$1,
    		then: create_then_block$1,
    		catch: create_catch_block$1,
    		value: 17,
    		error: 21,
    		blocks: [,,,]
    	};

    	handle_promise(/*fetchSentences*/ ctx[11](), info);

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
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(45:2) {#if searched}",
    		ctx
    	});

    	return block;
    }

    // (81:3) {:catch error}
    function create_catch_block$1(ctx) {
    	let p;
    	let t0;
    	let t1_value = /*error*/ ctx[21] + "";
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("An error occurred! ");
    			t1 = text(t1_value);
    			add_location(p, file$9, 81, 4, 2481);
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
    		id: create_catch_block$1.name,
    		type: "catch",
    		source: "(81:3) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (48:2) {:then data}
    function create_then_block$1(ctx) {
    	let div0;
    	let button0;
    	let button0_transition;
    	let t1;
    	let button1;
    	let button1_transition;
    	let t3;
    	let div1;
    	let p;
    	let t4;
    	let t5_value = /*data*/ ctx[17].examples.length + "";
    	let t5;
    	let t6;
    	let t7_value = /*startIndex*/ ctx[7] + 1 + "";
    	let t7;
    	let t8;

    	let t9_value = (/*endIndex*/ ctx[8] > /*data*/ ctx[17].examples.length
    	? /*data*/ ctx[17].examples.length
    	: /*endIndex*/ ctx[8]) + "";

    	let t9;
    	let t10;
    	let previous_key = /*startIndex*/ ctx[7];
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[13](/*data*/ ctx[17]);
    	}

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[14](/*data*/ ctx[17]);
    	}

    	let key_block = create_key_block_1(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "←";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "→";
    			t3 = space();
    			div1 = element("div");
    			p = element("p");
    			t4 = text("Found ");
    			t5 = text(t5_value);
    			t6 = text(" sentences. Showing sentences ");
    			t7 = text(t7_value);
    			t8 = text(" - ");
    			t9 = text(t9_value);
    			t10 = space();
    			key_block.c();
    			attr_dev(button0, "class", "animated-button fetch-sentences svelte-1asivrs");
    			add_location(button0, file$9, 49, 3, 1325);
    			attr_dev(button1, "class", "animated-button fetch-sentences svelte-1asivrs");
    			add_location(button1, file$9, 58, 3, 1638);
    			attr_dev(div0, "id", "shuffle-sentences");
    			attr_dev(div0, "class", "svelte-1asivrs");
    			add_location(div0, file$9, 48, 2, 1293);
    			add_location(p, file$9, 69, 4, 1929);
    			attr_dev(div1, "id", "sentences-grid");
    			attr_dev(div1, "class", "svelte-1asivrs");
    			add_location(div1, file$9, 68, 3, 1899);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, button0);
    			append_dev(div0, t1);
    			append_dev(div0, button1);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, p);
    			append_dev(p, t4);
    			append_dev(p, t5);
    			append_dev(p, t6);
    			append_dev(p, t7);
    			append_dev(p, t8);
    			append_dev(p, t9);
    			append_dev(div1, t10);
    			key_block.m(div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", click_handler, false, false, false),
    					listen_dev(button1, "click", click_handler_1, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*startIndex*/ 128) && t7_value !== (t7_value = /*startIndex*/ ctx[7] + 1 + "")) set_data_dev(t7, t7_value);

    			if ((!current || dirty & /*endIndex*/ 256) && t9_value !== (t9_value = (/*endIndex*/ ctx[8] > /*data*/ ctx[17].examples.length
    			? /*data*/ ctx[17].examples.length
    			: /*endIndex*/ ctx[8]) + "")) set_data_dev(t9, t9_value);

    			if (dirty & /*startIndex*/ 128 && safe_not_equal(previous_key, previous_key = /*startIndex*/ ctx[7])) {
    				group_outros();
    				transition_out(key_block, 1, 1, noop);
    				check_outros();
    				key_block = create_key_block_1(ctx);
    				key_block.c();
    				transition_in(key_block);
    				key_block.m(div1, null);
    			} else {
    				key_block.p(ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!button0_transition) button0_transition = create_bidirectional_transition(button0, fade, {}, true);
    				button0_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!button1_transition) button1_transition = create_bidirectional_transition(button1, fade, {}, true);
    				button1_transition.run(1);
    			});

    			transition_in(key_block);
    			current = true;
    		},
    		o: function outro(local) {
    			if (!button0_transition) button0_transition = create_bidirectional_transition(button0, fade, {}, false);
    			button0_transition.run(0);
    			if (!button1_transition) button1_transition = create_bidirectional_transition(button1, fade, {}, false);
    			button1_transition.run(0);
    			transition_out(key_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching && button0_transition) button0_transition.end();
    			if (detaching && button1_transition) button1_transition.end();
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div1);
    			key_block.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$1.name,
    		type: "then",
    		source: "(48:2) {:then data}",
    		ctx
    	});

    	return block;
    }

    // (73:6) {#if readyToRender}
    function create_if_block_1$4(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*data*/ ctx[17].examples.slice(/*startIndex*/ ctx[7], /*endIndex*/ ctx[8]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

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
    			if (dirty & /*visible, fetchSentences, startIndex, endIndex, srcEmoji, srcLang, targEmoji, targLang*/ 2959) {
    				each_value = /*data*/ ctx[17].examples.slice(/*startIndex*/ ctx[7], /*endIndex*/ ctx[8]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
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
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(73:6) {#if readyToRender}",
    		ctx
    	});

    	return block;
    }

    // (74:7) {#each data.examples.slice(startIndex, endIndex) as example}
    function create_each_block$1(ctx) {
    	let individualcard;
    	let current;

    	individualcard = new IndividualCard({
    			props: {
    				visible: /*visible*/ ctx[9],
    				example: /*example*/ ctx[18],
    				srcEmoji: /*srcEmoji*/ ctx[2],
    				srcLang: /*srcLang*/ ctx[0],
    				targEmoji: /*targEmoji*/ ctx[3],
    				targLang: /*targLang*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(individualcard.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(individualcard, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const individualcard_changes = {};
    			if (dirty & /*visible*/ 512) individualcard_changes.visible = /*visible*/ ctx[9];
    			if (dirty & /*startIndex, endIndex*/ 384) individualcard_changes.example = /*example*/ ctx[18];
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
    			destroy_component(individualcard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(74:7) {#each data.examples.slice(startIndex, endIndex) as example}",
    		ctx
    	});

    	return block;
    }

    // (71:4) {#key startIndex}
    function create_key_block_1(ctx) {
    	let div;
    	let div_transition;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*readyToRender*/ ctx[10] && create_if_block_1$4(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			add_location(div, file$9, 71, 4, 2107);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div, "outrostart", /*outrostart_handler*/ ctx[15], false, false, false),
    					listen_dev(div, "outroend", /*outroend_handler*/ ctx[16], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*readyToRender*/ ctx[10]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*readyToRender*/ 1024) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1$4(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
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
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			if (detaching && div_transition) div_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block_1.name,
    		type: "key",
    		source: "(71:4) {#key startIndex}",
    		ctx
    	});

    	return block;
    }

    // (46:27)    <p>Getting sentence..</p>   {:then data}
    function create_pending_block$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Getting sentence..";
    			add_location(p, file$9, 46, 2, 1250);
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
    		source: "(46:27)    <p>Getting sentence..</p>   {:then data}",
    		ctx
    	});

    	return block;
    }

    // (44:2) {#key newSearch}
    function create_key_block$2(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*searched*/ ctx[5] && create_if_block$6(ctx);

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
    					if_block = create_if_block$6(ctx);
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
    		id: create_key_block$2.name,
    		type: "key",
    		source: "(44:2) {#key newSearch}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let main;
    	let div0;
    	let h40;
    	let t0;
    	let t1;
    	let t2;
    	let h40_transition;
    	let t3;
    	let h41;
    	let t4;
    	let t5;
    	let t6;
    	let h41_transition;
    	let t7;
    	let h42;
    	let h42_transition;
    	let t9;
    	let div1;
    	let input;
    	let input_transition;
    	let t10;
    	let button;
    	let button_transition;
    	let t12;
    	let previous_key = /*newSearch*/ ctx[6];
    	let current;
    	let mounted;
    	let dispose;
    	let key_block = create_key_block$2(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			h40 = element("h4");
    			t0 = text("1. Search for a ");
    			t1 = text(/*srcEmoji*/ ctx[2]);
    			t2 = text(" word, phrase or sentence...");
    			t3 = space();
    			h41 = element("h4");
    			t4 = text("2. See ");
    			t5 = text(/*targEmoji*/ ctx[3]);
    			t6 = text(" translations!");
    			t7 = space();
    			h42 = element("h4");
    			h42.textContent = "Click ✅ to create a Text-to-Speech flashcard!";
    			t9 = space();
    			div1 = element("div");
    			input = element("input");
    			t10 = space();
    			button = element("button");
    			button.textContent = "Submit";
    			t12 = space();
    			key_block.c();
    			attr_dev(h40, "class", "svelte-1asivrs");
    			add_location(h40, file$9, 33, 2, 742);
    			attr_dev(h41, "class", "svelte-1asivrs");
    			add_location(h41, file$9, 34, 2, 824);
    			attr_dev(h42, "class", "svelte-1asivrs");
    			add_location(h42, file$9, 35, 2, 884);
    			attr_dev(div0, "id", "instructions");
    			attr_dev(div0, "class", "svelte-1asivrs");
    			add_location(div0, file$9, 32, 1, 716);
    			attr_dev(input, "placeholder", "Search...");
    			attr_dev(input, "class", "svelte-1asivrs");
    			add_location(input, file$9, 38, 2, 986);
    			attr_dev(button, "class", "animated-button fetch-sentences svelte-1asivrs");
    			add_location(button, file$9, 39, 2, 1062);
    			attr_dev(div1, "id", "searcher");
    			attr_dev(div1, "class", "svelte-1asivrs");
    			add_location(div1, file$9, 37, 1, 964);
    			attr_dev(main, "class", "svelte-1asivrs");
    			add_location(main, file$9, 31, 0, 708);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			append_dev(div0, h40);
    			append_dev(h40, t0);
    			append_dev(h40, t1);
    			append_dev(h40, t2);
    			append_dev(div0, t3);
    			append_dev(div0, h41);
    			append_dev(h41, t4);
    			append_dev(h41, t5);
    			append_dev(h41, t6);
    			append_dev(div0, t7);
    			append_dev(div0, h42);
    			append_dev(main, t9);
    			append_dev(main, div1);
    			append_dev(div1, input);
    			set_input_value(input, /*phraseQuery*/ ctx[4]);
    			append_dev(div1, t10);
    			append_dev(div1, button);
    			append_dev(main, t12);
    			key_block.m(main, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[12]),
    					listen_dev(button, "click", /*fetchSentences*/ ctx[11], false, false, false)
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
    				key_block = create_key_block$2(ctx);
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
    				if (!h40_transition) h40_transition = create_bidirectional_transition(h40, fade, {}, true);
    				h40_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!h41_transition) h41_transition = create_bidirectional_transition(h41, fade, {}, true);
    				h41_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!h42_transition) h42_transition = create_bidirectional_transition(h42, fade, {}, true);
    				h42_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!input_transition) input_transition = create_bidirectional_transition(input, fade, {}, true);
    				input_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!button_transition) button_transition = create_bidirectional_transition(button, fade, {}, true);
    				button_transition.run(1);
    			});

    			transition_in(key_block);
    			current = true;
    		},
    		o: function outro(local) {
    			if (!h40_transition) h40_transition = create_bidirectional_transition(h40, fade, {}, false);
    			h40_transition.run(0);
    			if (!h41_transition) h41_transition = create_bidirectional_transition(h41, fade, {}, false);
    			h41_transition.run(0);
    			if (!h42_transition) h42_transition = create_bidirectional_transition(h42, fade, {}, false);
    			h42_transition.run(0);
    			if (!input_transition) input_transition = create_bidirectional_transition(input, fade, {}, false);
    			input_transition.run(0);
    			if (!button_transition) button_transition = create_bidirectional_transition(button, fade, {}, false);
    			button_transition.run(0);
    			transition_out(key_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (detaching && h40_transition) h40_transition.end();
    			if (detaching && h41_transition) h41_transition.end();
    			if (detaching && h42_transition) h42_transition.end();
    			if (detaching && input_transition) input_transition.end();
    			if (detaching && button_transition) button_transition.end();
    			key_block.d(detaching);
    			mounted = false;
    			run_all(dispose);
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
    	validate_slots("ContextCards", slots, []);

    	let { srcLang } = $$props,
    		{ targLang } = $$props,
    		{ srcEmoji } = $$props,
    		{ targEmoji } = $$props;

    	let phraseQuery = "";
    	let searched = false;
    	let newSearch = "";
    	let startIndex = 0;
    	let endIndex = 4;
    	let visible = true;
    	let readyToRender = true;

    	const fetchSentences = async () => {
    		if (!phraseQuery) return;
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

    	const click_handler = data => {
    		$$invalidate(7, startIndex -= 4);
    		$$invalidate(8, endIndex -= 4);

    		if (endIndex <= 0) {
    			$$invalidate(9, visible = true);

    			$$invalidate(7, startIndex = data.examples.length - 4 < 0
    			? 0
    			: data.examples.length - 4);

    			$$invalidate(8, endIndex = data.examples.length);
    		}
    	};

    	const click_handler_1 = data => {
    		$$invalidate(7, startIndex += 4);
    		$$invalidate(8, endIndex += 4);

    		if (endIndex > data.examples.length) {
    			$$invalidate(9, visible = true);
    			$$invalidate(7, startIndex = 0);
    			$$invalidate(8, endIndex = 4);
    		}
    	};

    	const outrostart_handler = () => $$invalidate(10, readyToRender = false);
    	const outroend_handler = () => $$invalidate(10, readyToRender = true);

    	$$self.$$set = $$props => {
    		if ("srcLang" in $$props) $$invalidate(0, srcLang = $$props.srcLang);
    		if ("targLang" in $$props) $$invalidate(1, targLang = $$props.targLang);
    		if ("srcEmoji" in $$props) $$invalidate(2, srcEmoji = $$props.srcEmoji);
    		if ("targEmoji" in $$props) $$invalidate(3, targEmoji = $$props.targEmoji);
    	};

    	$$self.$capture_state = () => ({
    		IndividualCard,
    		fade,
    		srcLang,
    		targLang,
    		srcEmoji,
    		targEmoji,
    		phraseQuery,
    		searched,
    		newSearch,
    		startIndex,
    		endIndex,
    		visible,
    		readyToRender,
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
    		if ("startIndex" in $$props) $$invalidate(7, startIndex = $$props.startIndex);
    		if ("endIndex" in $$props) $$invalidate(8, endIndex = $$props.endIndex);
    		if ("visible" in $$props) $$invalidate(9, visible = $$props.visible);
    		if ("readyToRender" in $$props) $$invalidate(10, readyToRender = $$props.readyToRender);
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
    		startIndex,
    		endIndex,
    		visible,
    		readyToRender,
    		fetchSentences,
    		input_input_handler,
    		click_handler,
    		click_handler_1,
    		outrostart_handler,
    		outroend_handler
    	];
    }

    class ContextCards extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
    			srcLang: 0,
    			targLang: 1,
    			srcEmoji: 2,
    			targEmoji: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ContextCards",
    			options,
    			id: create_fragment$9.name
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
    const file$8 = "src/Create/CreateDashboard.svelte";

    // (23:2) {#if !languagesChosen || !srcLang || !targLang}
    function create_if_block_1$3(ctx) {
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
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(23:2) {#if !languagesChosen || !srcLang || !targLang}",
    		ctx
    	});

    	return block;
    }

    // (27:2) {#if languagesChosen && srcLang && targLang}
    function create_if_block$5(ctx) {
    	let contextcards;
    	let current;

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
    		},
    		m: function mount(target, anchor) {
    			mount_component(contextcards, target, anchor);
    			current = true;
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
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(27:2) {#if languagesChosen && srcLang && targLang}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let main;
    	let t;
    	let current;
    	let if_block0 = (!/*languagesChosen*/ ctx[0] || !/*srcLang*/ ctx[1] || !/*targLang*/ ctx[3]) && create_if_block_1$3(ctx);
    	let if_block1 = /*languagesChosen*/ ctx[0] && /*srcLang*/ ctx[1] && /*targLang*/ ctx[3] && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(main, "class", "svelte-uz2a6t");
    			add_location(main, file$8, 21, 0, 449);
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
    					if_block0 = create_if_block_1$3(ctx);
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
    					if_block1 = create_if_block$5(ctx);
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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
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
    		languagechoices_targLang_binding
    	];
    }

    class CreateDashboard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CreateDashboard",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/Review/FlashcardTable.svelte generated by Svelte v3.38.2 */

    const file$7 = "src/Review/FlashcardTable.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[16] = list[i];
    	child_ctx[18] = i;
    	return child_ctx;
    }

    // (85:10) {#each filteredList as sentence, i}
    function create_each_block(ctx) {
    	let tbody;
    	let tr;
    	let td0;
    	let t0_value = /*languages*/ ctx[9][/*sentence*/ ctx[16].srcLang] + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*sentence*/ ctx[16].srcSentence + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*languages*/ ctx[9][/*sentence*/ ctx[16].targLang] + "";
    	let t4;
    	let t5;
    	let td3;
    	let t6_value = /*sentence*/ ctx[16].targSentence + "";
    	let t6;
    	let t7;
    	let td4;
    	let t8_value = /*sentence*/ ctx[16].overallScore + "";
    	let t8;
    	let t9;
    	let td5;
    	let button;
    	let t11;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[15](/*i*/ ctx[18], /*sentence*/ ctx[16]);
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
    			add_location(td0, file$7, 87, 16, 2466);
    			attr_dev(td1, "class", "src-sentence svelte-1mupl8s");
    			add_location(td1, file$7, 88, 16, 2521);
    			add_location(td2, file$7, 89, 16, 2590);
    			attr_dev(td3, "class", "targ-sentence");
    			add_location(td3, file$7, 90, 16, 2646);
    			add_location(td4, file$7, 91, 16, 2717);
    			attr_dev(button, "class", "delete-button svelte-1mupl8s");
    			add_location(button, file$7, 93, 19, 2789);
    			add_location(td5, file$7, 92, 16, 2766);
    			attr_dev(tr, "class", "svelte-1mupl8s");
    			add_location(tr, file$7, 86, 14, 2445);
    			add_location(tbody, file$7, 85, 12, 2423);
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

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*filteredList*/ 128 && t0_value !== (t0_value = /*languages*/ ctx[9][/*sentence*/ ctx[16].srcLang] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*filteredList*/ 128 && t2_value !== (t2_value = /*sentence*/ ctx[16].srcSentence + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*filteredList*/ 128 && t4_value !== (t4_value = /*languages*/ ctx[9][/*sentence*/ ctx[16].targLang] + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*filteredList*/ 128 && t6_value !== (t6_value = /*sentence*/ ctx[16].targSentence + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*filteredList*/ 128 && t8_value !== (t8_value = /*sentence*/ ctx[16].overallScore + "")) set_data_dev(t8, t8_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tbody);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(85:10) {#each filteredList as sentence, i}",
    		ctx
    	});

    	return block;
    }

    // (84:8) {#key flashcardData}
    function create_key_block$1(ctx) {
    	let each_1_anchor;
    	let each_value = /*filteredList*/ ctx[7];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
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
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*removeFlashcard, filteredList, languages*/ 896) {
    				each_value = /*filteredList*/ ctx[7];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block$1.name,
    		type: "key",
    		source: "(84:8) {#key flashcardData}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let main;
    	let h3;
    	let t1;
    	let div1;
    	let div0;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let input0;
    	let t2;
    	let th1;
    	let input1;
    	let t3;
    	let th2;
    	let input2;
    	let t4;
    	let th3;
    	let input3;
    	let t5;
    	let th4;
    	let input4;
    	let t6;
    	let th5;
    	let t7;
    	let previous_key = /*flashcardData*/ ctx[0];
    	let t8;
    	let p;
    	let t9;
    	let t10_value = /*filteredFlashcards*/ ctx[1].length + "";
    	let t10;
    	let t11;
    	let t12_value = /*flashcardData*/ ctx[0].length + "";
    	let t12;
    	let t13;
    	let mounted;
    	let dispose;
    	let key_block = create_key_block$1(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			h3 = element("h3");
    			h3.textContent = "(Optional) filter cards before starting a review session";
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			input0 = element("input");
    			t2 = space();
    			th1 = element("th");
    			input1 = element("input");
    			t3 = space();
    			th2 = element("th");
    			input2 = element("input");
    			t4 = space();
    			th3 = element("th");
    			input3 = element("input");
    			t5 = space();
    			th4 = element("th");
    			input4 = element("input");
    			t6 = space();
    			th5 = element("th");
    			t7 = space();
    			key_block.c();
    			t8 = space();
    			p = element("p");
    			t9 = text("Showing ");
    			t10 = text(t10_value);
    			t11 = text("/");
    			t12 = text(t12_value);
    			t13 = text(" cards");
    			attr_dev(h3, "class", "svelte-1mupl8s");
    			add_location(h3, file$7, 50, 2, 1313);
    			attr_dev(input0, "placeholder", "Source");
    			attr_dev(input0, "class", "svelte-1mupl8s");
    			add_location(input0, file$7, 57, 15, 1532);
    			attr_dev(th0, "id", "src-lang-input");
    			attr_dev(th0, "class", "svelte-1mupl8s");
    			add_location(th0, file$7, 56, 12, 1493);
    			attr_dev(input1, "placeholder", "Sentence");
    			attr_dev(input1, "class", "svelte-1mupl8s");
    			add_location(input1, file$7, 60, 15, 1663);
    			attr_dev(th1, "id", "src-sentence-input");
    			attr_dev(th1, "class", "svelte-1mupl8s");
    			add_location(th1, file$7, 59, 12, 1620);
    			attr_dev(input2, "placeholder", "Target");
    			attr_dev(input2, "class", "svelte-1mupl8s");
    			add_location(input2, file$7, 66, 15, 1843);
    			attr_dev(th2, "id", "targ-lang-input");
    			attr_dev(th2, "class", "svelte-1mupl8s");
    			add_location(th2, file$7, 65, 12, 1803);
    			attr_dev(input3, "placeholder", "Sentence");
    			attr_dev(input3, "class", "svelte-1mupl8s");
    			add_location(input3, file$7, 69, 15, 1976);
    			attr_dev(th3, "id", "targ-sentence-input");
    			attr_dev(th3, "class", "svelte-1mupl8s");
    			add_location(th3, file$7, 68, 12, 1932);
    			attr_dev(input4, "placeholder", "Min. score");
    			attr_dev(input4, "class", "svelte-1mupl8s");
    			add_location(input4, file$7, 75, 15, 2153);
    			attr_dev(th4, "id", "score-input");
    			attr_dev(th4, "class", "svelte-1mupl8s");
    			add_location(th4, file$7, 74, 12, 2117);
    			attr_dev(th5, "class", "svelte-1mupl8s");
    			add_location(th5, file$7, 80, 12, 2296);
    			attr_dev(tr, "class", "svelte-1mupl8s");
    			add_location(tr, file$7, 55, 10, 1476);
    			attr_dev(thead, "class", "svelte-1mupl8s");
    			add_location(thead, file$7, 54, 8, 1458);
    			attr_dev(table, "class", "svelte-1mupl8s");
    			add_location(table, file$7, 53, 6, 1442);
    			attr_dev(div0, "id", "database-table");
    			attr_dev(div0, "class", "svelte-1mupl8s");
    			add_location(div0, file$7, 52, 4, 1410);
    			attr_dev(div1, "id", "table-wrapper");
    			attr_dev(div1, "class", "svelte-1mupl8s");
    			add_location(div1, file$7, 51, 2, 1381);
    			add_location(p, file$7, 107, 2, 3119);
    			attr_dev(main, "class", "svelte-1mupl8s");
    			add_location(main, file$7, 49, 0, 1304);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h3);
    			append_dev(main, t1);
    			append_dev(main, div1);
    			append_dev(div1, div0);
    			append_dev(div0, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(th0, input0);
    			set_input_value(input0, /*srcLangSearch*/ ctx[2]);
    			append_dev(tr, t2);
    			append_dev(tr, th1);
    			append_dev(th1, input1);
    			set_input_value(input1, /*srcSentenceSearch*/ ctx[3]);
    			append_dev(tr, t3);
    			append_dev(tr, th2);
    			append_dev(th2, input2);
    			set_input_value(input2, /*targLangSearch*/ ctx[4]);
    			append_dev(tr, t4);
    			append_dev(tr, th3);
    			append_dev(th3, input3);
    			set_input_value(input3, /*targSentenceSearch*/ ctx[5]);
    			append_dev(tr, t5);
    			append_dev(tr, th4);
    			append_dev(th4, input4);
    			set_input_value(input4, /*overallScoreSearch*/ ctx[6]);
    			append_dev(tr, t6);
    			append_dev(tr, th5);
    			append_dev(table, t7);
    			key_block.m(table, null);
    			append_dev(main, t8);
    			append_dev(main, p);
    			append_dev(p, t9);
    			append_dev(p, t10);
    			append_dev(p, t11);
    			append_dev(p, t12);
    			append_dev(p, t13);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[10]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[11]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[12]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[13]),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[14])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*srcLangSearch*/ 4 && input0.value !== /*srcLangSearch*/ ctx[2]) {
    				set_input_value(input0, /*srcLangSearch*/ ctx[2]);
    			}

    			if (dirty & /*srcSentenceSearch*/ 8 && input1.value !== /*srcSentenceSearch*/ ctx[3]) {
    				set_input_value(input1, /*srcSentenceSearch*/ ctx[3]);
    			}

    			if (dirty & /*targLangSearch*/ 16 && input2.value !== /*targLangSearch*/ ctx[4]) {
    				set_input_value(input2, /*targLangSearch*/ ctx[4]);
    			}

    			if (dirty & /*targSentenceSearch*/ 32 && input3.value !== /*targSentenceSearch*/ ctx[5]) {
    				set_input_value(input3, /*targSentenceSearch*/ ctx[5]);
    			}

    			if (dirty & /*overallScoreSearch*/ 64 && input4.value !== /*overallScoreSearch*/ ctx[6]) {
    				set_input_value(input4, /*overallScoreSearch*/ ctx[6]);
    			}

    			if (dirty & /*flashcardData*/ 1 && safe_not_equal(previous_key, previous_key = /*flashcardData*/ ctx[0])) {
    				key_block.d(1);
    				key_block = create_key_block$1(ctx);
    				key_block.c();
    				key_block.m(table, null);
    			} else {
    				key_block.p(ctx, dirty);
    			}

    			if (dirty & /*filteredFlashcards*/ 2 && t10_value !== (t10_value = /*filteredFlashcards*/ ctx[1].length + "")) set_data_dev(t10, t10_value);
    			if (dirty & /*flashcardData*/ 1 && t12_value !== (t12_value = /*flashcardData*/ ctx[0].length + "")) set_data_dev(t12, t12_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
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
    	let filteredList;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("FlashcardTable", slots, []);
    	let { flashcardData } = $$props;
    	let { filteredFlashcards } = $$props;
    	let srcLangSearch = "";
    	let srcSentenceSearch = "";
    	let targLangSearch = "";
    	let targSentenceSearch = "";
    	let overallScoreSearch = "";

    	const removeFlashcard = async (i, id) => {
    		await fetch(`http://localhost:3000/flashcards/${id}`, { method: "DELETE" });
    		$$invalidate(0, flashcardData = [...flashcardData.slice(0, i), ...flashcardData.slice(i + 1)]);
    	}; // location.reload();

    	const languages = {
    		English: "🇬🇧",
    		German: "🇩🇪",
    		Spanish: "🇪🇸",
    		French: "🇫🇷",
    		Italian: "🇮🇹",
    		Polish: "🇵🇱",
    		Russian: "🇷🇺",
    		Portuguese: "🇵🇹",
    		Japanese: "🇯🇵",
    		Chinese: "🇨🇳"
    	};

    	const writable_props = ["flashcardData", "filteredFlashcards"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FlashcardTable> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		srcLangSearch = this.value;
    		$$invalidate(2, srcLangSearch);
    	}

    	function input1_input_handler() {
    		srcSentenceSearch = this.value;
    		$$invalidate(3, srcSentenceSearch);
    	}

    	function input2_input_handler() {
    		targLangSearch = this.value;
    		$$invalidate(4, targLangSearch);
    	}

    	function input3_input_handler() {
    		targSentenceSearch = this.value;
    		$$invalidate(5, targSentenceSearch);
    	}

    	function input4_input_handler() {
    		overallScoreSearch = this.value;
    		$$invalidate(6, overallScoreSearch);
    	}

    	const click_handler = (i, sentence) => {
    		removeFlashcard(i, sentence._id);
    	};

    	$$self.$$set = $$props => {
    		if ("flashcardData" in $$props) $$invalidate(0, flashcardData = $$props.flashcardData);
    		if ("filteredFlashcards" in $$props) $$invalidate(1, filteredFlashcards = $$props.filteredFlashcards);
    	};

    	$$self.$capture_state = () => ({
    		flashcardData,
    		filteredFlashcards,
    		srcLangSearch,
    		srcSentenceSearch,
    		targLangSearch,
    		targSentenceSearch,
    		overallScoreSearch,
    		removeFlashcard,
    		languages,
    		filteredList
    	});

    	$$self.$inject_state = $$props => {
    		if ("flashcardData" in $$props) $$invalidate(0, flashcardData = $$props.flashcardData);
    		if ("filteredFlashcards" in $$props) $$invalidate(1, filteredFlashcards = $$props.filteredFlashcards);
    		if ("srcLangSearch" in $$props) $$invalidate(2, srcLangSearch = $$props.srcLangSearch);
    		if ("srcSentenceSearch" in $$props) $$invalidate(3, srcSentenceSearch = $$props.srcSentenceSearch);
    		if ("targLangSearch" in $$props) $$invalidate(4, targLangSearch = $$props.targLangSearch);
    		if ("targSentenceSearch" in $$props) $$invalidate(5, targSentenceSearch = $$props.targSentenceSearch);
    		if ("overallScoreSearch" in $$props) $$invalidate(6, overallScoreSearch = $$props.overallScoreSearch);
    		if ("filteredList" in $$props) $$invalidate(7, filteredList = $$props.filteredList);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*flashcardData, srcLangSearch, srcSentenceSearch, targLangSearch, targSentenceSearch, overallScoreSearch*/ 125) {
    			$$invalidate(7, filteredList = $$invalidate(1, filteredFlashcards = flashcardData.filter(flashcard => {
    				return flashcard.srcLang.toLowerCase().indexOf(srcLangSearch.toLowerCase()) !== -1 && flashcard.srcSentence.toLowerCase().indexOf(srcSentenceSearch.toLowerCase()) !== -1 && flashcard.targLang.toLowerCase().indexOf(targLangSearch.toLowerCase()) !== -1 && flashcard.targSentence.toLowerCase().indexOf(targSentenceSearch.toLowerCase()) !== -1 && flashcard.overallScore >= overallScoreSearch;
    			})));
    		}
    	};

    	return [
    		flashcardData,
    		filteredFlashcards,
    		srcLangSearch,
    		srcSentenceSearch,
    		targLangSearch,
    		targSentenceSearch,
    		overallScoreSearch,
    		filteredList,
    		removeFlashcard,
    		languages,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler,
    		click_handler
    	];
    }

    class FlashcardTable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { flashcardData: 0, filteredFlashcards: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FlashcardTable",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*flashcardData*/ ctx[0] === undefined && !("flashcardData" in props)) {
    			console.warn("<FlashcardTable> was created without expected prop 'flashcardData'");
    		}

    		if (/*filteredFlashcards*/ ctx[1] === undefined && !("filteredFlashcards" in props)) {
    			console.warn("<FlashcardTable> was created without expected prop 'filteredFlashcards'");
    		}
    	}

    	get flashcardData() {
    		throw new Error("<FlashcardTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set flashcardData(value) {
    		throw new Error("<FlashcardTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get filteredFlashcards() {
    		throw new Error("<FlashcardTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set filteredFlashcards(value) {
    		throw new Error("<FlashcardTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Review/TtsAudioPlayer.svelte generated by Svelte v3.38.2 */

    const file$6 = "src/Review/TtsAudioPlayer.svelte";

    function create_fragment$6(ctx) {
    	let audio;
    	let track;
    	let audio_src_value;

    	const block = {
    		c: function create() {
    			audio = element("audio");
    			track = element("track");
    			attr_dev(track, "kind", "captions");
    			add_location(track, file$6, 6, 2, 79);
    			audio.controls = true;
    			attr_dev(audio, "id", "tts-audio");
    			if (audio.src !== (audio_src_value = /*src*/ ctx[0])) attr_dev(audio, "src", audio_src_value);
    			attr_dev(audio, "class", "svelte-5das1h");
    			add_location(audio, file$6, 5, 0, 39);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, audio, anchor);
    			append_dev(audio, track);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*src*/ 1 && audio.src !== (audio_src_value = /*src*/ ctx[0])) {
    				attr_dev(audio, "src", audio_src_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(audio);
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
    	validate_slots("TtsAudioPlayer", slots, []);
    	let { src } = $$props;
    	const writable_props = ["src"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TtsAudioPlayer> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("src" in $$props) $$invalidate(0, src = $$props.src);
    	};

    	$$self.$capture_state = () => ({ src });

    	$$self.$inject_state = $$props => {
    		if ("src" in $$props) $$invalidate(0, src = $$props.src);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [src];
    }

    class TtsAudioPlayer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { src: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TtsAudioPlayer",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*src*/ ctx[0] === undefined && !("src" in props)) {
    			console.warn("<TtsAudioPlayer> was created without expected prop 'src'");
    		}
    	}

    	get src() {
    		throw new Error("<TtsAudioPlayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set src(value) {
    		throw new Error("<TtsAudioPlayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Review/Flashcard.svelte generated by Svelte v3.38.2 */
    const file$5 = "src/Review/Flashcard.svelte";

    // (39:4) {:else}
    function create_else_block(ctx) {
    	let div;
    	let h1;
    	let t0_value = /*languages*/ ctx[5][/*data*/ ctx[3][/*cardIndex*/ ctx[2]].targLang] + "";
    	let t0;
    	let t1;
    	let h2;
    	let t2_value = /*data*/ ctx[3][/*cardIndex*/ ctx[2]].targSentence + "";
    	let t2;
    	let t3;
    	let ttsaudioplayer;
    	let div_transition;
    	let current;

    	ttsaudioplayer = new TtsAudioPlayer({
    			props: {
    				src: /*data*/ ctx[3][/*cardIndex*/ ctx[2]].targTTS
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			h2 = element("h2");
    			t2 = text(t2_value);
    			t3 = space();
    			create_component(ttsaudioplayer.$$.fragment);
    			attr_dev(h1, "class", "lang svelte-106v0tk");
    			add_location(h1, file$5, 40, 6, 1113);
    			attr_dev(h2, "class", "sentence svelte-106v0tk");
    			add_location(h2, file$5, 41, 6, 1179);
    			attr_dev(div, "class", "side back svelte-106v0tk");
    			add_location(div, file$5, 39, 4, 1067);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(h1, t0);
    			append_dev(div, t1);
    			append_dev(div, h2);
    			append_dev(h2, t2);
    			append_dev(div, t3);
    			mount_component(ttsaudioplayer, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*data, cardIndex*/ 12) && t0_value !== (t0_value = /*languages*/ ctx[5][/*data*/ ctx[3][/*cardIndex*/ ctx[2]].targLang] + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty & /*data, cardIndex*/ 12) && t2_value !== (t2_value = /*data*/ ctx[3][/*cardIndex*/ ctx[2]].targSentence + "")) set_data_dev(t2, t2_value);
    			const ttsaudioplayer_changes = {};
    			if (dirty & /*data, cardIndex*/ 12) ttsaudioplayer_changes.src = /*data*/ ctx[3][/*cardIndex*/ ctx[2]].targTTS;
    			ttsaudioplayer.$set(ttsaudioplayer_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(ttsaudioplayer.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, /*flip*/ ctx[4], {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(ttsaudioplayer.$$.fragment, local);
    			if (!div_transition) div_transition = create_bidirectional_transition(div, /*flip*/ ctx[4], {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(ttsaudioplayer);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(39:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (33:2) {#if frontSide}
    function create_if_block$4(ctx) {
    	let div;
    	let h1;
    	let t0_value = /*languages*/ ctx[5][/*data*/ ctx[3][/*cardIndex*/ ctx[2]].srcLang] + "";
    	let t0;
    	let t1;
    	let h2;
    	let t2_value = /*data*/ ctx[3][/*cardIndex*/ ctx[2]].srcSentence + "";
    	let t2;
    	let t3;
    	let ttsaudioplayer;
    	let div_transition;
    	let current;

    	ttsaudioplayer = new TtsAudioPlayer({
    			props: {
    				src: /*data*/ ctx[3][/*cardIndex*/ ctx[2]].srcTTS
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			h2 = element("h2");
    			t2 = text(t2_value);
    			t3 = space();
    			create_component(ttsaudioplayer.$$.fragment);
    			attr_dev(h1, "class", "lang svelte-106v0tk");
    			add_location(h1, file$5, 34, 6, 866);
    			attr_dev(h2, "class", "sentence svelte-106v0tk");
    			add_location(h2, file$5, 35, 6, 931);
    			attr_dev(div, "class", "side svelte-106v0tk");
    			add_location(div, file$5, 33, 4, 825);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(h1, t0);
    			append_dev(div, t1);
    			append_dev(div, h2);
    			append_dev(h2, t2);
    			append_dev(div, t3);
    			mount_component(ttsaudioplayer, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*data, cardIndex*/ 12) && t0_value !== (t0_value = /*languages*/ ctx[5][/*data*/ ctx[3][/*cardIndex*/ ctx[2]].srcLang] + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty & /*data, cardIndex*/ 12) && t2_value !== (t2_value = /*data*/ ctx[3][/*cardIndex*/ ctx[2]].srcSentence + "")) set_data_dev(t2, t2_value);
    			const ttsaudioplayer_changes = {};
    			if (dirty & /*data, cardIndex*/ 12) ttsaudioplayer_changes.src = /*data*/ ctx[3][/*cardIndex*/ ctx[2]].srcTTS;
    			ttsaudioplayer.$set(ttsaudioplayer_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(ttsaudioplayer.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, /*flip*/ ctx[4], {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(ttsaudioplayer.$$.fragment, local);
    			if (!div_transition) div_transition = create_bidirectional_transition(div, /*flip*/ ctx[4], {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(ttsaudioplayer);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(33:2) {#if frontSide}",
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
    	const if_block_creators = [create_if_block$4, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*frontSide*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "flashcard svelte-106v0tk");
    			add_location(div, file$5, 28, 0, 713);
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

    	let { cardIndex } = $$props,
    		{ data } = $$props,
    		{ flipped } = $$props,
    		{ frontSide } = $$props;

    	const flip = ({ delay = 0, duration = 350 }) => {
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
    		"Russian": "🇷🇺",
    		"Portuguese": "🇵🇹",
    		"Japanese": "🇯🇵",
    		"Chinese": "🇨🇳"
    	};

    	const writable_props = ["cardIndex", "data", "flipped", "frontSide"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Flashcard> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		$$invalidate(1, frontSide = !frontSide);
    		$$invalidate(0, flipped = true);
    	};

    	$$self.$$set = $$props => {
    		if ("cardIndex" in $$props) $$invalidate(2, cardIndex = $$props.cardIndex);
    		if ("data" in $$props) $$invalidate(3, data = $$props.data);
    		if ("flipped" in $$props) $$invalidate(0, flipped = $$props.flipped);
    		if ("frontSide" in $$props) $$invalidate(1, frontSide = $$props.frontSide);
    	};

    	$$self.$capture_state = () => ({
    		TtsAudioPlayer,
    		cardIndex,
    		data,
    		flipped,
    		frontSide,
    		flip,
    		languages
    	});

    	$$self.$inject_state = $$props => {
    		if ("cardIndex" in $$props) $$invalidate(2, cardIndex = $$props.cardIndex);
    		if ("data" in $$props) $$invalidate(3, data = $$props.data);
    		if ("flipped" in $$props) $$invalidate(0, flipped = $$props.flipped);
    		if ("frontSide" in $$props) $$invalidate(1, frontSide = $$props.frontSide);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [flipped, frontSide, cardIndex, data, flip, languages, click_handler];
    }

    class Flashcard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			cardIndex: 2,
    			data: 3,
    			flipped: 0,
    			frontSide: 1
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Flashcard",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*cardIndex*/ ctx[2] === undefined && !("cardIndex" in props)) {
    			console.warn("<Flashcard> was created without expected prop 'cardIndex'");
    		}

    		if (/*data*/ ctx[3] === undefined && !("data" in props)) {
    			console.warn("<Flashcard> was created without expected prop 'data'");
    		}

    		if (/*flipped*/ ctx[0] === undefined && !("flipped" in props)) {
    			console.warn("<Flashcard> was created without expected prop 'flipped'");
    		}

    		if (/*frontSide*/ ctx[1] === undefined && !("frontSide" in props)) {
    			console.warn("<Flashcard> was created without expected prop 'frontSide'");
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

    	get frontSide() {
    		throw new Error("<Flashcard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set frontSide(value) {
    		throw new Error("<Flashcard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Review/ReactionButtons.svelte generated by Svelte v3.38.2 */
    const file$4 = "src/Review/ReactionButtons.svelte";

    // (28:4) {#if happyVisible}
    function create_if_block_2$2(ctx) {
    	let p;
    	let p_intro;
    	let p_outro;
    	let current;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "+3";
    			add_location(p, file$4, 28, 6, 767);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (p_outro) p_outro.end(1);
    				if (!p_intro) p_intro = create_in_transition(p, fade, {});
    				p_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (p_intro) p_intro.invalidate();
    			p_outro = create_out_transition(p, fly, { y: -100, duration: 300 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching && p_outro) p_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(28:4) {#if happyVisible}",
    		ctx
    	});

    	return block;
    }

    // (42:4) {#if medVisible}
    function create_if_block_1$2(ctx) {
    	let p;
    	let p_intro;
    	let p_outro;
    	let current;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "+1";
    			add_location(p, file$4, 42, 6, 1128);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (p_outro) p_outro.end(1);
    				if (!p_intro) p_intro = create_in_transition(p, fade, {});
    				p_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (p_intro) p_intro.invalidate();
    			p_outro = create_out_transition(p, fly, { y: -100, duration: 300 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching && p_outro) p_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(42:4) {#if medVisible}",
    		ctx
    	});

    	return block;
    }

    // (56:4) {#if sadVisible}
    function create_if_block$3(ctx) {
    	let p;
    	let p_intro;
    	let p_outro;
    	let current;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "0";
    			add_location(p, file$4, 56, 6, 1488);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (p_outro) p_outro.end(1);
    				if (!p_intro) p_intro = create_in_transition(p, fade, {});
    				p_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (p_intro) p_intro.invalidate();
    			p_outro = create_out_transition(p, fly, { y: -100, duration: 300 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching && p_outro) p_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(56:4) {#if sadVisible}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div3;
    	let div0;
    	let button0;
    	let t1;
    	let t2;
    	let div1;
    	let button1;
    	let t4;
    	let t5;
    	let div2;
    	let button2;
    	let t7;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*happyVisible*/ ctx[6] && create_if_block_2$2(ctx);
    	let if_block1 = /*medVisible*/ ctx[5] && create_if_block_1$2(ctx);
    	let if_block2 = /*sadVisible*/ ctx[4] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "😄";
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			div1 = element("div");
    			button1 = element("button");
    			button1.textContent = "😐";
    			t4 = space();
    			if (if_block1) if_block1.c();
    			t5 = space();
    			div2 = element("div");
    			button2 = element("button");
    			button2.textContent = "😭";
    			t7 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(button0, "class", "svelte-omdkm2");
    			add_location(button0, file$4, 18, 4, 504);
    			attr_dev(div0, "class", "reaction svelte-omdkm2");
    			add_location(div0, file$4, 17, 2, 477);
    			attr_dev(button1, "class", "svelte-omdkm2");
    			add_location(button1, file$4, 32, 4, 868);
    			attr_dev(div1, "class", "reaction svelte-omdkm2");
    			add_location(div1, file$4, 31, 2, 841);
    			attr_dev(button2, "class", "svelte-omdkm2");
    			add_location(button2, file$4, 46, 4, 1229);
    			attr_dev(div2, "class", "reaction svelte-omdkm2");
    			add_location(div2, file$4, 45, 2, 1202);
    			attr_dev(div3, "id", "flashcard-reaction-buttons");
    			attr_dev(div3, "class", "svelte-omdkm2");
    			add_location(div3, file$4, 16, 0, 437);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t1);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div3, t2);
    			append_dev(div3, div1);
    			append_dev(div1, button1);
    			append_dev(div1, t4);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, button2);
    			append_dev(div2, t7);
    			if (if_block2) if_block2.m(div2, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[8], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[9], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[10], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*happyVisible*/ ctx[6]) {
    				if (if_block0) {
    					if (dirty & /*happyVisible*/ 64) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2$2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div0, null);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*medVisible*/ ctx[5]) {
    				if (if_block1) {
    					if (dirty & /*medVisible*/ 32) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1$2(ctx);
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

    			if (/*sadVisible*/ ctx[4]) {
    				if (if_block2) {
    					if (dirty & /*sadVisible*/ 16) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block$3(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div2, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ReactionButtons", slots, []);

    	let { data } = $$props,
    		{ cardIndex } = $$props,
    		{ frontSide } = $$props,
    		{ flipped } = $$props;

    	let sadVisible, medVisible, happyVisible = false;

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
    		updateFlashcardScore(data[cardIndex]._id, 3);
    		$$invalidate(6, happyVisible = true);

    		setTimeout(
    			() => {
    				$$invalidate(0, cardIndex++, cardIndex);
    				$$invalidate(1, frontSide = true);
    				$$invalidate(2, flipped = false);
    			},
    			500
    		);
    	};

    	const click_handler_1 = () => {
    		updateFlashcardScore(data[cardIndex]._id, 1);
    		$$invalidate(5, medVisible = true);

    		setTimeout(
    			() => {
    				$$invalidate(0, cardIndex++, cardIndex);
    				$$invalidate(1, frontSide = true);
    				$$invalidate(2, flipped = false);
    			},
    			500
    		);
    	};

    	const click_handler_2 = () => {
    		updateFlashcardScore(data[cardIndex]._id, 0);
    		$$invalidate(4, sadVisible = true);

    		setTimeout(
    			() => {
    				$$invalidate(0, cardIndex++, cardIndex);
    				$$invalidate(1, frontSide = true);
    				$$invalidate(2, flipped = false);
    			},
    			500
    		);
    	};

    	$$self.$$set = $$props => {
    		if ("data" in $$props) $$invalidate(3, data = $$props.data);
    		if ("cardIndex" in $$props) $$invalidate(0, cardIndex = $$props.cardIndex);
    		if ("frontSide" in $$props) $$invalidate(1, frontSide = $$props.frontSide);
    		if ("flipped" in $$props) $$invalidate(2, flipped = $$props.flipped);
    	};

    	$$self.$capture_state = () => ({
    		fly,
    		fade,
    		data,
    		cardIndex,
    		frontSide,
    		flipped,
    		sadVisible,
    		medVisible,
    		happyVisible,
    		updateFlashcardScore
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(3, data = $$props.data);
    		if ("cardIndex" in $$props) $$invalidate(0, cardIndex = $$props.cardIndex);
    		if ("frontSide" in $$props) $$invalidate(1, frontSide = $$props.frontSide);
    		if ("flipped" in $$props) $$invalidate(2, flipped = $$props.flipped);
    		if ("sadVisible" in $$props) $$invalidate(4, sadVisible = $$props.sadVisible);
    		if ("medVisible" in $$props) $$invalidate(5, medVisible = $$props.medVisible);
    		if ("happyVisible" in $$props) $$invalidate(6, happyVisible = $$props.happyVisible);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		cardIndex,
    		frontSide,
    		flipped,
    		data,
    		sadVisible,
    		medVisible,
    		happyVisible,
    		updateFlashcardScore,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class ReactionButtons extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			data: 3,
    			cardIndex: 0,
    			frontSide: 1,
    			flipped: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ReactionButtons",
    			options,
    			id: create_fragment$4.name
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
    const file$3 = "src/Review/PracticeFlashcard.svelte";

    // (13:2) {#if !filteredFlashcards.length}
    function create_if_block_4(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "No cards to display! Create some cards fast!";
    			add_location(p, file$3, 13, 6, 360);
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
    		source: "(13:2) {#if !filteredFlashcards.length}",
    		ctx
    	});

    	return block;
    }

    // (16:4) {#if filteredFlashcards.length}
    function create_if_block_1$1(ctx) {
    	let previous_key = /*cardIndex*/ ctx[2];
    	let key_block_anchor;
    	let current;
    	let key_block = create_key_block(ctx);

    	const block = {
    		c: function create() {
    			key_block.c();
    			key_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			key_block.m(target, anchor);
    			insert_dev(target, key_block_anchor, anchor);
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
    				key_block.m(key_block_anchor.parentNode, key_block_anchor);
    			} else {
    				key_block.p(ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(key_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(key_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(key_block_anchor);
    			key_block.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(16:4) {#if filteredFlashcards.length}",
    		ctx
    	});

    	return block;
    }

    // (19:10) {#if cardIndex < (numberOfCards < filteredFlashcards.length ? numberOfCards : filteredFlashcards.length) && readyToRender}
    function create_if_block_2$1(ctx) {
    	let h2;
    	let t0;
    	let t1_value = /*cardIndex*/ ctx[2] + 1 + "";
    	let t1;
    	let t2;

    	let t3_value = (/*numberOfCards*/ ctx[0] < /*filteredFlashcards*/ ctx[1].length
    	? /*numberOfCards*/ ctx[0]
    	: /*filteredFlashcards*/ ctx[1].length) + "";

    	let t3;
    	let t4;
    	let flashcard;
    	let updating_flipped;
    	let t5;
    	let if_block_anchor;
    	let current;

    	function flashcard_flipped_binding(value) {
    		/*flashcard_flipped_binding*/ ctx[6](value);
    	}

    	let flashcard_props = {
    		data: /*filteredFlashcards*/ ctx[1],
    		cardIndex: /*cardIndex*/ ctx[2],
    		frontSide: /*frontSide*/ ctx[3]
    	};

    	if (/*flipped*/ ctx[4] !== void 0) {
    		flashcard_props.flipped = /*flipped*/ ctx[4];
    	}

    	flashcard = new Flashcard({ props: flashcard_props, $$inline: true });
    	binding_callbacks.push(() => bind(flashcard, "flipped", flashcard_flipped_binding));
    	let if_block = /*flipped*/ ctx[4] && create_if_block_3$1(ctx);

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			t0 = text("Card ");
    			t1 = text(t1_value);
    			t2 = text("/");
    			t3 = text(t3_value);
    			t4 = space();
    			create_component(flashcard.$$.fragment);
    			t5 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(h2, "class", "svelte-1rcxg7f");
    			add_location(h2, file$3, 19, 12, 764);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(h2, t2);
    			append_dev(h2, t3);
    			insert_dev(target, t4, anchor);
    			mount_component(flashcard, target, anchor);
    			insert_dev(target, t5, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*cardIndex*/ 4) && t1_value !== (t1_value = /*cardIndex*/ ctx[2] + 1 + "")) set_data_dev(t1, t1_value);

    			if ((!current || dirty & /*numberOfCards, filteredFlashcards*/ 3) && t3_value !== (t3_value = (/*numberOfCards*/ ctx[0] < /*filteredFlashcards*/ ctx[1].length
    			? /*numberOfCards*/ ctx[0]
    			: /*filteredFlashcards*/ ctx[1].length) + "")) set_data_dev(t3, t3_value);

    			const flashcard_changes = {};
    			if (dirty & /*filteredFlashcards*/ 2) flashcard_changes.data = /*filteredFlashcards*/ ctx[1];
    			if (dirty & /*cardIndex*/ 4) flashcard_changes.cardIndex = /*cardIndex*/ ctx[2];
    			if (dirty & /*frontSide*/ 8) flashcard_changes.frontSide = /*frontSide*/ ctx[3];

    			if (!updating_flipped && dirty & /*flipped*/ 16) {
    				updating_flipped = true;
    				flashcard_changes.flipped = /*flipped*/ ctx[4];
    				add_flush_callback(() => updating_flipped = false);
    			}

    			flashcard.$set(flashcard_changes);

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
    			transition_in(flashcard.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(flashcard.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t4);
    			destroy_component(flashcard, detaching);
    			if (detaching) detach_dev(t5);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(19:10) {#if cardIndex < (numberOfCards < filteredFlashcards.length ? numberOfCards : filteredFlashcards.length) && readyToRender}",
    		ctx
    	});

    	return block;
    }

    // (22:12) {#if flipped}
    function create_if_block_3$1(ctx) {
    	let reactionbuttons;
    	let updating_cardIndex;
    	let updating_frontSide;
    	let updating_flipped;
    	let current;

    	function reactionbuttons_cardIndex_binding(value) {
    		/*reactionbuttons_cardIndex_binding*/ ctx[7](value);
    	}

    	function reactionbuttons_frontSide_binding(value) {
    		/*reactionbuttons_frontSide_binding*/ ctx[8](value);
    	}

    	function reactionbuttons_flipped_binding(value) {
    		/*reactionbuttons_flipped_binding*/ ctx[9](value);
    	}

    	let reactionbuttons_props = { data: /*filteredFlashcards*/ ctx[1] };

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
    			if (dirty & /*filteredFlashcards*/ 2) reactionbuttons_changes.data = /*filteredFlashcards*/ ctx[1];

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
    		source: "(22:12) {#if flipped}",
    		ctx
    	});

    	return block;
    }

    // (17:6) {#key cardIndex}
    function create_key_block(ctx) {
    	let div;
    	let div_transition;
    	let current;
    	let mounted;
    	let dispose;

    	let if_block = /*cardIndex*/ ctx[2] < (/*numberOfCards*/ ctx[0] < /*filteredFlashcards*/ ctx[1].length
    	? /*numberOfCards*/ ctx[0]
    	: /*filteredFlashcards*/ ctx[1].length) && /*readyToRender*/ ctx[5] && create_if_block_2$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "card-on-screen svelte-1rcxg7f");
    			add_location(div, file$3, 17, 8, 489);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div, "outrostart", /*outrostart_handler*/ ctx[10], false, false, false),
    					listen_dev(div, "outroend", /*outroend_handler*/ ctx[11], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*cardIndex*/ ctx[2] < (/*numberOfCards*/ ctx[0] < /*filteredFlashcards*/ ctx[1].length
    			? /*numberOfCards*/ ctx[0]
    			: /*filteredFlashcards*/ ctx[1].length) && /*readyToRender*/ ctx[5]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*cardIndex, numberOfCards, filteredFlashcards, readyToRender*/ 39) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_2$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
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
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			if (detaching && div_transition) div_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block.name,
    		type: "key",
    		source: "(17:6) {#key cardIndex}",
    		ctx
    	});

    	return block;
    }

    // (29:2) {#if cardIndex === (numberOfCards < filteredFlashcards.length ? numberOfCards : filteredFlashcards.length)}
    function create_if_block$2(ctx) {
    	let h1;
    	let h1_transition;
    	let current;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Review finished!";
    			attr_dev(h1, "id", "finished");
    			attr_dev(h1, "class", "svelte-1rcxg7f");
    			add_location(h1, file$3, 29, 4, 1326);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h1_transition) h1_transition = create_bidirectional_transition(h1, fade, {}, true);
    				h1_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!h1_transition) h1_transition = create_bidirectional_transition(h1, fade, {}, false);
    			h1_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching && h1_transition) h1_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(29:2) {#if cardIndex === (numberOfCards < filteredFlashcards.length ? numberOfCards : filteredFlashcards.length)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let main;
    	let t0;
    	let t1;
    	let current;
    	let if_block0 = !/*filteredFlashcards*/ ctx[1].length && create_if_block_4(ctx);
    	let if_block1 = /*filteredFlashcards*/ ctx[1].length && create_if_block_1$1(ctx);

    	let if_block2 = /*cardIndex*/ ctx[2] === (/*numberOfCards*/ ctx[0] < /*filteredFlashcards*/ ctx[1].length
    	? /*numberOfCards*/ ctx[0]
    	: /*filteredFlashcards*/ ctx[1].length) && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(main, "class", "svelte-1rcxg7f");
    			add_location(main, file$3, 11, 0, 312);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t0);
    			if (if_block1) if_block1.m(main, null);
    			append_dev(main, t1);
    			if (if_block2) if_block2.m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*filteredFlashcards*/ ctx[1].length) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					if_block0.m(main, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*filteredFlashcards*/ ctx[1].length) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*filteredFlashcards*/ 2) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(main, t1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*cardIndex*/ ctx[2] === (/*numberOfCards*/ ctx[0] < /*filteredFlashcards*/ ctx[1].length
    			? /*numberOfCards*/ ctx[0]
    			: /*filteredFlashcards*/ ctx[1].length)) {
    				if (if_block2) {
    					if (dirty & /*cardIndex, numberOfCards, filteredFlashcards*/ 7) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block$2(ctx);
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
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
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
    	validate_slots("PracticeFlashcard", slots, []);
    	let { numberOfCards } = $$props, { filteredFlashcards } = $$props;
    	let cardIndex = 0;
    	let frontSide = true;
    	let flipped = false;
    	let readyToRender = true;
    	const writable_props = ["numberOfCards", "filteredFlashcards"];

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

    	const outrostart_handler = () => $$invalidate(5, readyToRender = false);
    	const outroend_handler = () => $$invalidate(5, readyToRender = true);

    	$$self.$$set = $$props => {
    		if ("numberOfCards" in $$props) $$invalidate(0, numberOfCards = $$props.numberOfCards);
    		if ("filteredFlashcards" in $$props) $$invalidate(1, filteredFlashcards = $$props.filteredFlashcards);
    	};

    	$$self.$capture_state = () => ({
    		Flashcard,
    		ReactionButtons,
    		fade,
    		numberOfCards,
    		filteredFlashcards,
    		cardIndex,
    		frontSide,
    		flipped,
    		readyToRender
    	});

    	$$self.$inject_state = $$props => {
    		if ("numberOfCards" in $$props) $$invalidate(0, numberOfCards = $$props.numberOfCards);
    		if ("filteredFlashcards" in $$props) $$invalidate(1, filteredFlashcards = $$props.filteredFlashcards);
    		if ("cardIndex" in $$props) $$invalidate(2, cardIndex = $$props.cardIndex);
    		if ("frontSide" in $$props) $$invalidate(3, frontSide = $$props.frontSide);
    		if ("flipped" in $$props) $$invalidate(4, flipped = $$props.flipped);
    		if ("readyToRender" in $$props) $$invalidate(5, readyToRender = $$props.readyToRender);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		numberOfCards,
    		filteredFlashcards,
    		cardIndex,
    		frontSide,
    		flipped,
    		readyToRender,
    		flashcard_flipped_binding,
    		reactionbuttons_cardIndex_binding,
    		reactionbuttons_frontSide_binding,
    		reactionbuttons_flipped_binding,
    		outrostart_handler,
    		outroend_handler
    	];
    }

    class PracticeFlashcard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { numberOfCards: 0, filteredFlashcards: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PracticeFlashcard",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*numberOfCards*/ ctx[0] === undefined && !("numberOfCards" in props)) {
    			console.warn("<PracticeFlashcard> was created without expected prop 'numberOfCards'");
    		}

    		if (/*filteredFlashcards*/ ctx[1] === undefined && !("filteredFlashcards" in props)) {
    			console.warn("<PracticeFlashcard> was created without expected prop 'filteredFlashcards'");
    		}
    	}

    	get numberOfCards() {
    		throw new Error("<PracticeFlashcard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set numberOfCards(value) {
    		throw new Error("<PracticeFlashcard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get filteredFlashcards() {
    		throw new Error("<PracticeFlashcard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set filteredFlashcards(value) {
    		throw new Error("<PracticeFlashcard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Review/ReviewSessionCreator.svelte generated by Svelte v3.38.2 */

    const file$2 = "src/Review/ReviewSessionCreator.svelte";

    // (18:6) {#if numberOfCards > filteredFlashcards.length && filteredFlashcards.length > 0}
    function create_if_block$1(ctx) {
    	let p;
    	let t0;
    	let t1_value = /*filteredFlashcards*/ ctx[2].length + "";
    	let t1;
    	let t2;

    	let t3_value = (/*filteredFlashcards*/ ctx[2].length === 1
    	? "card"
    	: "cards") + "";

    	let t3;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Note that you will only be shown ");
    			t1 = text(t1_value);
    			t2 = space();
    			t3 = text(t3_value);
    			set_style(p, "color", "red");
    			attr_dev(p, "class", "svelte-1q1akv7");
    			add_location(p, file$2, 18, 8, 806);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(p, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*filteredFlashcards*/ 4 && t1_value !== (t1_value = /*filteredFlashcards*/ ctx[2].length + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*filteredFlashcards*/ 4 && t3_value !== (t3_value = (/*filteredFlashcards*/ ctx[2].length === 1
    			? "card"
    			: "cards") + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(18:6) {#if numberOfCards > filteredFlashcards.length && filteredFlashcards.length > 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let main;
    	let div2;
    	let div0;
    	let label;
    	let t1;
    	let input;
    	let t2;
    	let button;
    	let t4;
    	let div1;
    	let p;
    	let t5;
    	let t6;
    	let t7;
    	let t8_value = (/*numberOfCards*/ ctx[1] === 1 ? "card" : "cards") + "";
    	let t8;
    	let t9;
    	let mounted;
    	let dispose;
    	let if_block = /*numberOfCards*/ ctx[1] > /*filteredFlashcards*/ ctx[2].length && /*filteredFlashcards*/ ctx[2].length > 0 && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div2 = element("div");
    			div0 = element("div");
    			label = element("label");
    			label.textContent = "How many cards would you like to review? (1-10)";
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			button = element("button");
    			button.textContent = "Begin";
    			t4 = space();
    			div1 = element("div");
    			p = element("p");
    			t5 = text("Review session of ");
    			t6 = text(/*numberOfCards*/ ctx[1]);
    			t7 = space();
    			t8 = text(t8_value);
    			t9 = space();
    			if (if_block) if_block.c();
    			attr_dev(label, "for", "number-of-cards");
    			attr_dev(label, "class", "svelte-1q1akv7");
    			add_location(label, file$2, 8, 6, 173);
    			attr_dev(input, "type", "number");
    			attr_dev(input, "id", "number-of-cards");
    			attr_dev(input, "name", "number-of-cards");
    			attr_dev(input, "min", "1");
    			attr_dev(input, "max", "10");
    			attr_dev(input, "onkeydown", "return false;");
    			attr_dev(input, "class", "svelte-1q1akv7");
    			add_location(input, file$2, 9, 6, 264);
    			attr_dev(button, "class", "animated-button review-start svelte-1q1akv7");
    			add_location(button, file$2, 10, 6, 406);
    			attr_dev(div0, "id", "card-quantity-selector");
    			attr_dev(div0, "class", "svelte-1q1akv7");
    			add_location(div0, file$2, 7, 4, 133);
    			attr_dev(p, "class", "svelte-1q1akv7");
    			add_location(p, file$2, 16, 6, 628);
    			attr_dev(div1, "id", "session-preview");
    			attr_dev(div1, "class", "svelte-1q1akv7");
    			add_location(div1, file$2, 15, 4, 595);
    			attr_dev(div2, "id", "practice-session-selector");
    			attr_dev(div2, "class", "svelte-1q1akv7");
    			add_location(div2, file$2, 6, 2, 92);
    			attr_dev(main, "class", "svelte-1q1akv7");
    			add_location(main, file$2, 5, 0, 83);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div2);
    			append_dev(div2, div0);
    			append_dev(div0, label);
    			append_dev(div0, t1);
    			append_dev(div0, input);
    			set_input_value(input, /*numberOfCards*/ ctx[1]);
    			append_dev(div0, t2);
    			append_dev(div0, button);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, p);
    			append_dev(p, t5);
    			append_dev(p, t6);
    			append_dev(p, t7);
    			append_dev(p, t8);
    			append_dev(div1, t9);
    			if (if_block) if_block.m(div1, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[3]),
    					listen_dev(button, "click", /*click_handler*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*numberOfCards*/ 2 && to_number(input.value) !== /*numberOfCards*/ ctx[1]) {
    				set_input_value(input, /*numberOfCards*/ ctx[1]);
    			}

    			if (dirty & /*numberOfCards*/ 2) set_data_dev(t6, /*numberOfCards*/ ctx[1]);
    			if (dirty & /*numberOfCards*/ 2 && t8_value !== (t8_value = (/*numberOfCards*/ ctx[1] === 1 ? "card" : "cards") + "")) set_data_dev(t8, t8_value);

    			if (/*numberOfCards*/ ctx[1] > /*filteredFlashcards*/ ctx[2].length && /*filteredFlashcards*/ ctx[2].length > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block) if_block.d();
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ReviewSessionCreator", slots, []);

    	let { practiceMode } = $$props,
    		{ numberOfCards } = $$props,
    		{ filteredFlashcards } = $$props;

    	const writable_props = ["practiceMode", "numberOfCards", "filteredFlashcards"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ReviewSessionCreator> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		numberOfCards = to_number(this.value);
    		$$invalidate(1, numberOfCards);
    	}

    	const click_handler = () => {
    		if (!filteredFlashcards.length) return;
    		$$invalidate(0, practiceMode = !practiceMode);
    	};

    	$$self.$$set = $$props => {
    		if ("practiceMode" in $$props) $$invalidate(0, practiceMode = $$props.practiceMode);
    		if ("numberOfCards" in $$props) $$invalidate(1, numberOfCards = $$props.numberOfCards);
    		if ("filteredFlashcards" in $$props) $$invalidate(2, filteredFlashcards = $$props.filteredFlashcards);
    	};

    	$$self.$capture_state = () => ({
    		practiceMode,
    		numberOfCards,
    		filteredFlashcards
    	});

    	$$self.$inject_state = $$props => {
    		if ("practiceMode" in $$props) $$invalidate(0, practiceMode = $$props.practiceMode);
    		if ("numberOfCards" in $$props) $$invalidate(1, numberOfCards = $$props.numberOfCards);
    		if ("filteredFlashcards" in $$props) $$invalidate(2, filteredFlashcards = $$props.filteredFlashcards);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		practiceMode,
    		numberOfCards,
    		filteredFlashcards,
    		input_input_handler,
    		click_handler
    	];
    }

    class ReviewSessionCreator extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			practiceMode: 0,
    			numberOfCards: 1,
    			filteredFlashcards: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ReviewSessionCreator",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*practiceMode*/ ctx[0] === undefined && !("practiceMode" in props)) {
    			console.warn("<ReviewSessionCreator> was created without expected prop 'practiceMode'");
    		}

    		if (/*numberOfCards*/ ctx[1] === undefined && !("numberOfCards" in props)) {
    			console.warn("<ReviewSessionCreator> was created without expected prop 'numberOfCards'");
    		}

    		if (/*filteredFlashcards*/ ctx[2] === undefined && !("filteredFlashcards" in props)) {
    			console.warn("<ReviewSessionCreator> was created without expected prop 'filteredFlashcards'");
    		}
    	}

    	get practiceMode() {
    		throw new Error("<ReviewSessionCreator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set practiceMode(value) {
    		throw new Error("<ReviewSessionCreator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get numberOfCards() {
    		throw new Error("<ReviewSessionCreator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set numberOfCards(value) {
    		throw new Error("<ReviewSessionCreator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get filteredFlashcards() {
    		throw new Error("<ReviewSessionCreator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set filteredFlashcards(value) {
    		throw new Error("<ReviewSessionCreator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Review/ReviewDashboard.svelte generated by Svelte v3.38.2 */
    const file$1 = "src/Review/ReviewDashboard.svelte";

    // (24:2) {#if !practiceMode}
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
    		value: 9,
    		error: 10,
    		blocks: [,,,]
    	};

    	handle_promise(/*fetchAllFlashcards*/ ctx[3](), info);

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
    		source: "(24:2) {#if !practiceMode}",
    		ctx
    	});

    	return block;
    }

    // (35:4) {:catch error}
    function create_catch_block(ctx) {
    	let p;
    	let t0;
    	let t1_value = /*error*/ ctx[10] + "";
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("An error occurred! ");
    			t1 = text(t1_value);
    			add_location(p, file$1, 35, 6, 1082);
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
    		source: "(35:4) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (27:4) {:then data}
    function create_then_block(ctx) {
    	let t;
    	let if_block1_anchor;
    	let current;
    	let if_block0 = !/*data*/ ctx[9].length && create_if_block_3(ctx);
    	let if_block1 = /*data*/ ctx[9].length && create_if_block_2(ctx);

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
    			if (/*data*/ ctx[9].length) if_block1.p(ctx, dirty);
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
    		source: "(27:4) {:then data}",
    		ctx
    	});

    	return block;
    }

    // (28:6) {#if !data.length}
    function create_if_block_3(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "No flashcards saved! Create some flashcards first...";
    			add_location(p, file$1, 28, 8, 740);
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
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(28:6) {#if !data.length}",
    		ctx
    	});

    	return block;
    }

    // (31:6) {#if data.length}
    function create_if_block_2(ctx) {
    	let flashcardtable;
    	let updating_filteredFlashcards;
    	let t;
    	let reviewsessioncreator;
    	let updating_practiceMode;
    	let updating_numberOfCards;
    	let current;

    	function flashcardtable_filteredFlashcards_binding(value) {
    		/*flashcardtable_filteredFlashcards_binding*/ ctx[5](value);
    	}

    	let flashcardtable_props = { flashcardData: /*data*/ ctx[9] };

    	if (/*filteredFlashcards*/ ctx[2] !== void 0) {
    		flashcardtable_props.filteredFlashcards = /*filteredFlashcards*/ ctx[2];
    	}

    	flashcardtable = new FlashcardTable({
    			props: flashcardtable_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(flashcardtable, "filteredFlashcards", flashcardtable_filteredFlashcards_binding));

    	function reviewsessioncreator_practiceMode_binding(value) {
    		/*reviewsessioncreator_practiceMode_binding*/ ctx[6](value);
    	}

    	function reviewsessioncreator_numberOfCards_binding(value) {
    		/*reviewsessioncreator_numberOfCards_binding*/ ctx[7](value);
    	}

    	let reviewsessioncreator_props = {
    		filteredFlashcards: /*filteredFlashcards*/ ctx[2]
    	};

    	if (/*practiceMode*/ ctx[0] !== void 0) {
    		reviewsessioncreator_props.practiceMode = /*practiceMode*/ ctx[0];
    	}

    	if (/*numberOfCards*/ ctx[1] !== void 0) {
    		reviewsessioncreator_props.numberOfCards = /*numberOfCards*/ ctx[1];
    	}

    	reviewsessioncreator = new ReviewSessionCreator({
    			props: reviewsessioncreator_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(reviewsessioncreator, "practiceMode", reviewsessioncreator_practiceMode_binding));
    	binding_callbacks.push(() => bind(reviewsessioncreator, "numberOfCards", reviewsessioncreator_numberOfCards_binding));

    	const block = {
    		c: function create() {
    			create_component(flashcardtable.$$.fragment);
    			t = space();
    			create_component(reviewsessioncreator.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(flashcardtable, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(reviewsessioncreator, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const flashcardtable_changes = {};

    			if (!updating_filteredFlashcards && dirty & /*filteredFlashcards*/ 4) {
    				updating_filteredFlashcards = true;
    				flashcardtable_changes.filteredFlashcards = /*filteredFlashcards*/ ctx[2];
    				add_flush_callback(() => updating_filteredFlashcards = false);
    			}

    			flashcardtable.$set(flashcardtable_changes);
    			const reviewsessioncreator_changes = {};
    			if (dirty & /*filteredFlashcards*/ 4) reviewsessioncreator_changes.filteredFlashcards = /*filteredFlashcards*/ ctx[2];

    			if (!updating_practiceMode && dirty & /*practiceMode*/ 1) {
    				updating_practiceMode = true;
    				reviewsessioncreator_changes.practiceMode = /*practiceMode*/ ctx[0];
    				add_flush_callback(() => updating_practiceMode = false);
    			}

    			if (!updating_numberOfCards && dirty & /*numberOfCards*/ 2) {
    				updating_numberOfCards = true;
    				reviewsessioncreator_changes.numberOfCards = /*numberOfCards*/ ctx[1];
    				add_flush_callback(() => updating_numberOfCards = false);
    			}

    			reviewsessioncreator.$set(reviewsessioncreator_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(flashcardtable.$$.fragment, local);
    			transition_in(reviewsessioncreator.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(flashcardtable.$$.fragment, local);
    			transition_out(reviewsessioncreator.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(flashcardtable, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(reviewsessioncreator, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(31:6) {#if data.length}",
    		ctx
    	});

    	return block;
    }

    // (25:33)        <p>Fetching all flashcards...</p>     {:then data}
    function create_pending_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Fetching all flashcards...";
    			add_location(p, file$1, 25, 6, 656);
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
    		source: "(25:33)        <p>Fetching all flashcards...</p>     {:then data}",
    		ctx
    	});

    	return block;
    }

    // (40:2) {#if practiceMode}
    function create_if_block(ctx) {
    	let practiceflashcard;
    	let t0;
    	let button;
    	let current;
    	let mounted;
    	let dispose;

    	practiceflashcard = new PracticeFlashcard({
    			props: {
    				filteredFlashcards: /*filteredFlashcards*/ ctx[2],
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
    			attr_dev(button, "class", "animated-button return-button svelte-1jtbn6n");
    			add_location(button, file$1, 41, 4, 1232);
    		},
    		m: function mount(target, anchor) {
    			mount_component(practiceflashcard, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, button, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[8], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const practiceflashcard_changes = {};
    			if (dirty & /*filteredFlashcards*/ 4) practiceflashcard_changes.filteredFlashcards = /*filteredFlashcards*/ ctx[2];
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
    		source: "(40:2) {#if practiceMode}",
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
    			attr_dev(main, "class", "svelte-1jtbn6n");
    			add_location(main, file$1, 21, 0, 542);
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

    	const fetchAllFlashcards = async () => {
    		const response = await fetch("http://localhost:3000/flashcards");
    		const data = await response.json();
    		return data;
    	};

    	const reloadDb = () => {
    		location.reload();
    	};

    	let practiceMode = false;
    	let numberOfCards = 5;
    	let filteredFlashcards = fetchAllFlashcards();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ReviewDashboard> was created with unknown prop '${key}'`);
    	});

    	function flashcardtable_filteredFlashcards_binding(value) {
    		filteredFlashcards = value;
    		$$invalidate(2, filteredFlashcards);
    	}

    	function reviewsessioncreator_practiceMode_binding(value) {
    		practiceMode = value;
    		$$invalidate(0, practiceMode);
    	}

    	function reviewsessioncreator_numberOfCards_binding(value) {
    		numberOfCards = value;
    		$$invalidate(1, numberOfCards);
    	}

    	const click_handler = () => {
    		$$invalidate(0, practiceMode = !practiceMode);
    		reloadDb();
    	};

    	$$self.$capture_state = () => ({
    		FlashcardTable,
    		PracticeFlashcard,
    		ReviewSessionCreator,
    		fetchAllFlashcards,
    		reloadDb,
    		practiceMode,
    		numberOfCards,
    		filteredFlashcards
    	});

    	$$self.$inject_state = $$props => {
    		if ("practiceMode" in $$props) $$invalidate(0, practiceMode = $$props.practiceMode);
    		if ("numberOfCards" in $$props) $$invalidate(1, numberOfCards = $$props.numberOfCards);
    		if ("filteredFlashcards" in $$props) $$invalidate(2, filteredFlashcards = $$props.filteredFlashcards);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		practiceMode,
    		numberOfCards,
    		filteredFlashcards,
    		fetchAllFlashcards,
    		reloadDb,
    		flashcardtable_filteredFlashcards_binding,
    		reviewsessioncreator_practiceMode_binding,
    		reviewsessioncreator_numberOfCards_binding,
    		click_handler
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
    	let nav0;
    	let button0;
    	let span0;
    	let t1;
    	let span1;
    	let t3;
    	let nav1;
    	let button1;
    	let span2;
    	let t5;
    	let span3;
    	let t7;
    	let button2;
    	let span4;
    	let t9;
    	let span5;
    	let t11;
    	let router;
    	let current;
    	let mounted;
    	let dispose;

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
    			nav0 = element("nav");
    			button0 = element("button");
    			span0 = element("span");
    			span0.textContent = "🏠";
    			t1 = space();
    			span1 = element("span");
    			span1.textContent = "Home";
    			t3 = space();
    			nav1 = element("nav");
    			button1 = element("button");
    			span2 = element("span");
    			span2.textContent = "✍️";
    			t5 = space();
    			span3 = element("span");
    			span3.textContent = "Create";
    			t7 = space();
    			button2 = element("button");
    			span4 = element("span");
    			span4.textContent = "📚";
    			t9 = space();
    			span5 = element("span");
    			span5.textContent = "Review";
    			t11 = space();
    			create_component(router.$$.fragment);
    			attr_dev(span0, "class", "emoji svelte-waoheb");
    			add_location(span0, file, 15, 3, 491);
    			attr_dev(span1, "class", "reveal svelte-waoheb");
    			add_location(span1, file, 16, 3, 524);
    			attr_dev(button0, "class", "animated-button nav-button svelte-waoheb");
    			add_location(button0, file, 14, 2, 412);
    			attr_dev(nav0, "id", "top-navbar");
    			attr_dev(nav0, "class", "svelte-waoheb");
    			add_location(nav0, file, 13, 1, 388);
    			attr_dev(span2, "class", "emoji svelte-waoheb");
    			add_location(span2, file, 21, 3, 700);
    			attr_dev(span3, "class", "reveal svelte-waoheb");
    			add_location(span3, file, 22, 3, 733);
    			attr_dev(button1, "class", "animated-button nav-button svelte-waoheb");
    			add_location(button1, file, 20, 2, 605);
    			attr_dev(span4, "class", "emoji svelte-waoheb");
    			add_location(span4, file, 25, 3, 877);
    			attr_dev(span5, "class", "reveal svelte-waoheb");
    			add_location(span5, file, 26, 3, 910);
    			attr_dev(button2, "class", "animated-button nav-button svelte-waoheb");
    			add_location(button2, file, 24, 2, 782);
    			attr_dev(nav1, "id", "bottom-navbar");
    			attr_dev(nav1, "class", "svelte-waoheb");
    			add_location(nav1, file, 19, 1, 578);
    			attr_dev(body, "class", "svelte-waoheb");
    			add_location(body, file, 12, 0, 380);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, body, anchor);
    			append_dev(body, nav0);
    			append_dev(nav0, button0);
    			append_dev(button0, span0);
    			append_dev(button0, t1);
    			append_dev(button0, span1);
    			append_dev(body, t3);
    			append_dev(body, nav1);
    			append_dev(nav1, button1);
    			append_dev(button1, span2);
    			append_dev(button1, t5);
    			append_dev(button1, span3);
    			append_dev(nav1, t7);
    			append_dev(nav1, button2);
    			append_dev(button2, span4);
    			append_dev(button2, t9);
    			append_dev(button2, span5);
    			append_dev(body, t11);
    			mount_component(router, body, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[1], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[2], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	const loadPage = destination => {
    		if (location.hash === destination) location.reload();
    		location.assign(`${location.origin}/${destination}`);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => loadPage("#/");
    	const click_handler_1 = () => loadPage("#/create-dashboard");
    	const click_handler_2 = () => loadPage("#/review-dashboard");

    	$$self.$capture_state = () => ({
    		Router,
    		Home,
    		CreateDashboard,
    		ReviewDashboard,
    		loadPage
    	});

    	return [loadPage, click_handler, click_handler_1, click_handler_2];
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
